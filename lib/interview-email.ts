import "server-only";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { interviewCalendar } from "@/lib/interview-calendar";
import { meetingTime, type InterviewBooking } from "@/lib/interview-types";

// Separate opt-in: an existing generic-alert API key must not enable candidate emails.
export function interviewEmailReady() {
  return (
    process.env.INTERVIEW_EMAIL_PROCESSING_APPROVED === "true" &&
    Boolean(process.env.RESEND_API_KEY) &&
    z.email().safeParse(process.env.INTERVIEW_FROM_EMAIL).success &&
    z.email().safeParse(process.env.INTERVIEW_HOST_EMAIL).success
  );
}
export function bookingEmailPayload(
  booking: InterviewBooking & { title: string },
  from: string,
  host: string,
) {
  const cancelled = Boolean(booking.cancelled_at);
  const ics = interviewCalendar(booking, {
    organizer: from,
    attendee: booking.email,
  });
  return {
    from: `GI Healthcare <${from}>`,
    to: [booking.email],
    bcc: [host],
    reply_to: host,
    subject: `${cancelled ? "Cancelled" : "Confirmed"}: ${booking.title}`,
    text: [
      cancelled
        ? "Your meeting has been cancelled."
        : `Hi ${booking.name}, your meeting is confirmed.`,
      `${booking.title}\n${meetingTime(booking.starts_at)} (UK time)`,
      ...(cancelled ? [] : [`Join Microsoft Teams: ${booking.teams_url}`]),
      "The attached calendar invitation uses your calendar’s local time zone.",
      "Keep your private confirmation page to manage this booking. For help, reply to this email.",
      "GI Healthcare",
    ].join("\n\n"),
    attachments: [
      {
        filename: cancelled ? "cancellation.ics" : "invitation.ics",
        content: Buffer.from(ics).toString("base64"),
        content_type: `text/calendar; charset=utf-8; method=${cancelled ? "CANCEL" : "REQUEST"}`,
      },
    ],
  };
}
// Leases serialize workers; the stored payload + provider key keep retries identical.
// Sent means accepted by Resend, not proof of inbox delivery. Do not log payloads.
export async function flushInterviewEmails() {
  if (!interviewEmailReady()) return;
  const db = getSupabaseAdmin();
  for (let n = 0; n < 5; n++) {
    let id: string | undefined;
    try {
      const { data, error } = await db.rpc("claim_interview_email");
      if (error) throw error;
      const job = data?.[0];
      if (!job) return;
      id = job.id;
      let payload = job.payload;
      if (!payload) {
        const { data: booking, error: be } = await db
          .from("interview_bookings")
          .select(
            "id,invitation_id,name,email,starts_at,ends_at,teams_url,created_at,cancelled_at",
          )
          .eq("id", job.booking_id)
          .single();
        if (be) throw be;
        const { data: invitation, error: ie } = await db
          .from("interview_invitations")
          .select("title")
          .eq("id", booking.invitation_id)
          .single();
        if (ie) throw ie;
        payload = bookingEmailPayload(
          {
            ...booking,
            title: invitation.title,
            cancelled_at:
              job.kind === "cancellation" ? booking.cancelled_at : null,
          },
          process.env.INTERVIEW_FROM_EMAIL!,
          process.env.INTERVIEW_HOST_EMAIL!,
        );
        const { error: pe } = await db
          .from("interview_email_outbox")
          .update({ payload })
          .eq("id", job.id);
        if (pe) throw pe;
      }
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(8000),
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `gi-interview/${job.id}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Provider status ${response.status}`);
      const result = await response.json();
      if (typeof result.id !== "string")
        throw new Error("Provider response invalid");
      const { error: se } = await db
        .from("interview_email_outbox")
        .update({
          sent_at: new Date().toISOString(),
          provider_id: result.id,
          last_error: null,
        })
        .eq("id", job.id);
      if (se) throw se;
    } catch {
      if (id)
        await db
          .from("interview_email_outbox")
          .update({
            last_error: "Sending was not confirmed. Retry or check Resend.",
          })
          .eq("id", id);
      console.error("Interview email delivery needs retry");
      return;
    }
  }
}
