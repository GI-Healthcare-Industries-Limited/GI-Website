"use client";
import Image from "next/image";
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  VideoCameraIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import logo from "@/assets/brand/gi-healthcare-logo.png";
import { meetingTime, type PublicInterview } from "@/lib/interview-types";
import styles from "./booking.module.css";

export function InterviewBookingForm({ token }: { token: string }) {
  const [data, setData] = useState<PublicInterview | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [zone, setZone] = useState("Europe/London"),
    [day, setDay] = useState(""),
    [slot, setSlot] = useState(""),
    [cancelConfirm, setCancelConfirm] = useState(false);
  const endpoint = `/api/interviews/${token}`;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" }),
        result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
    setZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
    );
  }, [load]);
  const zones = [
    ...new Set([
      zone,
      "Europe/London",
      "Europe/Paris",
      "Asia/Kolkata",
      "Asia/Dubai",
      "America/New_York",
      "America/Los_Angeles",
      "Australia/Sydney",
    ]),
  ];
  const dayOf = useCallback(
    (date: string) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(date)),
    [zone],
  );
  const days = useMemo(
    () => [...new Set(data?.slots.map(dayOf) ?? [])],
    [data, dayOf],
  );
  const selectedDay = days.includes(day) ? day : days[0];
  const slots = data?.slots.filter((s) => dayOf(s) === selectedDay) ?? [];
  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !slot) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startsAt: slot,
            name: form.get("name"),
            email: form.get("email"),
            privacyAcknowledged: form.get("privacy") === "on",
            company: form.get("company"),
          }),
        }),
        result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setSlot("");
          await load();
        }
        throw new Error(result.error);
      }
      setData(result);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We could not confirm your booking. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function cancel() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not cancel. Please try again.");
      setCancelConfirm(false);
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" aria-label="GI Healthcare home">
          <Image src={logo} alt="GI Healthcare" width={180} height={52} />
        </a>
        <span>PRIVATE INVITATION</span>
      </header>
      <div className={styles.shell}>
        <aside className={styles.intro}>
          <p className={styles.eyebrow}>Let’s meet</p>
          <h1>{data?.title || "A conversation starts here."}</h1>
          <p>
            Choose a time that works for you. We look forward to meeting you.
          </p>
          <div className={styles.facts}>
            <span>
              <ClockIcon size={20} aria-hidden />
              {data?.duration || 30} minutes
            </span>
            <span>
              <VideoCameraIcon size={20} aria-hidden />
              Microsoft Teams
            </span>
            <span>
              <CalendarBlankIcon size={20} aria-hidden />
              Calendar download included
            </span>
          </div>
          <p className={styles.note}>
            Keep this invitation link private. It lets you view and manage your
            booking.
          </p>
          <a href="/contact">Need a hand?</a>
        </aside>
        <section
          className={styles.panel}
          aria-label="Choose an interview time"
          aria-busy={busy || loading}
        >
          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
          {loading && !data ? (
            <p role="status">Finding available times…</p>
          ) : !data ? (
            <button
              onClick={() => {
                setError("");
                void load();
              }}
            >
              Try again
            </button>
          ) : data.booking ? (
            <div className={styles.confirmed}>
              <CheckCircleIcon size={44} weight="duotone" aria-hidden />
              <p className={styles.eyebrow}>
                {data.booking.cancelled_at
                  ? "Booking cancelled"
                  : "You’re booked"}
              </p>
              <h2>
                {data.booking.cancelled_at
                  ? "Thanks for letting us know."
                  : "See you soon."}
              </h2>
              <p>{meetingTime(data.booking.starts_at, zone)}</p>
              <p className={styles.note}>
                {zone.replaceAll("_", " ")} · {data.duration} minutes
              </p>
              {!data.booking.cancelled_at && (
                <a
                  className={styles.primary}
                  href={data.booking.teams_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join Microsoft Teams <ArrowRightIcon size={18} aria-hidden />
                </a>
              )}
              <a className={styles.download} href={`${endpoint}?calendar=1`}>
                Download{" "}
                {data.booking.cancelled_at ? "cancellation" : "calendar event"}{" "}
                (.ics)
              </a>
              <p className={styles.note}>
                No confirmation email is sent. Save this link and add the
                calendar file to Apple Calendar, Outlook or Google Calendar.
                Calendar downloads do not update automatically.
              </p>
              {!data.booking.cancelled_at &&
                (cancelConfirm ? (
                  <div className={styles.cancelBox}>
                    <p>
                      Cancel this meeting? You’ll need a new invitation to book
                      again. Remove the old event from your calendar too.
                    </p>
                    <button disabled={busy} onClick={() => void cancel()}>
                      Confirm cancellation
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => setCancelConfirm(false)}
                    >
                      Keep booking
                    </button>
                  </div>
                ) : (
                  <button
                    className={styles.quiet}
                    onClick={() => setCancelConfirm(true)}
                  >
                    Cancel this booking
                  </button>
                ))}
              {data.booking.cancelled_at && (
                <p>
                  Please contact the person who invited you if you’d like to
                  arrange a new time.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className={styles.stepHeading}>
                <span>01</span>
                <h2>Pick your time.</h2>
              </div>
              <label className={styles.zone}>
                Times shown in
                <select
                  value={zone}
                  onChange={(e) => {
                    setZone(e.target.value);
                    setDay("");
                    setSlot("");
                  }}
                >
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
              {!days.length ? (
                <div className={styles.empty}>
                  <h3>No times available just now.</h3>
                  <p>
                    Please ask the person who invited you to add more
                    availability.
                  </p>
                  <button onClick={() => void load()}>Check again</button>
                </div>
              ) : (
                <>
                  <div
                    className={styles.days}
                    role="group"
                    aria-label="Available days"
                  >
                    {days.map((d) => (
                      <button
                        type="button"
                        key={d}
                        aria-pressed={d === selectedDay}
                        onClick={() => {
                          setDay(d);
                          setSlot("");
                        }}
                      >
                        <small>
                          {new Intl.DateTimeFormat("en-GB", {
                            weekday: "short",
                            timeZone: "UTC",
                          }).format(new Date(`${d}T12:00Z`))}
                        </small>
                        <strong>{d.slice(-2)}</strong>
                        <small>
                          {new Intl.DateTimeFormat("en-GB", {
                            month: "short",
                            timeZone: "UTC",
                          }).format(new Date(`${d}T12:00Z`))}
                        </small>
                      </button>
                    ))}
                  </div>
                  <div
                    className={styles.slots}
                    role="group"
                    aria-label="Available times"
                  >
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={slot === s}
                        onClick={() => setSlot(s)}
                      >
                        {new Intl.DateTimeFormat("en-GB", {
                          timeZone: zone,
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(s))}
                      </button>
                    ))}
                  </div>
                  {slot && (
                    <form onSubmit={book} className={styles.form}>
                      <div className={styles.stepHeading}>
                        <span>02</span>
                        <h2>A few details.</h2>
                      </div>
                      <p className={styles.selection}>
                        {meetingTime(slot, zone)} · {zone.replaceAll("_", " ")}
                      </p>
                      <fieldset disabled={busy}>
                        <label>
                          Full name
                          <input
                            name="name"
                            autoComplete="name"
                            required
                            minLength={2}
                            maxLength={120}
                          />
                        </label>
                        <label>
                          Email address
                          <input
                            name="email"
                            autoComplete="email"
                            type="email"
                            required
                            maxLength={254}
                          />
                        </label>
                        {data.linkedApplication && (
                          <p className={styles.note}>
                            Use the same email address as your job application.
                          </p>
                        )}
                        <label className={styles.honeypot} aria-hidden>
                          Company
                          <input
                            name="company"
                            tabIndex={-1}
                            autoComplete="off"
                          />
                        </label>
                        <label className={styles.checkbox}>
                          <input type="checkbox" name="privacy" required />
                          <span>
                            I have read the{" "}
                            <a
                              href="/privacy#interview-bookings"
                              target="_blank"
                              rel="noreferrer"
                            >
                              interview privacy information
                            </a>
                            . My details will be used to arrange this meeting.
                          </span>
                        </label>
                        <button className={styles.primary} type="submit">
                          {busy ? "Confirming…" : "Confirm booking"}
                          <ArrowRightIcon size={18} aria-hidden />
                        </button>
                      </fieldset>
                    </form>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>
      <footer className={styles.footer}>
        GI Healthcare · <a href="/privacy">Privacy notice</a>
      </footer>
    </main>
  );
}
