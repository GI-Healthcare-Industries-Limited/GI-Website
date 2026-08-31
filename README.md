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

## Domain cutover

Do not change the live records until the Supabase-backed form flow has passed
the checks above. In Cloudflare DNS, remove the current GitHub Pages and parking
records, then attach both `gihealthcare.co.uk` and `www.gihealthcare.co.uk` to
the Vercel project using the exact records Vercel supplies. Keep Cloudflare SSL
mode on Full (strict), and test both hostnames after DNS propagation.
