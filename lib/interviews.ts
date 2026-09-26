import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { PublicInterview } from "@/lib/interview-types";
import { interviewEmailReady } from "@/lib/interview-email";
export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
};
export function tokenHash(token: string) {
  return /^[a-f0-9]{64}$/.test(token)
    ? createHash("sha256").update(token).digest("hex")
    : null;
}
export async function getInvitation(token: string) {
  const hash = tokenHash(token);
  if (!hash) return null;
  const { data, error } = await getSupabaseAdmin()
    .from("interview_invitations")
    .select(
      "id,title,duration_minutes,application_id,expires_at,retention_expires_at,revoked",
    )
    .eq("token_hash", hash)
    .gt("retention_expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data && !data.revoked ? data : null;
}
export async function getPublicInterview(
  token: string,
): Promise<PublicInterview | null> {
  const invitation = await getInvitation(token);
  if (!invitation) return null;
  const db = getSupabaseAdmin();
  const { data: booking, error } = await db
    .from("interview_bookings")
    .select("id,name,starts_at,ends_at,teams_url,created_at,cancelled_at")
    .eq("invitation_id", invitation.id)
    .maybeSingle();
  if (error) throw error;
  if (!booking && Date.parse(invitation.expires_at) <= Date.now()) return null;
  const { data: slots, error: slotError } = booking
    ? { data: [], error: null }
    : await db.rpc("interview_available_slots", {
        invitation_hash: tokenHash(token),
      });
  if (slotError) throw slotError;
  const { data: settings, error: settingsError } = await db
    .from("interview_settings")
    .select("email_enabled")
    .single();
  if (settingsError) throw settingsError;
  return {
    emailEnabled: Boolean(settings.email_enabled && interviewEmailReady()),
    title: invitation.title,
    duration: invitation.duration_minutes,
    expiresAt: invitation.expires_at,
    linkedApplication: Boolean(invitation.application_id),
    slots: (slots ?? []).map((s: { starts_at: string }) => s.starts_at),
    booking,
  };
}
