# Careers eligibility update

## Scope

Applicants choose a role card, complete right-to-work declarations, then provide their personal details and portfolio. The API independently validates the same declaration before one atomic database insert. Authorised admins can explicitly reveal private evidence for a single application. The existing studio photograph is unchanged; its caption box is removed.

No automated immigration or recruitment decision is made. The online flow pauses for people declaring no qualifying permission; a manual-review contact route remains available for other lawful evidence or uncertainty.

## Rules checked against GOV.UK

- [Employer right-to-work checks](https://www.gov.uk/check-job-applicant-right-to-work): British and Irish citizens do not get share codes. Document checking is still required before employment. Other applicants can sometimes use documents or the Employer Checking Service, so a code-only dead end would be inappropriate.
- [Employer guide](https://www.gov.uk/government/publications/right-to-work-checks-employers-guide/employers-guide-to-right-to-work-checks-26-june-2025-accessible): nine-character right-to-work code, W prefix, paired with DOB, valid for 90 days. Local regex checks only format; it cannot establish validity, expiry, identity or permitted employment.
- [Student rules ST 26](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student#work-conditions-for-a-student): term-time hours and permanent full-time vacancy restrictions apply, with defined exceptions. Student applicants acknowledge these and declare permission for this role; employer manual review remains essential.
- Other current permission choices follow official [Graduate](https://www.gov.uk/graduate-visa), [Global Talent](https://www.gov.uk/global-talent), [HPI](https://www.gov.uk/high-potential-individual-visa), [Youth Mobility](https://www.gov.uk/youth-mobility), [UK Ancestry](https://www.gov.uk/ancestry-visa), [family](https://www.gov.uk/uk-family-visa) and [dependant](https://www.gov.uk/government/publications/dependent-family-members-in-work-routes-immigration-staff-guidance/dependent-family-members-in-work-routes) guidance. ILR/ILE, EUSS and other existing permission are also selectable. A category is not proof of permission, and is never used to rank candidates.

## Privacy and compatibility

- DOB and code stay in memory until final submission; no local-storage draft or eligibility network request.
- Citizen submissions discard irrelevant DOB, code and visa declarations.
- Evidence is saved in the existing RLS-protected application row, atomically with the application, and removed with its deletion.
- Main admin list, notification email, API acknowledgement and application error logs exclude the private code and DOB.
- Evidence endpoint authenticates a website admin, validates the application UUID, queries only that record and returns `private, no-store` with `Vary: Authorization`.
- Private evidence is hidden initially in admin, can be hidden again and resets when the selected applicant/user changes.
- No passport uploads, actual Home Office lookups, new password handling or access grants were added.
- Additive migration preserves legacy rows; existing closing dates are unchanged. Existing old-format submissions must reload to complete the new declaration.
- Operational follow-up: reviewers must use the official employer service, check identity/restrictions, retain the required check record separately, and follow their recruitment-data retention policy. This UI does not establish a new retention policy or perform an official check.

## Verification

- 36 automated tests pass: existing login/deletion/deadline/health checks plus citizenship exception, all declared-permission choices, missing/invalid evidence, Student acknowledgement, normalisation, API privacy, authentication and no-cache responses.
- Production Next.js build and TypeScript pass.
- Live Supabase migration `20260914003000_application_right_to_work.sql` applied using verified TLS to project `qucjtakhurjajoyxbmfh`.
- SQL constraints, citizen exception, Student acknowledgement, deletion semantics and deadline regression suite passed inside a savepoint; all synthetic rows and temporary deadline values rolled back before committing only the migration.
- Browser: role cards and unobstructed studio photo inspected; citizenship bypass, hidden personal details, “none” blocking, invalid-code blocking and valid-format progression exercised with synthetic inputs only.
- Responsive inspection at 390 and 320 px: no horizontal overflow; narrow screens stack role cards.

The React/Next.js guidance informed client/server boundaries and independent server validation. Deployment guidance is followed by applying the additive migration before publishing the application.
