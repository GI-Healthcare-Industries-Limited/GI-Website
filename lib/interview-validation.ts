import { z } from "zod";
export function isTeamsUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      [
        "teams.microsoft.com",
        "teams.live.com",
        "teams.cloud.microsoft",
      ].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}
export const settingsSchema = z
  .object({
    action: z.literal("settings"),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    enabled: z.boolean(),
    emailEnabled: z.boolean().optional(),
    teamsUrl: z
      .string()
      .trim()
      .max(2048)
      .refine(
        (v) => !v || isTeamsUrl(v),
        "Enter a valid HTTPS Microsoft Teams meeting link.",
      ),
    duration: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
    ]),
    buffer: z.union([
      z.literal(0),
      z.literal(10),
      z.literal(15),
      z.literal(30),
    ]),
    notice: z.number().int().min(1).max(168),
  })
  .strict()
  .refine(
    (v) => !v.enabled || Boolean(v.teamsUrl),
    "Add a Teams meeting link before enabling bookings.",
  );
export const availabilitySchema = z
  .object({
    action: z.literal("availability"),
    day: z.iso.date(),
    start: z.string().regex(/^\d{2}:\d{2}$/),
    end: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .strict()
  .refine(
    (v) =>
      v.start >= "06:00" &&
      v.end <= "22:00" &&
      v.start < v.end &&
      Number(v.start.slice(3)) < 60 &&
      Number(v.end.slice(3)) < 60,
    "Choose a time window between 06:00 and 22:00, UK time.",
  );
export const invitationSchema = z
  .object({
    action: z.literal("invite"),
    title: z.string().trim().min(2).max(120),
    applicationId: z.uuid().nullable(),
    expiresOn: z.iso.date(),
  })
  .strict();
export const schedulingActionSchema = z
  .object({
    action: z.enum(["remove-availability", "revoke-invite", "cancel-booking"]),
    id: z.uuid(),
  })
  .strict();
export const bookingSchema = z
  .object({
    startsAt: z.iso.datetime({ offset: true }),
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: z.email().trim().max(254),
    privacyAcknowledged: z.literal(true, {
      error: "Please confirm you have read the interview privacy information.",
    }),
    company: z.string().max(0).optional(),
  })
  .strict();
