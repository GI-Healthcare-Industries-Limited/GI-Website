import {
  getInvitation,
  getPublicInterview,
  PRIVATE_HEADERS,
  tokenHash,
} from "@/lib/interviews";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/interview-validation";
import {
  hasAllowedOrigin,
  readSubmissionJson,
  submissionErrorResponse,
} from "@/lib/submissions";
import { interviewCalendar } from "@/lib/interview-calendar";
type Context = { params: Promise<{ token: string }> };
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: PRIVATE_HEADERS });
export async function GET(request: Request, { params }: Context) {
  try {
    const interview = await getPublicInterview((await params).token);
    if (!interview)
      return reply(
        {
          error:
            "This invitation is unavailable or has expired. Please contact the person who invited you.",
        },
        404,
      );
    if (new URL(request.url).searchParams.has("calendar")) {
      if (!interview.booking)
        return reply(
          { error: "Book a time before downloading the calendar event." },
          404,
        );
      return new Response(
        interviewCalendar({ ...interview.booking, title: interview.title }),
        {
          headers: {
            ...PRIVATE_HEADERS,
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="gi-healthcare-interview.ics"',
          },
        },
      );
    }
    return reply(interview);
  } catch {
    return reply(
      {
        error:
          "We could not load the available times. Please try again shortly.",
      },
      503,
    );
  }
}
export async function POST(request: Request, { params }: Context) {
  if (!hasAllowedOrigin(request))
    return reply({ error: "Please book from the GI Healthcare website." }, 403);
  try {
    const token = (await params).token,
      hash = tokenHash(token);
    if (!hash) return reply({ error: "Invitation not found." }, 404);
    const v = bookingSchema.parse(await readSubmissionJson(request, 2500));
    const { error } = await getSupabaseAdmin().rpc("book_interview", {
      invitation_hash: hash,
      requested_start: v.startsAt,
      candidate_name: v.name,
      candidate_email: v.email,
    });
    if (error) {
      const messages: Record<string, string> = {
        SLOT_UNAVAILABLE:
          "That time is no longer available. Please choose another.",
        INVITATION_ALREADY_USED:
          "This invitation has already been used. Please ask for a new invitation.",
        INVITATION_UNAVAILABLE:
          "This invitation has expired or is no longer available.",
        CANDIDATE_EMAIL_MISMATCH:
          "Please use the email address on your job application.",
      };
      for (const [code, message] of Object.entries(messages))
        if (error.message.includes(code)) return reply({ error: message }, 409);
      throw error;
    }
    return reply(await getPublicInterview(token), 201);
  } catch (error) {
    const response = submissionErrorResponse(error);
    for (const [k, v] of Object.entries(PRIVATE_HEADERS))
      response.headers.set(k, v);
    return response;
  }
}
export async function DELETE(request: Request, { params }: Context) {
  if (!hasAllowedOrigin(request))
    return reply({ error: "Please use the GI Healthcare booking page." }, 403);
  try {
    const invitation = await getInvitation((await params).token);
    if (!invitation) return reply({ error: "Invitation unavailable." }, 404);
    const { error } = await getSupabaseAdmin()
      .from("interview_bookings")
      .update({ cancelled_at: new Date().toISOString() })
      .eq("invitation_id", invitation.id)
      .is("cancelled_at", null);
    if (error) throw error;
    return reply({ ok: true });
  } catch {
    return reply(
      { error: "We could not cancel the meeting. Please try again." },
      503,
    );
  }
}
