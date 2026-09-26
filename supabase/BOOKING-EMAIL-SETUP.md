# Shared booking and Resend setup

## What is changing

- `/book` is the reusable availability link; it reveals no candidate information.
- Booking creates a separate random private `/book/<token>` confirmation/cancellation link. Only its hash is stored. Existing private invitations remain valid.
- Availability and conflicts are enforced transactionally, across both link types. The shared form allows at most five bookings per pseudonymous network identifier per hour and three per email per day. Network hashes are cleared after two days.
- The additive migration is `20260926020000_shared_booking.sql`. Run `node --env-file=.env.local scripts/apply-shared-booking.mjs` for a rollback-only rehearsal; `--apply` commits schema only after the same synthetic checks. Never edit the previously applied migration.

## Before switching on email

Resend is NOT UK-only. Its region setting controls sending location, not data residency. Resend documents US storage of account data, email metadata, logs and API records even when Ireland is selected. The owner must approve this exception, review Resend's DPA/subprocessors and the international transfer arrangements with their data-protection adviser. Do not enable the integration merely because the account exists.

1. In the owner's Resend account, Domains → Add domain. A dedicated sending subdomain such as `bookings.gihealthcare.co.uk` is recommended; this does not move the booking website or change its URL. Choose Ireland if desired, noting the US storage above.
2. Add only the exact verification/sending DNS records shown by Resend to Cloudflare. Do not replace the root Microsoft 365 MX records or existing SPF. Do not enable inbound receiving for the root domain. If a hostname already has SPF, stop and reconcile rather than adding a second SPF record. Verify the domain in Resend.
3. Disable open/click tracking. Configure DKIM/SPF and review DMARC. Create a Sending access API key scoped to this verified domain.
4. Add server-only environment variables in Vercel's project Settings → Environment Variables. Never paste the API key into chat or use a NEXT_PUBLIC prefix:
   - `RESEND_API_KEY`: the restricted key (check whether generic website alerts already use this key/domain before replacing it).
   - `INTERVIEW_FROM_EMAIL`: a plain address on the verified domain, e.g. `meetings@bookings.gihealthcare.co.uk`.
   - `INTERVIEW_HOST_EMAIL`: the owner's actual receiving mailbox, e.g. `ash@gihealthcare.co.uk`.
   - `INTERVIEW_EMAIL_PROCESSING_APPROVED`: `true` only after the owner approves this processing/location exception.
5. Redeploy so those values take effect. In Admin → Interviews → Meeting settings, enable email calendar invitations and save.
6. With explicit permission, test with an owner-controlled mailbox: create one clearly labelled test booking; verify actual inbox delivery, Teams link, ICS import/timezone, then cancellation with the same UID. Never test against real candidates. This delivery check has NOT been performed as part of local implementation.

## Delivery behaviour and limitations

An outbox row is created in the same database transaction as the booking/cancellation, only while email is enabled. After the response, a server worker sends up to five queued emails through Resend. Recipient gets a plain-text confirmation and ICS REQUEST (or CANCEL), and the owner receives a BCC copy. The reusable Teams URL is snapshotted per booking. No application answers, right-to-work data or analytics are sent.

Failures leave bookings intact. Admin shows unsent email count and a Retry emails button. Leases prevent concurrent workers; immutable request payloads and deterministic Resend idempotency keys bound duplicate attempts. Retries are capped at eight and 23 hours; older or exhausted jobs require manual delivery investigation, not blind resend. There is no continuous background retry scheduler in this release. A further booking/cancellation or explicit admin retry drains eligible pending jobs. Provider acceptance is not proof of inbox delivery; check Resend for bounces and delivery status. No webhook or personal-calendar sync is claimed.

Confirmations are not sent retroactively to existing bookings when email is enabled. A later cancellation can send a cancellation message. Local retained email payloads and status cascade-delete with the booking; email-provider retention and recipient/owner calendar or mailbox copies are separate and must be managed under the approved policy.

Official references (checked 26 September 2026):
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/dashboard/domains/regions
- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://resend.com/legal/dpa
