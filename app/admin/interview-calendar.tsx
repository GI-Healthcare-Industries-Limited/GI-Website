"use client";
import {
  CalendarBlankIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CopyIcon,
  PlusIcon,
  VideoCameraIcon,
  DownloadSimpleIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import type { Session } from "@supabase/supabase-js";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  londonDate,
  meetingTime,
  type InterviewSnapshot,
} from "@/lib/interview-types";
import styles from "./interview-calendar.module.css";
import { MonthPicker } from "@/app/book/month-picker";
import { dateLabel } from "@/lib/booking-dates";

type Candidate = { id: string; name: string; job_title: string };
export function InterviewCalendar({
  session,
  inviteCandidate,
  onInviteHandled,
}: {
  session: Session;
  inviteCandidate: Candidate | null;
  onInviteHandled: () => void;
}) {
  const [data, setData] = useState<InterviewSnapshot | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"calendar" | "availability" | "settings">(
      "availability",
    ),
    [selectedDay, setSelectedDay] = useState(() => londonDate(new Date())),
    [month, setMonth] = useState(() => londonDate(new Date()).slice(0, 7));
  const [inviting, setInviting] = useState(false),
    [candidate, setCandidate] = useState(""),
    [createdLink, setCreatedLink] = useState(""),
    [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const availableDates = Array.from({ length: 61 }, (_, i) =>
    londonDate(new Date(Date.now() + i * 86400000)),
  );
  const [confirm, setConfirm] = useState<{ action: string; id: string } | null>(
    null,
  );
  const confirmDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirm) confirmDialog.current?.showModal();
    else confirmDialog.current?.close();
  }, [confirm]);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const response = await fetch("/api/admin/interviews", {
          headers: {
            Authorization: `Bearer ${sessionRef.current.access_token}`,
          },
          cache: "no-store",
        }),
        result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) {
        setData(null);
        setError(e instanceof Error ? e.message : "Could not load interviews.");
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [session.user.id]);
  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 60000);
    return () => {
      requestId.current++;
      clearInterval(interval);
    };
  }, [load]);
  useEffect(() => {
    if (inviteCandidate) {
      setCandidate(inviteCandidate.id);
      setInviting(true);
      setCreatedLink("");
      onInviteHandled();
    }
  }, [inviteCandidate, onInviteHandled]);
  async function mutate(body: unknown) {
    if (busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/interviews", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionRef.current.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }),
        result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.url) {
        setCreatedLink(result.url);
        setCopied(false);
        setInviting(false);
      } else setNotice("Saved.");
      setConfirm(null);
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function download(id: string) {
    setError("");
    try {
      const response = await fetch(`/api/admin/interviews?download=${id}`, {
        headers: { Authorization: `Bearer ${sessionRef.current.access_token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Could not download this meeting.");
      const url = URL.createObjectURL(await response.blob()),
        link = document.createElement("a");
      link.href = url;
      link.download = "gi-healthcare-interview.ics";
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e));
    }
  }
  function moveMonth(offset: number) {
    const date = new Date(`${month}-01T12:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 7));
  }
  const first = new Date(`${month}-01T12:00Z`),
    offset = (first.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(first);
    d.setUTCDate(1 - offset + i);
    return d.toISOString().slice(0, 10);
  });
  const upcoming =
    data?.bookings.filter(
      (b) => !b.cancelled_at && Date.parse(b.ends_at) > Date.now(),
    ) ?? [];
  const bookingsForDay =
    data?.bookings.filter((b) => londonDate(b.starts_at) === selectedDay) ?? [];
  const candidatesForDay =
    data?.candidates.filter((c) => londonDate(c.created_at) === selectedDay) ??
    [];
  const pending =
    data?.invitations.filter(
      (i) =>
        !i.revoked &&
        Date.parse(i.expires_at) > Date.now() &&
        !data.bookings.some((b) => b.invitation_id === i.id),
    ) ?? [];
  async function submitInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await mutate({
      action: "invite",
      applicationId: candidate || null,
      title: form.get("title"),
      expiresOn: form.get("expiresOn"),
    });
  }
  return (
    <section className={styles.workspace} aria-label="Interview scheduling">
      <div className={styles.shareHeader}>
        <div>
          <h2>Your booking page</h2>
          <p>
            Set your hours, then share one link. Booked times disappear
            automatically.
          </p>
        </div>
        <div className={styles.shareActions}>
          <a href="/book" target="_blank" rel="noreferrer">
            Preview page
          </a>
          <button
            className={styles.primary}
            disabled={!data?.settings.enabled}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${window.location.origin}/book`,
                );
                setShareCopied(true);
              } catch {
                setError("Could not copy. Your booking link is shown below.");
              }
            }}
          >
            {shareCopied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
            {shareCopied ? "Copied" : "Copy booking link"}
          </button>
        </div>
        <div className={styles.shareAddress}>
          <span
            className={data?.settings.enabled ? styles.live : styles.paused}
          >
            {data?.settings.enabled ? "Live" : "Paused"}
          </span>
          <code>www.gihealthcare.co.uk/book</code>
        </div>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="group" aria-label="Scheduling view">
          {(["availability", "calendar", "settings"] as const).map((t) => (
            <button
              type="button"
              aria-pressed={tab === t}
              key={t}
              onClick={() => setTab(t)}
            >
              {
                {
                  availability: "Availability",
                  calendar: "Bookings",
                  settings: "Meeting settings",
                }[t]
              }
            </button>
          ))}
        </div>
        <button
          className={styles.quiet}
          disabled={!data || busy}
          onClick={() => {
            setInviting(true);
            setCandidate("");
            setCreatedLink("");
          }}
        >
          <PlusIcon size={17} aria-hidden />
          Private candidate link
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}{" "}
          <button
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Refresh
          </button>
        </p>
      )}
      {notice && (
        <p className={styles.notice} role="status">
          {notice}
        </p>
      )}
      {loading && !data ? (
        <p>Loading your calendar…</p>
      ) : !data ? null : (
        <>
          {!data.settings.enabled && (
            <div className={styles.setup}>
              <VideoCameraIcon size={22} aria-hidden />
              <div>
                <strong>Finish your booking setup</strong>
                <p>
                  Add your reusable Teams meeting link in Settings, then enable
                  bookings. You can add availability now.
                </p>
              </div>
              <button onClick={() => setTab("settings")}>Open settings</button>
            </div>
          )}
          {createdLink && (
            <div className={styles.linkBox} role="status">
              <strong>Your private invitation is ready</strong>
              <p>
                Send this link to one candidate. It accepts one booking. Save it
                now; the full link is not stored in the portal.
              </p>
              <div>
                <input
                  aria-label="Private booking link"
                  readOnly
                  value={createdLink}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdLink);
                      setCopied(true);
                    } catch {
                      setError("Select the link and copy it manually.");
                    }
                  }}
                >
                  {copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}{" "}
                  {copied ? "Copied" : "Copy link"}
                </button>
              </div>
              <button
                className={styles.quiet}
                onClick={() => setCreatedLink("")}
              >
                Dismiss
              </button>
            </div>
          )}
          {inviting && (
            <form className={styles.editor} onSubmit={submitInvite}>
              <div className={styles.heading}>
                <h2>Invite someone to meet.</h2>
                <button type="button" onClick={() => setInviting(false)}>
                  Close
                </button>
              </div>
              <fieldset disabled={busy}>
                <label>
                  Candidate
                  <select
                    value={candidate}
                    onChange={(e) => setCandidate(e.target.value)}
                  >
                    <option value="">
                      Someone not in the application inbox
                    </option>
                    {data.candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.job_title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Meeting title
                  <input
                    name="title"
                    required
                    minLength={2}
                    maxLength={120}
                    defaultValue="A conversation with GI Healthcare"
                  />
                </label>
                <label>
                  Availability and booking deadline
                  <input
                    name="expiresOn"
                    type="date"
                    required
                    min={londonDate(new Date(Date.now() + 86400000))}
                    max={londonDate(new Date(Date.now() + 59 * 86400000))}
                    defaultValue={londonDate(
                      new Date(Date.now() + 14 * 86400000),
                    )}
                  />
                </label>
                <p className={styles.help}>
                  One {data.settings.duration_minutes}-minute meeting, with a{" "}
                  {data.settings.buffer_minutes}-minute buffer. Candidates can
                  only choose times before this deadline. Linked bookings share
                  the application’s deletion date.
                </p>
                <button
                  className={styles.primary}
                  type="submit"
                  disabled={!data.settings.enabled}
                >
                  Create private link
                </button>
              </fieldset>
            </form>
          )}
          {tab === "calendar" && (
            <>
              <div className={styles.metrics}>
                <div>
                  <span>UPCOMING</span>
                  <strong>{upcoming.length}</strong>
                  <small>confirmed conversations</small>
                </div>
                <div>
                  <span>INVITATIONS</span>
                  <strong>{pending.length}</strong>
                  <small>waiting for a booking</small>
                </div>
                <div>
                  <span>AVAILABILITY</span>
                  <strong>{data.availability.length}</strong>
                  <small>time windows published</small>
                </div>
              </div>
              <div className={styles.calendarLayout}>
                <div className={styles.calendar}>
                  <header className={styles.calendarHeader}>
                    <h2>
                      {new Intl.DateTimeFormat("en-GB", {
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(first)}
                    </h2>
                    <div>
                      <button
                        aria-label="Previous month"
                        onClick={() => moveMonth(-1)}
                      >
                        <CaretLeftIcon size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setMonth(londonDate(new Date()).slice(0, 7));
                          setSelectedDay(londonDate(new Date()));
                        }}
                      >
                        Today
                      </button>
                      <button
                        aria-label="Next month"
                        onClick={() => moveMonth(1)}
                      >
                        <CaretRightIcon size={18} />
                      </button>
                    </div>
                  </header>
                  <div className={styles.weekdays}>
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </div>
                  <div className={styles.month}>
                    {cells.map((d) => {
                      const events = data.bookings.filter(
                          (b) =>
                            !b.cancelled_at && londonDate(b.starts_at) === d,
                        ),
                        apps = data.candidates.filter(
                          (c) => londonDate(c.created_at) === d,
                        );
                      return (
                        <button
                          key={d}
                          className={`${!d.startsWith(month) ? styles.outside : ""} ${d === londonDate(new Date()) ? styles.today : ""}`}
                          aria-pressed={d === selectedDay}
                          aria-label={`${d}, ${events.length} interviews, ${apps.length} applications`}
                          onClick={() => setSelectedDay(d)}
                        >
                          <span>{Number(d.slice(-2))}</span>
                          {events.slice(0, 2).map((b) => (
                            <small className={styles.event} key={b.id}>
                              {new Intl.DateTimeFormat("en-GB", {
                                timeZone: "Europe/London",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(b.starts_at))}{" "}
                              {b.name}
                            </small>
                          ))}
                          {events.length > 2 && (
                            <small>+{events.length - 2} more</small>
                          )}
                          {apps.length > 0 && (
                            <small className={styles.appCount}>
                              {apps.length} application
                              {apps.length !== 1 ? "s" : ""}
                            </small>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <footer className={styles.legend}>
                    <span>● Interviews</span>
                    <span>● Applications received</span>
                    <span>All times: Europe/London</span>
                  </footer>
                </div>
                <aside className={styles.agenda}>
                  <p className={styles.eyebrow}>Your day</p>
                  <h2>
                    {new Intl.DateTimeFormat("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    }).format(new Date(`${selectedDay}T12:00Z`))}
                  </h2>
                  {bookingsForDay.length ? (
                    bookingsForDay.map((b) => (
                      <article className={styles.meeting} key={b.id}>
                        <p className={styles.time}>
                          {meetingTime(b.starts_at)}
                          {b.cancelled_at ? " · Cancelled" : ""}
                        </p>
                        <h3>{b.name}</h3>
                        <p>{b.email}</p>
                        <p>
                          {
                            data.invitations.find(
                              (i) => i.id === b.invitation_id,
                            )?.title
                          }
                        </p>
                        <div className={styles.actions}>
                          {!b.cancelled_at && (
                            <a
                              href={b.teams_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Join Teams
                            </a>
                          )}
                          <button onClick={() => void download(b.id)}>
                            <DownloadSimpleIcon size={15} aria-hidden /> .ics
                          </button>
                          {!b.cancelled_at && (
                            <button
                              onClick={() =>
                                setConfirm({
                                  action: "cancel-booking",
                                  id: b.id,
                                })
                              }
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className={styles.empty}>
                      <CalendarBlankIcon size={30} aria-hidden />
                      <p>No interviews scheduled.</p>
                    </div>
                  )}
                  {candidatesForDay.length > 0 && (
                    <div className={styles.received}>
                      <h3>Applications received</h3>
                      {candidatesForDay.map((c) => (
                        <p key={c.id}>
                          <strong>{c.name}</strong>
                          <small>{c.job_title}</small>
                        </p>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
              <section className={styles.invites}>
                <h2>Invitation links</h2>
                <p className={styles.help}>
                  Private, single-use links. Expiry does not cancel a confirmed
                  meeting. Revoke unused links here.
                </p>
                {data.invitations.length ? (
                  data.invitations.map((i) => {
                    const booking = data.bookings.find(
                      (b) => b.invitation_id === i.id,
                    );
                    return (
                      <div className={styles.inviteRow} key={i.id}>
                        <div>
                          <strong>
                            {data.candidates.find(
                              (c) => c.id === i.application_id,
                            )?.name || i.title}
                          </strong>
                          <small>
                            {i.title} · {i.duration_minutes} min · expires{" "}
                            {meetingTime(i.expires_at)}
                          </small>
                        </div>
                        <span>
                          {booking
                            ? booking.cancelled_at
                              ? "Cancelled"
                              : "Booked"
                            : i.revoked
                              ? "Revoked"
                              : Date.parse(i.expires_at) < Date.now()
                                ? "Expired"
                                : "Awaiting booking"}
                        </span>
                        {!booking &&
                          !i.revoked &&
                          Date.parse(i.expires_at) > Date.now() && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                setConfirm({
                                  action: "revoke-invite",
                                  id: i.id,
                                })
                              }
                            >
                              Revoke
                            </button>
                          )}
                      </div>
                    );
                  })
                ) : (
                  <p className={styles.help}>
                    Create your first invitation when you’re ready.
                  </p>
                )}
              </section>
            </>
          )}
          {tab === "availability" && (
            <div className={styles.availabilityLayout}>
              <section className={styles.dateEditor}>
                <h2>When are you available?</h2>
                <p className={styles.help}>
                  Pick a date to add or change your hours.
                </p>
                <MonthPicker
                  month={month}
                  onMonth={setMonth}
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                  available={availableDates}
                  marked={data.availability.map((w) => w.day)}
                  minMonth={availableDates[0].slice(0, 7)}
                  maxMonth={availableDates.at(-1)!.slice(0, 7)}
                  disabled={busy}
                />
                <p className={styles.help}>
                  ● Hours saved · All times are UK local time
                </p>
              </section>
              <div>
                <form
                  className={styles.editor}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget,
                      values = new FormData(form);
                    await mutate({
                      action: "availability",
                      day: values.get("day"),
                      start: values.get("start"),
                      end: values.get("end"),
                    });
                  }}
                >
                  <h2>{dateLabel(selectedDay)}</h2>
                  <p className={styles.help}>
                    Add the hours you’re free. Candidates choose from{" "}
                    {data.settings.duration_minutes}-minute meetings within
                    these hours.
                  </p>
                  <fieldset disabled={busy}>
                    <input type="hidden" name="day" value={selectedDay} />
                    <div className={styles.twoColumns}>
                      <label>
                        From
                        <input
                          type="time"
                          name="start"
                          required
                          min="06:00"
                          max="21:59"
                          defaultValue="09:00"
                        />
                      </label>
                      <label>
                        Until
                        <input
                          type="time"
                          name="end"
                          required
                          min="06:01"
                          max="22:00"
                          defaultValue="17:00"
                        />
                      </label>
                    </div>
                    <button
                      className={styles.primary}
                      disabled={!availableDates.includes(selectedDay)}
                    >
                      Save hours
                    </button>
                  </fieldset>
                </form>
                <section className={styles.editor}>
                  <h2>Hours for this date</h2>
                  {data.availability.some((w) => w.day === selectedDay) ? (
                    data.availability
                      .filter((w) => w.day === selectedDay)
                      .map((w) => (
                        <div className={styles.window} key={w.id}>
                          <div>
                            <strong>
                              {new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "medium",
                                timeZone: "UTC",
                              }).format(new Date(`${w.day}T12:00Z`))}
                            </strong>
                            <small>
                              {w.start_time.slice(0, 5)}–
                              {w.end_time.slice(0, 5)} · UK
                            </small>
                          </div>
                          <button
                            disabled={busy}
                            onClick={() =>
                              void mutate({
                                action: "remove-availability",
                                id: w.id,
                              })
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))
                  ) : (
                    <p className={styles.help}>No availability yet.</p>
                  )}
                  <p className={styles.help}>
                    Removing hours won’t cancel existing bookings. Your personal
                    calendar is not connected.
                  </p>
                </section>
              </div>
            </div>
          )}
          {tab === "settings" && (
            <form
              className={styles.editor}
              key={data.settings.updated_at}
              onSubmit={async (e) => {
                e.preventDefault();
                const v = new FormData(e.currentTarget);
                await mutate({
                  action: "settings",
                  expectedUpdatedAt: data.settings.updated_at,
                  enabled: v.get("enabled") === "on",
                  emailEnabled: v.get("emailEnabled") === "on",
                  teamsUrl: v.get("teamsUrl"),
                  duration: Number(v.get("duration")),
                  buffer: Number(v.get("buffer")),
                  notice: Number(v.get("notice")),
                });
              }}
            >
              <h2>Your booking preferences</h2>
              <p className={styles.help}>
                These settings are for your GI Healthcare interview calendar
                only.
              </p>
              <fieldset disabled={busy}>
                <label>
                  Reusable Microsoft Teams meeting link
                  <input
                    type="url"
                    name="teamsUrl"
                    maxLength={2048}
                    defaultValue={data.settings.teams_url}
                    placeholder="https://teams.microsoft.com/…"
                  />
                  <span className={styles.help}>
                    Shared only after booking. Use a dedicated meeting with the
                    lobby enabled and admit candidates individually. Changing
                    this link affects new bookings only.
                  </span>
                </label>
                <div className={styles.twoColumns}>
                  <label>
                    Meeting length
                    <select
                      name="duration"
                      defaultValue={data.settings.duration_minutes}
                    >
                      {[15, 30, 45, 60].map((n) => (
                        <option key={n} value={n}>
                          {n} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Buffer after each meeting
                    <select
                      name="buffer"
                      defaultValue={data.settings.buffer_minutes}
                    >
                      {[0, 10, 15, 30].map((n) => (
                        <option key={n} value={n}>
                          {n} minutes
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Minimum booking notice
                    <select
                      name="notice"
                      defaultValue={data.settings.notice_hours}
                    >
                      {[1, 2, 4, 12, 24, 48, 72, 168].map((n) => (
                        <option key={n} value={n}>
                          {n} hours
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    name="enabled"
                    defaultChecked={data.settings.enabled}
                  />
                  <span>Enable new bookings</span>
                </label>
                <p className={styles.help}>
                  Duration and buffer are fixed when an invitation is created.
                  Existing meetings are not changed by these settings.
                  Candidates receive the Teams link and a calendar download on
                  their confirmation page. There is no automatic personal
                  calendar sync.
                </p>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    name="emailEnabled"
                    defaultChecked={data.settings.email_enabled}
                    disabled={!data.emailReady}
                  />
                  <span>Email calendar invitations and cancellations</span>
                </label>
                <p className={styles.help}>
                  {data.emailReady
                    ? "Send the candidate a Teams link and calendar invitation, with a copy to you. Resend processes these emails outside the UK."
                    : "Resend setup required. Candidate emails remain off until the sending domain, server API key and processing approval are configured."}
                </p>
                <button className={styles.primary}>Save preferences</button>
                {!!data.pendingEmails && (
                  <div className={styles.setup}>
                    <div>
                      <strong>
                        {data.pendingEmails} email(s) need checking
                      </strong>
                      <p>
                        Sending is not confirmed. Check Resend before contacting
                        the candidate. Automatic retries stop after 23 hours to
                        prevent duplicates.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy || !data.emailReady}
                      onClick={() => void mutate({ action: "retry-emails" })}
                    >
                      Retry emails
                    </button>
                  </div>
                )}
              </fieldset>
            </form>
          )}
          <p className={styles.retention}>
            Private recruitment scheduling · Records are deleted within three
            calendar months. Linked invitations and bookings are deleted with
            their application, including if you delete it sooner. Downloaded
            calendar copies must be managed separately.
          </p>
        </>
      )}
      <dialog
        ref={confirmDialog}
        aria-labelledby="interview-confirm-title"
        className={styles.dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setConfirm(null);
        }}
        onClose={() => setConfirm(null)}
      >
        <h2 id="interview-confirm-title">
          {confirm?.action === "cancel-booking"
            ? "Cancel this meeting?"
            : "Revoke this invitation?"}
        </h2>
        <p>
          {confirm?.action === "cancel-booking"
            ? `The time will become available again. ${data?.settings.email_enabled && data?.emailReady ? "A cancellation email will be queued." : "Email is off: please tell the candidate."} Update your calendar too.`
            : "This unused link will stop accepting bookings."}
        </p>
        <div className={styles.actions}>
          <button autoFocus onClick={() => setConfirm(null)} disabled={busy}>
            Keep it
          </button>
          <button
            className={styles.primary}
            disabled={busy || !confirm}
            onClick={() => {
              if (confirm) void mutate(confirm);
            }}
          >
            Confirm
          </button>
        </div>
      </dialog>
    </section>
  );
}
