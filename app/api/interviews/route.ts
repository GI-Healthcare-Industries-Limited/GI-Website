import { after } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingSchema } from "@/lib/interview-validation";
import {
  getPublicInterview,
  PRIVATE_HEADERS,
  tokenHash,
} from "@/lib/interviews";
import {
  getRequestFingerprint,
  hasAllowedOrigin,
  readSubmissionJson,
  submissionErrorResponse,
} from "@/lib/submissions";
import {
  flushInterviewEmails,
  interviewEmailReady,
} from "@/lib/interview-email";
const reply = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_HEADERS });
export async function GET() {
  try {
    const db = getSupabaseAdmin();
    const { data: settings, error } = await db
      .from("interview_settings")
      .select("enabled,duration_minutes,email_enabled")
      .single();
    if (error) throw error;
    const { data: slots, error: se } = await db.rpc("shared_interview_slots");
    if (se) throw se;
    return reply({
      title: "Meet with GI Healthcare",
      duration: settings.duration_minutes,
      expiresAt: "",
      linkedApplication: false,
      booking: null,
      emailEnabled: settings.email_enabled && interviewEmailReady(),
      slots: (slots || []).map((s: { starts_at: string }) => s.starts_at),
    });
  } catch {
    return reply(
      { error: "We couldn’t load available times. Please try again shortly." },
      503,
    );
  }
}
export async function POST(request: Request) {
  if (!hasAllowedOrigin(request))
    return reply({ error: "Please book from the GI Healthcare website." }, 403);
  try {
    const { bookingToken, ...input } = z
      .object({ bookingToken: z.string().regex(/^[a-f0-9]{64}$/) })
      .passthrough()
      .parse(await readSubmissionJson(request, 3000));
    const v = bookingSchema.parse(input);
    const { error } = await getSupabaseAdmin().rpc("book_shared_interview", {
      invitation_hash: tokenHash(bookingToken),
      requested_start: v.startsAt,
      candidate_name: v.name,
      candidate_email: v.email,
      fingerprint: getRequestFingerprint(request),
    });
    if (error) {
      if (error.message.includes("BOOKING_LIMIT"))
        return reply(
          {
            error:
              "Too many bookings. Please try again later or contact your host.",
          },
          429,
        );
      if (
        [
          "SLOT_UNAVAILABLE",
          "INVITATION_ALREADY_USED",
          "INVITATION_UNAVAILABLE",
        ].some((c) => error.message.includes(c))
      )
        return reply(
          { error: "That time is no longer available. Please choose another." },
          409,
        );
      throw error;
    }
    after(flushInterviewEmails);
    return reply(await getPublicInterview(bookingToken), 201);
  } catch (error) {
    const response = submissionErrorResponse(error);
    for (const [key, value] of Object.entries(PRIVATE_HEADERS))
      response.headers.set(key, value);
    return response;
  }
}
