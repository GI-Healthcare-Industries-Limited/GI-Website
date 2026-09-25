# Recruitment discovery and interviews

## Existing advertisements

`https://www.gihealthcare.co.uk/apply` remains the application entry point and role picker. Do not redirect it to one role. Individual discovery pages live at `/careers/<immutable-opening-id>` and link to `/apply?job=<id>`. Titles may change without breaking those links. Closing or removing a role stops applications under the existing server/database rules.

`/careers` and each role page are server-rendered. Active role pages publish `JobPosting` data matching visible content; expired roles omit it. `/sitemap.xml` includes active roles. Search visibility is not guaranteed. The owner should supply complete, accurate descriptions (responsibilities, requirements, working arrangements and pay where available) through Job postings. Do not invent these for SEO. Search Console submission and any Google Indexing API credentials are separate account setup; this release does not submit jobs through those services.

## Owner setup

1. Open Admin → Interviews → Settings. Add a reusable Microsoft Teams meeting link, choose duration/buffer/minimum notice, and enable bookings.
2. Use a dedicated Teams meeting with a lobby. Admit candidates individually. This app does not create meetings or configure the Microsoft account.
3. Add specific availability dates in UK local time. The portal does not read the owner's personal calendar; publish only times known to be free.
4. From an application, choose **Invite to interview**, or use **Create invitation**. Choose a deadline; available meetings must finish before it.
5. Copy the private link and send it to one candidate. The raw token is shown once, not stored. To replace a lost unused link, revoke it and create another.
6. Bookings appear in the monthly calendar and the selected day's agenda. Download `.ics` files to add events to Apple Calendar, Outlook or another calendar.

No confirmation email is sent. Candidates receive their Teams URL and calendar file on the confirmation page. There is no automatic calendar sync or cancellation email. The owner must notify candidates about owner-initiated cancellations and manage imported events separately. A cancelled invitation cannot be reused; create a new one to reschedule.

## Safety and retention

- Only the existing website administrator can manage settings, availability and invitations. New tables and SQL functions are denied to anonymous and ordinary authenticated database roles.
- Invitation tokens use 256 bits of randomness; only SHA-256 hashes are stored. Anyone possessing a private link can view/cancel its booking. Treat it as a secret and never publish it.
- Candidate booking pages/API responses are private/no-store and noindex, have no-referrer headers, and are excluded from optional visitor analytics. Provider request logs remain subject to provider policies.
- Linked invitations require the applicant's original email. Names/emails are bounded and the server validates the privacy acknowledgement and exact Microsoft Teams host.
- PostgreSQL serializes bookings across all invitations for this owner, checks minimum notice, expiry, duration and buffers, and makes identical retries idempotent. UK daylight saving is applied to availability.
- Linked invitations/bookings are deleted with their application, including manual deletion and its original retention deadline. Unlinked invitations expire within three calendar months of creation. The retention cron runs every minute and deletes up to five minutes early. Deleting an application does not notify a candidate or remove an event already imported into a personal calendar.

## Migration and verification

Migration: `supabase/migrations/20260925150000_interview_scheduling.sql`.

Run `node --env-file=.env.local scripts/apply-interview-scheduling.mjs` for a rollback-only verification, or append `--apply` to install. It asserts the intended Supabase project, verifies TLS and RLS/privileges, tests synthetic bookings inside a rolled-back savepoint, and compares existing applications/enquiries/openings before and after. No synthetic booking, Teams setting or availability remains.

Coverage includes unit/API tests (`npm test`), TypeScript/build, rollback database checks for slot conflicts, idempotency, revoked/expired/disabled invitations, cancellations and UK DST, and desktop/mobile UI checks with a temporary synthetic-only local fixture. No actual candidate was contacted during verification. The temporary fixture must not ship.
