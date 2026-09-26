type CalendarMeeting = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  teams_url: string;
  created_at: string;
  cancelled_at: string | null;
};
function text(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}
function stamp(value: string) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
// RFC 5545 folds at 75 octets, not JS characters (names may contain Unicode).
function fold(line: string) {
  const rows: string[] = [];
  let row = "",
    length = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char);
    if (length + size > 75) {
      rows.push(row);
      row = " ";
      length = 1;
    }
    row += char;
    length += size;
  }
  return [...rows, row].join("\r\n");
}
export function interviewCalendar(
  meeting: CalendarMeeting,
  invitation?: { organizer: string; attendee: string },
) {
  if (
    invitation &&
    ![invitation.organizer, invitation.attendee].every((email) =>
      /^[^\s<>:;,"\\]+@[^\s<>:;,"\\]+\.[^\s<>:;,"\\]+$/.test(email),
    )
  )
    throw new Error("Invalid calendar address");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GI Healthcare//Interview booking//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${invitation ? (meeting.cancelled_at ? "CANCEL" : "REQUEST") : "PUBLISH"}`,
    "BEGIN:VEVENT",
    `UID:${meeting.id}@gihealthcare.co.uk`,
    `DTSTAMP:${stamp(meeting.cancelled_at || meeting.created_at)}`,
    `DTSTART:${stamp(meeting.starts_at)}`,
    `DTEND:${stamp(meeting.ends_at)}`,
    `SUMMARY:${text(meeting.title)}`,
    `DESCRIPTION:${text(`GI Healthcare interview\nJoin Microsoft Teams: ${meeting.teams_url}\nKeep your private booking link to manage this meeting. Calendar downloads do not sync automatically.`)}`,
    `LOCATION:${text(meeting.teams_url)}`,
    `STATUS:${meeting.cancelled_at ? "CANCELLED" : "CONFIRMED"}`,
    `SEQUENCE:${meeting.cancelled_at ? 1 : 0}`,
    ...(invitation
      ? [
          `ORGANIZER;CN=GI Healthcare:mailto:${invitation.organizer}`,
          `ATTENDEE;RSVP=TRUE;ROLE=REQ-PARTICIPANT:mailto:${invitation.attendee}`,
        ]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ]
    .map(fold)
    .join("\r\n");
}
