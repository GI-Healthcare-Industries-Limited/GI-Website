# Careers form and closing dates — 13 September 2026

Final result: passed.

The approved admin cooking-studio photo and orbit logo are reused exactly. The
application form has a white panel, lighter Inter typography, olive accents,
smaller section headings and a sticky photograph on desktop. At phone widths the
form becomes one column and the photograph remains below the form. The full long
role title is shown separately on mobile so it can wrap instead of being lost in
the native select.

Browser review: Codex in-app browser, desktop 1280 × 720 and mobile 390 × 844.
Checked real rendered form, photo loading, role switching, eligibility controls,
typing into all applicant fields, portfolio guidance, consent and error recovery.
Choosing No disables submission; choosing Yes enables the required fields.
A local service failure shows an actionable error and retains the entered answers.
The photograph's positioning warning was fixed by using an absolute image wrapper.

Authenticated admin review: both roles load with no date. Saving a temporary
2099-12-31 date through the form persisted it to Supabase, and the applicant page
displayed it. Clear date persisted null and returned the role to no deadline.
Both roles were left open with no closing date. No real application was deleted
or submitted. Native date input handling includes input events for WebKit.

Database checks passed inside a savepoint, rolled back before the schema migration
was committed: expired dates reject inserts, today's date still accepts, dates
can be extended or cleared, changes affect only the selected role, UK summer and
winter cutoffs are correct, and anonymous/authenticated clients cannot edit dates.
The temporary synthetic row was rolled back. API tests additionally cover an
expired deadline between the initial check and insert, outages, and ineligibility.
