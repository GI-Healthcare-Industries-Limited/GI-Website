export const INTERVIEW_NOTICE_VERSION = "2026-09-25-interviews-v1";
export type InterviewSettings = {
  enabled: boolean;
  teams_url: string;
  duration_minutes: number;
  buffer_minutes: number;
  notice_hours: number;
  updated_at: string;
};
export type AvailabilityWindow = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
};
export type InterviewBooking = {
  id: string;
  invitation_id: string;
  name: string;
  email: string;
  starts_at: string;
  ends_at: string;
  teams_url: string;
  created_at: string;
  cancelled_at: string | null;
};
export type InterviewInvitation = {
  id: string;
  application_id: string | null;
  title: string;
  duration_minutes: number;
  created_at: string;
  expires_at: string;
  retention_expires_at: string;
  revoked: boolean;
};
export type InterviewSnapshot = {
  settings: InterviewSettings;
  availability: AvailabilityWindow[];
  invitations: InterviewInvitation[];
  bookings: InterviewBooking[];
  candidates: {
    id: string;
    name: string;
    job_title: string;
    created_at: string;
  }[];
  checkedAt: string;
};
export type PublicInterview = {
  title: string;
  duration: number;
  expiresAt: string;
  linkedApplication: boolean;
  slots: string[];
  booking: Omit<InterviewBooking, "email" | "invitation_id"> | null;
};
export function londonDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
export function meetingTime(date: string, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
