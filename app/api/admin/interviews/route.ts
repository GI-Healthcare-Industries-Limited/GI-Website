import { randomBytes } from "node:crypto";
import { requireWebsiteAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { readSubmissionJson, submissionErrorResponse } from "@/lib/submissions";
import { PRIVATE_HEADERS, tokenHash } from "@/lib/interviews";
import {
  availabilitySchema,
  invitationSchema,
  schedulingActionSchema,
  settingsSchema,
} from "@/lib/interview-validation";
import { londonDate } from "@/lib/interview-types";
import { SITE_URL } from "@/lib/job-discovery";
import { interviewCalendar } from "@/lib/interview-calendar";
import { after } from "next/server";
import {
  flushInterviewEmails,
  interviewEmailReady,
} from "@/lib/interview-email";

const headers = { ...PRIVATE_HEADERS, Vary: "Authorization" };
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers });
function endOfLondonDay(day: string) {
  const noon = new Date(`${day}T12:00:00Z`);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(noon),
  );
  return new Date(
    Date.parse(`${day}T00:00:00Z`) + 86400000 - (hour - 12) * 3600000,
  ).toISOString();
}
export async function GET(request: Request) {
  if (!(await requireWebsiteAdmin(request)))
    return reply({ error: "Unauthorized" }, 401);
  try {
    const db = getSupabaseAdmin(),
      now = new Date().toISOString(),
      url = new URL(request.url);
    const { data: invitations, error: ie } = await db
      .from("interview_invitations")
      .select(
        "id,application_id,title,duration_minutes,created_at,expires_at,retention_expires_at,revoked",
      )
      .gt("retention_expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (ie) throw ie;
    const [settings, availability, bookings, candidates] = await Promise.all([
      db
        .from("interview_settings")
        .select(
          "enabled,email_enabled,teams_url,duration_minutes,buffer_minutes,notice_hours,updated_at",
        )
        .single(),
      db
        .from("interview_availability")
        .select("id,day,start_time,end_time")
        .gte("day", londonDate(now))
        .order("day")
        .order("start_time")
        .limit(1000),
      invitations?.length
        ? db
            .from("interview_bookings")
            .select(
              "id,invitation_id,name,email,starts_at,ends_at,teams_url,created_at,cancelled_at",
            )
            .in(
              "invitation_id",
              invitations.map((i) => i.id),
            )
            .order("starts_at")
        : Promise.resolve({ data: [], error: null }),
      db
        .from("career_applications")
        .select("id,name,job_title,created_at")
        .gt("retention_expires_at", now)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);
    for (const result of [settings, availability, bookings, candidates])
      if (result.error) throw result.error;
    if (url.searchParams.has("download")) {
      const booking = bookings.data?.find(
        (b) => b.id === url.searchParams.get("download"),
      );
      if (!booking) return reply({ error: "Booking not found." }, 404);
      const title =
        invitations?.find((i) => i.id === booking.invitation_id)?.title ||
        "GI Healthcare interview";
      return new Response(
        interviewCalendar({ ...booking, title: `${title} — ${booking.name}` }),
        {
          headers: {
            ...headers,
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition":
              'attachment; filename="gi-healthcare-interview.ics"',
          },
        },
      );
    }
    const pending = await db
      .from("interview_email_outbox")
      .select("id", { count: "exact", head: true })
      .is("sent_at", null)
      .is("skipped_at", null);
    if (pending.error) throw pending.error;
    return reply({
      emailReady: interviewEmailReady(),
      pendingEmails: pending.count || 0,
      settings: settings.data,
      availability: availability.data,
      invitations,
      bookings: bookings.data,
      candidates: candidates.data,
      checkedAt: now,
    });
  } catch {
    return reply(
      {
        error:
          "The interview calendar is temporarily unavailable. Please try again.",
      },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!(await requireWebsiteAdmin(request)))
    return reply({ error: "Unauthorized" }, 401);
  try {
    const input = await readSubmissionJson(request, 6000),
      db = getSupabaseAdmin();
    const action =
      input && typeof input === "object" && "action" in input
        ? input.action
        : null;
    if (action === "settings") {
      const v = settingsSchema.parse(input);
      if (v.emailEnabled && !interviewEmailReady())
        return reply(
          {
            error:
              "Complete Resend configuration and approve email processing before enabling confirmations.",
          },
          400,
        );
      const { data, error } = await db
        .from("interview_settings")
        .update({
          enabled: v.enabled,
          ...(v.emailEnabled !== undefined
            ? { email_enabled: v.emailEnabled }
            : {}),
          teams_url: v.teamsUrl,
          duration_minutes: v.duration,
          buffer_minutes: v.buffer,
          notice_hours: v.notice,
          updated_at: new Date().toISOString(),
        })
        .eq("id", true)
        .eq("updated_at", v.expectedUpdatedAt)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data)
        return reply(
          { error: "Settings changed in another tab. Refresh before saving." },
          409,
        );
    } else if (action === "retry-emails") {
      if (!interviewEmailReady())
        return reply({ error: "Email sending is not configured." }, 400);
      await flushInterviewEmails();
    } else if (action === "availability") {
      const v = availabilitySchema.parse(input),
        today = londonDate(new Date()),
        latest = londonDate(new Date(Date.now() + 60 * 86400000));
      if (v.day < today || v.day > latest)
        return reply({ error: "Choose a date within the next 60 days." }, 400);
      const { error } = await db
        .from("interview_availability")
        .upsert(
          { day: v.day, start_time: v.start, end_time: v.end },
          { onConflict: "day,start_time,end_time" },
        );
      if (error) throw error;
    } else if (action === "invite") {
      const v = invitationSchema.parse(input);
      const { data: settings, error: se } = await db
        .from("interview_settings")
        .select("*")
        .single();
      if (se) throw se;
      if (!settings?.enabled || !settings.teams_url)
        return reply(
          { error: "Add a Teams link and enable bookings in Settings first." },
          400,
        );
      const expiry = endOfLondonDay(v.expiresOn),
        latest = Date.now() + 60 * 86400000;
      if (
        Date.parse(expiry) <= Date.now() + 3600000 ||
        Date.parse(expiry) > latest
      )
        return reply(
          {
            error:
              "Choose an invitation deadline between tomorrow and 60 days from now.",
          },
          400,
        );
      const created = new Date();
      // SQL uses calendar months for the existing application policy; ask it for the same expiry.
      const { data: retentionAt, error: re } = await db.rpc(
        "submission_retention_expiry",
        { submitted_at: created.toISOString() },
      );
      if (re) throw re;
      let retentionExpiry = String(retentionAt);
      if (v.applicationId) {
        const { data: application, error } = await db
          .from("career_applications")
          .select("id,retention_expires_at")
          .eq("id", v.applicationId)
          .gt("retention_expires_at", created.toISOString())
          .maybeSingle();
        if (error) throw error;
        if (!application)
          return reply(
            { error: "That application is no longer available." },
            404,
          );
        retentionExpiry = application.retention_expires_at;
      }
      if (Date.parse(expiry) >= Date.parse(retentionExpiry))
        return reply(
          {
            error:
              "This invitation must end before the application’s automatic deletion date.",
          },
          400,
        );
      const token = randomBytes(32).toString("hex");
      const { error } = await db.from("interview_invitations").insert({
        token_hash: tokenHash(token),
        application_id: v.applicationId,
        title: v.title,
        duration_minutes: settings.duration_minutes,
        buffer_minutes: settings.buffer_minutes,
        expires_at: expiry,
        retention_expires_at: retentionExpiry,
      });
      if (error) throw error;
      return reply({ ok: true, url: `${SITE_URL}/book/${token}` }, 201);
    } else {
      const v = schedulingActionSchema.parse(input);
      if (v.action === "remove-availability") {
        const { error } = await db
          .from("interview_availability")
          .delete()
          .eq("id", v.id);
        if (error) throw error;
      } else if (v.action === "revoke-invite") {
        const { error } = await db.rpc("revoke_interview_invitation", {
          invitation_id: v.id,
        });
        if (error?.message.includes("INVITATION_ALREADY_USED"))
          return reply(
            {
              error:
                "This invitation already has a booking. Use Cancel meeting instead.",
            },
            409,
          );
        if (error) throw error;
      } else {
        const { error } = await db
          .from("interview_bookings")
          .update({ cancelled_at: new Date().toISOString() })
          .eq("id", v.id)
          .is("cancelled_at", null);
        if (error) throw error;
        after(flushInterviewEmails);
      }
    }
    return reply({ ok: true });
  } catch (error) {
    const response = submissionErrorResponse(error);
    for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
    return response;
  }
}
