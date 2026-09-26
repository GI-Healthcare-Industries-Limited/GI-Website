export function monthDays(month: string): (string | null)[] {
  const first = new Date(`${month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const last = new Date(first);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return Array.from(
    { length: Math.ceil((offset + last.getUTCDate()) / 7) * 7 },
    (_, i) =>
      i < offset || i >= offset + last.getUTCDate()
        ? null
        : `${month}-${String(i - offset + 1).padStart(2, "0")}`,
  );
}
export function shiftMonth(month: string, offset: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export function dateLabel(
  day: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
  },
) {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}
