"use client";
import Image from "next/image";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeHemisphereWestIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import logo from "@/assets/brand/gi-healthcare-logo.png";
import { meetingTime, type PublicInterview } from "@/lib/interview-types";
import { dateLabel } from "@/lib/booking-dates";
import { MonthPicker } from "./month-picker";
import styles from "./booking.module.css";

export function InterviewBookingForm({ token }: { token?: string }) {
  const [data, setData] = useState<PublicInterview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [zone, setZone] = useState("Europe/London");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [slot, setSlot] = useState("");
  const [details, setDetails] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [privateToken, setPrivateToken] = useState(token || "");
  const requestToken = useRef("");
  const heading = useRef<HTMLHeadingElement>(null);
  const timesPanel = useRef<HTMLDivElement>(null);
  const endpoint = privateToken
    ? `/api/interviews/${privateToken}`
    : "/api/interviews";
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setZone(
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/London",
    );
  }, []);
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
    () => [...new Set(data?.slots.map(dayOf) ?? [])].sort(),
    [data, dayOf],
  );
  const visibleMonth =
    month ||
    days[0]?.slice(0, 7) ||
    dayOf(new Date().toISOString()).slice(0, 7);
  const selectedDay = days.includes(day) ? day : "";
  useEffect(() => {
    if (selectedDay && window.matchMedia("(max-width: 980px)").matches) {
      timesPanel.current?.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    }
  }, [selectedDay]);
  const slots = data?.slots.filter((s) => dayOf(s) === selectedDay) ?? [];
  const timeLabel = (s: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(s));
  useEffect(() => {
    if (details || data?.booking) heading.current?.focus();
  }, [details, data?.booking]);
  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !slot) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (!token && !requestToken.current)
        requestToken.current = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (b) => b.toString(16).padStart(2, "0"),
        ).join("");
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: slot,
          name: form.get("name"),
          email: form.get("email"),
          privacyAcknowledged: form.get("privacy") === "on",
          company: form.get("company"),
          ...(!token ? { bookingToken: requestToken.current } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) {
          setSlot("");
          setDetails(false);
          await load();
        }
        throw new Error(result.error);
      }
      setData(result);
      if (!token) {
        setPrivateToken(requestToken.current);
        window.history.replaceState(null, "", `/book/${requestToken.current}`);
      }
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
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={styles.page}>
      <div
        className={`${styles.shell} ${selectedDay && !details && !data?.booking ? styles.expanded : ""}`}
      >
        <aside className={styles.intro}>
          <a href="/" className={styles.brand} aria-label="GI Healthcare home">
            <Image src={logo} alt="GI Healthcare" width={180} height={52} />
          </a>
          <p className={styles.host}>GI Healthcare</p>
          <h1>{data?.title || "Meet with GI Healthcare"}</h1>
          <div className={styles.facts}>
            <span>
              <ClockIcon size={22} aria-hidden /> {data?.duration || 30} minutes
            </span>
            <span>
              <VideoCameraIcon size={22} aria-hidden /> Microsoft Teams{" "}
              <small>Meeting link provided after booking.</small>
            </span>
            {slot && !data?.booking && (
              <span>
                <CalendarBlankIcon size={22} aria-hidden />{" "}
                {meetingTime(slot, zone)}
                <small>{zone.replaceAll("_", " ")}</small>
              </span>
            )}
          </div>
          <p className={styles.introCopy}>
            Choose a time for a conversation with our team.
          </p>
          <div className={styles.introFooter}>
            <a
              href="/privacy#interview-bookings"
              target="_blank"
              rel="noreferrer"
            >
              Privacy notice
            </a>
            <a href="/contact">Get in touch</a>
          </div>
        </aside>
        <section
          className={styles.panel}
          aria-label="Book a meeting"
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
              className={styles.secondary}
              onClick={() => {
                setError("");
                void load();
              }}
            >
              Try again
            </button>
          ) : data.booking ? (
            <div className={styles.confirmed}>
              <CheckCircleIcon size={42} weight="duotone" aria-hidden />
              <h2 ref={heading} tabIndex={-1}>
                {data.booking.cancelled_at
                  ? "Booking cancelled"
                  : "You’re booked."}
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
                Save this private page to manage your booking. Calendar
                downloads do not update automatically.
              </p>
              <p className={styles.note}>
                {data.emailEnabled
                  ? "Your calendar invitation will be sent by email. If it doesn’t arrive, use the download above."
                  : "Email confirmations are not enabled yet. Please add the calendar event above."}
              </p>
              {!data.booking.cancelled_at &&
                (cancelConfirm ? (
                  <div className={styles.cancelBox}>
                    <p>Cancel this meeting and free up the time?</p>
                    <button
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() => void cancel()}
                    >
                      Yes, cancel meeting
                    </button>
                    <button
                      className={styles.quiet}
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
                    Cancel booking
                  </button>
                ))}
              {data.booking.cancelled_at && (
                <a href="/book">Choose a new time</a>
              )}
            </div>
          ) : details ? (
            <form onSubmit={book} className={styles.form}>
              <button
                className={styles.back}
                type="button"
                onClick={() => {
                  setDetails(false);
                  setError("");
                }}
              >
                <ArrowLeftIcon size={18} /> Change time
              </button>
              <h2 ref={heading} tabIndex={-1}>
                Enter your details
              </h2>
              <fieldset disabled={busy}>
                <label>
                  Full name
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    type="email"
                    required
                    maxLength={254}
                  />
                </label>
                {data.linkedApplication && (
                  <p className={styles.note}>
                    Use the same email address as your application.
                  </p>
                )}
                <label className={styles.honeypot} aria-hidden>
                  Company
                  <input name="company" tabIndex={-1} autoComplete="off" />
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
                  {busy ? "Booking…" : "Confirm booking"}
                  <ArrowRightIcon size={18} aria-hidden />
                </button>
              </fieldset>
            </form>
          ) : (
            <>
              <h2>Select a date & time</h2>
              <div
                className={`${styles.pickerLayout} ${selectedDay ? styles.withTimes : ""}`}
              >
                <div className={styles.calendarColumn}>
                  <MonthPicker
                    month={visibleMonth}
                    onMonth={setMonth}
                    selected={selectedDay}
                    available={days}
                    minMonth={days[0]?.slice(0, 7) || visibleMonth}
                    maxMonth={days.at(-1)?.slice(0, 7) || visibleMonth}
                    onSelect={(d) => {
                      setDay(d);
                      setSlot("");
                      setError("");
                    }}
                  />
                  <label className={styles.zone}>
                    <span>
                      <GlobeHemisphereWestIcon size={18} aria-hidden /> Time
                      zone
                    </span>
                    <select
                      value={zone}
                      onChange={(e) => {
                        setZone(e.target.value);
                        setDay("");
                        setSlot("");
                        setMonth("");
                      }}
                    >
                      {zones.map((z) => (
                        <option key={z} value={z}>
                          {z.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  {!days.length && (
                    <div className={styles.empty}>
                      <p>No times available right now.</p>
                      <button
                        className={styles.secondary}
                        onClick={() => void load()}
                      >
                        Check again
                      </button>
                      <p className={styles.note}>
                        Please ask your host to add availability.
                      </p>
                    </div>
                  )}
                </div>
                {selectedDay && (
                  <div className={styles.timeColumn} ref={timesPanel}>
                    <h3>
                      {dateLabel(selectedDay, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </h3>
                    <div
                      className={styles.slots}
                      role="group"
                      aria-label="Available times"
                    >
                      {slots.map((s) => (
                        <div key={s} className={styles.timeRow}>
                          <button
                            className={styles.time}
                            aria-pressed={slot === s}
                            onClick={() => setSlot(s)}
                          >
                            {timeLabel(s)}
                          </button>
                          {slot === s && (
                            <button
                              className={styles.primary}
                              onClick={() => setDetails(true)}
                            >
                              Next <ArrowRightIcon size={16} aria-hidden />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
