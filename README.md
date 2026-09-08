# GI Healthcare website

The existing Flutter website is served by a Next.js application so it can run on
Vercel without changing the public design. Next.js also provides the server-side
contact, careers and admin features.

## Routes

- `/` and the existing Flutter routes: public GI Healthcare website
- `/apply`: same-domain, portfolio-first career application form
- `/admin`: password-protected contact and application dashboard
- `/api/contact`: stores contact-page enquiries
- `/api/applications`: stores right-to-work-confirmed, portfolio-first applications

Contact messages and applications are written to Supabase. If Resend is
configured, a notification is also emailed to `ash@gihealthcare.co.uk`.

## Local development

Use Node.js 24, then run:

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run prepare-public` copies the checked-in Flutter web build from `docs/`
into the generated `public/` directory. Rebuild the Flutter app only when its
source changes, and keep `docs/CNAME` intact for the existing GitHub Pages site
until the Cloudflare cutover is complete.

## Supabase activation

1. Create or choose a Supabase project in the UK or nearest suitable region.
2. Apply `supabase/migrations/20260828120000_create_website_submissions.sql`.
3. In Supabase Authentication, create the administrator user
   `ash@gihealthcare.co.uk` with a strong password. The migration automatically
   adds that user to `website_admins`.
4. Add the URL, publishable key and service-role key to Vercel using the names
   in `.env.example`. The service-role key must remain server-only.
5. Generate a long random value for `SUBMISSION_HASH_SECRET`.
6. Apply all newer migrations, then redeploy and verify a test contact message,
   portfolio-first application, admin login and status update.

Legacy CV files remain private and accessible only to an authenticated admin.
New applications do not request or upload a CV.

## Optional email notifications

Create a Resend API key, verify `gihealthcare.co.uk`, and add `RESEND_API_KEY`
and `RESEND_FROM_EMAIL` in Vercel. `CONTACT_NOTIFICATION_EMAIL` defaults to
`ash@gihealthcare.co.uk`. Database storage and the admin page continue to work
when Resend is not configured.

## Daily database health check

`vercel.json` schedules `/api/cron/database-health` once each day at 07:17 UTC
(Vercel Hobby scheduling can run within that hour). Set a random, server-only
`CRON_SECRET` in the production Vercel environment, then deploy to production.
Vercel sends it in the Authorization header automatically. Preview deployments
and local development do not run the schedule.

The check makes three small HEAD queries against the contact, application and
admin tables. It neither creates records nor downloads applicants' details.
Each query has a 10-second timeout, with one bounded retry of the checks. A
failed check returns HTTP 503; inspect Vercel's Cron Jobs execution logs for
`Database health check passed` or `Database health check failed`. This is not
continuous outage monitoring and does not send email alerts.

This daily activity is a best-effort way to reduce Supabase Free inactivity
pauses, not an uptime guarantee. Supabase says a few daily database requests
are typically sufficient, but only a paid plan guarantees no inactivity pauses:
https://supabase.com/docs/guides/platform/free-project-pausing
The daily job fits Vercel's free cron frequency allowance; normal function
usage limits still apply.

If the project is already paused, open the GI Healthcare project in the
Supabase dashboard and select **Resume project**. After it is restored, run
the job from Vercel Settings → Cron Jobs and confirm HTTP 200. The job cannot
resume a paused project. Failed form submissions return an error and retain
the visitor's input; they are not queued for automatic delivery later.

## Domain cutover

Do not change the live records until the Supabase-backed form flow has passed
the checks above. In Cloudflare DNS, remove the current GitHub Pages and parking
records, then attach both `gihealthcare.co.uk` and `www.gihealthcare.co.uk` to
the Vercel project using the exact records Vercel supplies. Keep Cloudflare SSL
mode on Full (strict), and test both hostnames after DNS propagation.
