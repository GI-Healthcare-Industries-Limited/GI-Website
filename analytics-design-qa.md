# Analytics Page Explorer (option 1) — 17 September 2026

final result: passed

## Evidence and matched state

- Source visual truth: `/Users/gihealthcareindustrieslimited/.codex/generated_images/019fb87f-090d-79b1-94ba-81092418c106/exec-425e9fc6-fe8c-4b90-a200-c3f3083dfdce.png`, 1487 × 1058 pixels. Selected option 1, Careers tab, populated dashboard.
- Implementation: `compliance/page-explorer-desktop-final.png`, same 1487 × 1058 CSS/pixel viewport, DPR 1, localhost `/admin`, Careers selected, synthetic local records only. Both images opened together in the same comparison input after corrections, with original-density images. No browser frame or density mismatch.
- Additional evidence: `compliance/page-explorer-390.png`, `page-explorer-768.png`, `page-explorer-1200.png` (matching width × 900, DPR 1); `page-explorer-detail.png`, `page-explorer-detail-mobile.png` (390 × 844), `page-explorer-breakdowns.png`, `page-explorer-empty.png`, `page-explorer-error.png`.
- Full-view comparison includes clearly legible chart, navigation, metric and table typography at original resolution; no enlarged source crop was needed. Detail-dialog and breakdown screenshots separately inspect the dense information and wrapping added beyond the reference.

## Comparison history and fixes

1. Initial comparison: [P2] northern map polygons crossed the antimeridian as horizontal lines; fixed with the documented ECharts projection-stream interface and D3 Natural Earth projection, using real bundled Natural Earth geometry. [P2] closing a detail dialog did not always restore keyboard focus after an accessibility click; focus now explicitly returns to the row's real button.
2. Responsive check: [P2] an absolutely positioned screen-reader table label escaped its horizontal scroll container at 390px. Added a positioned containing block. Darkened small location/footnote text for contrast. Rebuilt and recaptured the same desktop and mobile states.
3. Post-fix combined source/render comparison: map boundaries are continuous, typography and table labels readable, desktop hierarchy follows the selected reference. Phone and tablet controls remain visible; page-level horizontal overflow is absent (the detailed table intentionally scrolls within its own labelled, keyboard-focusable region). Isolated browser checks confirm focus restoration and Escape dismissal. No actionable P0/P1/P2 findings remain.

## Fidelity surfaces and intentional adaptations

- Typography: existing Inter font confirmed loaded by computed styles; compact medium-weight headings, tabular metrics, normal-weight detail text. Existing admin shell's title/sidebar typography is preserved, rather than resizing the Messages/Applications/Job postings shell.
- Layout: forest sidebar, off-white canvas, compact page tabs and inline KPIs, chart/map side by side, full-width page-view list below. Subtle borders and 10px surfaces. Additional accessible daily figures, country/city toggle and 20-row pagination intentionally make panels/table slightly taller than the four-row concept.
- Colours: forest accents, muted geographic data, white surfaces and pale grey-green borders. Selected tabs and focus rings distinguish states. Cookie buttons remain dark Accept and white outlined Reject of equal size.
- Assets: existing GI orbit wordmark and genuine Phosphor icons retained. Functional charts use Apache ECharts; map is actual Natural Earth data with D3 projection, not a fabricated illustration or remote tile service. Attribution/licenses bundled. No new decorative imagery.
- Content: all figures derive from the same filtered report (the concept's inconsistent illustrative graph totals were not copied). Last 7/14/30 days replaces the static illustrative date. Added Privacy filter and refresh. Country bubbles are explicitly aggregates, cities are estimates, records are page views rather than people, and unknown historical fields are not invented. Detailed records are not described as guaranteed anonymous.

## Verification and remaining limits

- Production build, TypeScript and 131 automated tests passed; dependency audit found zero production vulnerabilities.
- Local browser tests: filters, anchored previous/next pagination, period changes, country/city switch, device/browser/OS/source expansion, details, keyboard/Escape/focus, empty state, actual mocked HTTP 503 and retry, navigation back through Messages; no runtime exceptions. Synthetic data and mocked authentication only, never production form submissions or fake committed visits.
- Agent-browser verified the initial server and most interactions; its driver stalled during a final navigation check. An isolated Chromium/Playwright run completed that same full test flow successfully. In-app tooling lacks the required response-mocking facility, so this follows the local browser-check permission already given.
- Consent browser checks: 3004.5ms load delay, desktop/mobile, Accept/Reject/Manage, preference persistence, withdrawal, Flutter first-frame readiness, public routes and admin exclusion. All pass. Unit tests additionally verify old refusals stay valid and old acceptances cannot authorize v2 collection.
- Database migration tested inside a rollback transaction, then applied with matching before/after record fingerprints. Recruitment/enquiry tables unchanged; legacy analytics retained. Synthetic database fixtures rolled back. New report tested through the real Supabase API without printing visitor records; service-role-only permissions, RLS and existing retention schedules verified.
- No claim of a real owner-password sign-in or real visitor geolocation test: admin UI uses local auth fixtures; Vercel-derived cities/OS will appear only on new, consenting production visits. VPNs, missing headers and browser limitations may prevent city attribution.

## Historical QA (preserved)

# Outlined Reject button — 17 September 2026

final result: passed

## Evidence and comparison

- Source visual truth: the approved white dock in `compliance/cookie-dock-desktop.png` (1280 × 720) and `compliance/cookie-dock-mobile.png` (390 × 844), with the user's explicit override to make Reject white and Accept dark.
- Rendered implementation: `compliance/cookie-outlined-desktop.png` and `compliance/cookie-outlined-mobile.png`, matching CSS viewport/pixel dimensions, DPR 1, `/contact`, first visit and summary open. Source and implementation were opened together in one comparison input. The controls are readable without a separate enlarged crop.
- Additional state: `compliance/cookie-outlined-manage-mobile.png`, `compliance/cookie-outlined-manage-desktop.png`, `compliance/cookie-outlined-home.png`. In-app browser also visually verified.
- Typography, spacing, geometry, icons, imagery and copy are unchanged. Colours are the only intended visual difference: Reject is white with near-black text/border; Accept is near-black with white text. Both retain equal dimensions, readable labels and visible keyboard focus. Hover remains clearly distinguishable.
- No actionable P0/P1/P2 findings on first visual comparison; no further visual corrections required. Mobile management actions remain visible without horizontal overflow.
- 124 automated tests and production build passed. Browser measured 3012.9ms from load completion; Accept/Reject/Manage, persistence, withdrawal, Flutter readiness, all public routes and admin exclusion passed with no exceptions. Analytics requests intercepted; no submissions or database changes.
- Test-maintenance correction: ordering assertion now examines summary HTML rather than finding the new Reject CSS selector before the buttons.
- Implementation checklist: mirrored scripts updated, regression test added, desktop/mobile behaviour and visual comparison passed. Analytics redesign is separate and not implemented by this release.

## Historical QA (preserved)

# White cookie dock — 16 September 2026, evening revision

final result: passed

## Source and rendered evidence

- Source visual truth: `/var/folders/nf/y0bjgpm530n_g2dp6dngbrqr0000gn/T/TemporaryItems/NSIRD_screencaptureui_dyXiGO/Screenshot 2026-09-16 at 17.49.10.png`, 2242 × 1382 pixels. This contains two enlarged crops of a pill banner, not a complete page or a measurable CSS viewport. Compare the component's typography, capsule shape, icon treatment and compact horizontal rhythm rather than claiming pixel-exact fidelity to its magnification.
- Desktop implementation: `compliance/cookie-dock-desktop.png`, 1280 × 720 pixels, CSS viewport 1280 × 720, DPR 1. Dock measures 1120 × 72 at x80/y624. Route `http://127.0.0.1:3110/contact`, first visit, summary open. In-app browser and isolated Chrome captures agree.
- Mobile implementation: `compliance/cookie-dock-mobile.png`, 390 × 844 pixels/CSS pixels, DPR 1. Brief copy above a single action row; no horizontal overflow.
- Preferences: `compliance/cookie-dock-manage-desktop.png` and `compliance/cookie-dock-manage-mobile.png`; homepage: `compliance/cookie-dock-home.png`.
- Full-view comparison: source and rendered screenshots opened together in the same tool input, both before and after corrections. The dock and its text/actions are already readable in these full views, so no additional enlarged crop is necessary. No unframed-to-browser-chrome or density comparison was used.

## Fidelity surfaces

- Typography: restrained 14px Inter/system sans-serif, 13px mobile summary, normal readable line height; no visible banner heading. Existing Next font token is inherited. Copy remains one line on desktop and wraps naturally on mobile.
- Layout: white floating capsule, subtle outer ring and shadow, circular cookie badge, Accept first, Reject next, labelled sliders icon last. Desktop buttons are equally sized 98 × 46. Mobile options panel uses full-width explanations and compact single-line action labels.
- Colours: white surface and near-black type/actions, soft neutral icon circle, muted green optional-switch states. Blur remains behind the modal and disappears on dismissal. Equal Accept/Reject styling intentionally differs from the reference's outlined Reject, following ICO equal-prominence guidance.
- Assets: genuine Phosphor Cookie and SlidersHorizontal SVG assets exported from the installed library, not handcrafted icon approximations. Existing photographs and logos are unchanged.
- Copy: one concise analytics purpose and Privacy policy link; necessary processing, optional fields, providers and retention remain disclosed in Manage and the notice. No hidden collection, preselected analytics, or invented cookie categories.

## Comparison history

1. P2: browser default focus ring surrounded the whole capsule. Removed only the dialog's automatic outline; keyboard focus remains visible on every interactive control. Recaptured desktop shows the intended neutral edge.
2. P2: mobile preferences explanation was constrained beside the toggle, making the panel unnecessarily tall. Moved descriptions below their header/switch row on mobile.
3. P2: mobile Save choices wrapped onto two lines. Reduced management-action horizontal padding; final capture has all actions on one line and visible at the tested viewport.
4. Repeated paired comparison after fixes: no remaining actionable P0/P1/P2 differences. Responsive management layout is an adaptation because no preferences/mobile source was supplied.

## Behaviour and data safety

- 123 automated tests and the production build passed. Eight new isolated consent tests cover load/first-frame ordering, exact three-second threshold, cached Flutter readiness, both saved decisions, navigation, manual management, withdrawal and asset mirroring.
- Real browser measured 3010.9ms from load completion to opening. Flutter waits for both load and its first-frame event before starting its three-second timer.
- Accept, Reject, Back, Manage switch, Save, reload persistence, privacy-page withdrawal, six public routes and admin exclusion passed. No browser exceptions. No floating settings control remains and no footer control was added.
- Existing consent version and 180-day lifetime retained: visitors with valid choices are not prompted by this redesign. Expired/deleted cookies, new browsers and future purpose changes can require a new choice; this is not a promise to suppress consent forever.
- All browser analytics requests intercepted locally. No form submissions, database changes, candidate/enquiry access, or authentication changes.

## Deferred footer preference

The user does not want a floating Cookie settings control or a new footer control now. Revisit a discreet privacy-preferences link only when the footer is developed later. Preserve the current management link inside the privacy notice so consent can still be withdrawn.

## Historical consent QA (superseded visual direction, preserved)

# Cookie consent and website analytics — 16 September 2026

final result: passed

## Current reference and rendered evidence

- Source: `/var/folders/nf/y0bjgpm530n_g2dp6dngbrqr0000gn/T/TemporaryItems/NSIRD_screencaptureui_OWvre3/Screenshot 2026-09-16 at 14.50.15.png` (2950 × 282; bottom-banner crop).
- Implementation: `http://127.0.0.1:3110/contact`, first visit, dark bottom dialog and blurred backdrop. `compliance/cookie-desktop-reference-size.png` is 2950 × 1700 at 1475 × 850 CSS px, DPR 2; compare its bottom-banner region to the same-width source. Both images were opened in the same comparison input. The reference contains only the banner, not the surrounding page.
- Further evidence: `compliance/cookie-manage-desktop.png`, `compliance/cookie-mobile.png`, `compliance/cookie-manage-mobile.png`; mobile 390 × 844, DPR 1.
- Admin analytics: `compliance/analytics-empty-desktop.png`, `compliance/analytics-populated-desktop.png` (1440 × 1000), `compliance/analytics-populated-mobile.png` (390 × 844). Populated data is a local-only network fixture, not production traffic.

## Fidelity and findings

- Typography: the existing site's Inter/system sans-serif, restrained heading weights, readable 15px consent explanation and 14px action labels. The reference's left-copy/right-actions hierarchy is retained. GI-specific copy is intentionally not identical to Onric.
- Layout: full-width bottom bar; three actions alongside the explanation on desktop and stacked on mobile. Necessary and optional categories are distinct. The management dialog scrolls on small screens; controls remain reachable with no horizontal overflow. The focus outline is intentionally visible.
- Colours: near-black with a slight green cast to suit the existing GI workspace, warm off-white text and actions. Reject and Accept have equal filled styling intentionally, to avoid privileging acceptance. Blur is behind the dialog only and clears on either decision.
- Assets: no image assets are part of the selected cookie reference. Existing public photographs and branding unchanged; admin uses existing Phosphor icons and colours. Charts show actual report values, with accessible daily figures.
- Copy: professional summary with detailed analytics fields and providers in Manage and the Privacy Notice. One real optional category, off by default. No invented marketing/personalisation toggles, hidden full-IP directory or blanket consent to recruitment.
- No remaining actionable P0/P1/P2 visual issues. Minor spacing differences from the cropped reference are expected for the adapted copy and equal-prominence choices.

## Comparison history and verification

1. Initial full-view paired comparison matched the dark banner, action ordering, type hierarchy and blur.
2. P2 fixed: the privacy page's inline Manage link wrapped across lines, leaving its rectangular centre outside the visible link text. Made that control inline-block. After rebuilding, real browser clicks open the panel reliably.
3. Re-captured and compared the final banner at the reference width; desktop/mobile checks passed. No further material visual changes were needed.
4. Local browser checks passed first visit, default-off toggle, Reject persistence, Accept, changing preferences, withdrawal without flushing queued activity, privacy-page control, all six public routes and admin exclusion. Analytics requests were intercepted locally; no test visits or form submissions were stored.
5. Admin empty/populated layouts, period filter, refresh and returning to Messages tested with local-only mocked responses. No browser exceptions; no horizontal overflow on either viewport.
6. 113 automated tests and the production build passed. The additive database migration passed a rollback dry run and committed with existing application/enquiry/job fingerprints unchanged. Synthetic database tests were rolled back before commit.

## Historical login QA (preserved)

# Minimal admin login — design QA

final result: passed

## Visual truth and evidence

- Approved source: `/Users/gihealthcareindustrieslimited/.codex/generated_images/019fb87f-090d-79b1-94ba-81092418c106/exec-940b21f7-d79b-4f6e-9287-ed150e451984.png` (1486 × 1058).
- Implementation: `http://localhost:3107/admin`, signed out, empty fields, no validation message.
- Browser: Codex in-app browser through CUA; CSS viewport 1486 × 1058, reported devicePixelRatio 1.
- Raw screenshot: `.design-qa-login-desktop-raw.png`. Browser capture returns a 1486 × 1058 image but renders the viewport at half size in its top-left quadrant. This is capture scaling, not page overflow: DOM confirms viewport and scrollWidth are both 1486, photo x674.64/y17/w793.36/h1022.
- Full-view paired comparison: `.design-qa-login-comparison.png`. Source downsampled to743 ×529; browser content extracted at743 ×529 to remove the capture-only blank padding. Both were inspected together.
- Normalized desktop: `.design-qa-login-desktop.png` (1486 ×1058; upsampled capture, not native-resolution evidence).
- Focused paired control comparison: `.design-qa-login-controls-comparison.png`. Comparison covers fields, eye icon, recovery action, submit, divider and return link. Some raster softness is caused by the browser capture; text and controls are native HTML, not raster screenshots.
- Mobile: `.design-qa-login-mobile.png` (390 ×844); capture normalized from the same half-scale behavior.

## Findings

No remaining actionable P0/P1/P2 visual findings after the responsive correction and final comparison.

- Typography: existing self-hosted Inter at400 for form text,500 for submit,300 for photograph caption. Oversized headings and heavy weights removed. Normal line-height and no visible field labels/placeholders. Minor difference from generated lettering is expected for real text.
- Layout: 45.4/54.6 split; photo17px top,18px right,19px bottom,20px corners. Logo x72/y53/w230; email x74/y422/w514/h58, compared with source approximately x75/y423/w514/h58. Submit top652 versus source653. Spacing and hierarchy match.
- Colors: white panel, thin cool neutral field borders, restrained red actions. Links use a slightly darker accessible red than the bright generated reference; deliberate contrast adjustment. Original supplied logo preserved rather than regenerating artwork.
- Assets: supplied orbit wordmark and generated cooking-studio WebP; no CSS/inline-SVG illustration substitutes. Phosphor eye/external-link icons preserve line style. Small photographic differences in the extracted asset are acceptable; subject, composition, materials, lighting and greenery match.
- Content: removed Admin Workspace, Welcome back, sign-in introduction, placeholders, visible labels, and footer. Kept sign-in/recovery/navigation actions and photo caption. Recovery/error instructions appear only when relevant.
- Responsive: no horizontal overflow at390 ×844 or820 ×1180. At phone widths the decorative photograph is hidden so login controls remain usable. Inputs58px high, submit50px, ancillary controls44px. All form and navigation controls remain above the fold at the tested phone viewport.
- Accessibility: real associated screen-reader-only labels; autocomplete enabled; keyboard focus outlines; password visibility button has accessible name/state; status and error announcements; native required/email validation; respects reduced motion.

## Behavior and safety

- Browser tested: native empty-field validation focuses email; visibility toggles text/password; invalid test credentials produce an error and re-enable the form; return-to-website navigation. Password recovery was subsequently removed because no production-ready SMTP and redirect setup was verified.
- Initial browser console: no errors or warnings. The deliberate invalid-login test produces the expected Supabase400 response, not an application exception.
- Sixteen isolated tests pass: existing database/submit safety tests plus actual login component handlers, blank fields and labels, auth call forwarding, failure handling, absence of an unconfigured reset control, unavailable-client guard and duplicate-submit suppression.
- Production build and TypeScript pass.
- No real account password changed and no reset email was sent. Authenticated inbox was not exercised because no user credentials were supplied.
- Existing server-side admin authorization, submissions, database, cron, and current credentials are unchanged. The authenticated sidebar uses the same supplied new logo; public-site branding is outside this login implementation.

## Comparison history

1. Initial screenshot had capture-only half-scale padding. Normalized both images before judging, rather than changing correct CSS to compensate.
2. Desktop full-view and focused comparisons show matching controls, major proportions and imagery.
3. [P2, fixed] Tablet inspection at820 ×1180 showed the centre-cropped image cutting off the cooking machine at the right edge. Set `.photo { object-position: 75% center; }` below1000px. Post-fix screenshot `.design-qa-login-tablet-raw.png` shows the machine fully visible with the controls unchanged. This is a deliberate responsive crop; no tablet mockup was supplied.
4. Final desktop capture `.design-qa-login-desktop-final-raw.png` compared with approved source in `.design-qa-login-final-comparison.png` confirms the responsive fix does not change the approved desktop layout. Passed.

## Follow-up polish

- Optional P3: obtain a higher-density browser capture if pixel-level text antialiasing comparison is needed.
- Account holder should test password-reset email receipt and complete the reset themselves if required.
# Research page — approved product-led design

final result: passed

Source: `/Users/gihealthcareindustrieslimited/.codex/generated_images/019fb87f-090d-79b1-94ba-81092418c106/exec-6fa909b4-682d-43c3-8caf-80ab6f0e501c.png` (1003 × 1568).
Implementation: `http://127.0.0.1:4174/research`.
Evidence: `/tmp/gi-research-desktop-hero-final.png`, `/tmp/gi-research-desktop-bottom-final.png`, `/tmp/gi-research-mobile.png`, and paired `/tmp/gi-research-focused-comparison.png`.
Desktop viewport 1003 × 720, mobile 390 × 844. Captures match CSS pixels; paired source/implementation regions are identically scaled. Full-page screenshot stitching produced white gaps, so the final comparison uses separate top and bottom viewport captures instead. The earlier full-view comparison established section order and proportions; focused captures verify readable content and imagery.

Findings and iteration: initial desktop typography was smaller than the mock and numbered rows were too tall. Increased heading sizes and reduced row heights; recaptured the final desktop hero and lower section and compared with matching source regions. No remaining P0/P1/P2 findings.

- Typography: existing Inter, restrained 450-weight headings, responsive line breaks, readable body copy. Approved headline and three principles retained.
- Spacing: image-led hero, three open numbered rows, two-column lower section. Mobile stacks content with no horizontal overflow. Shared site header intentionally keeps existing dimensions.
- Colours: existing red header, warm-white principles, charcoal copy, muted olive numerals.
- Imagery: studio hero generated as a separate text-free asset; lunar photograph extracted losslessly from the approved revision, retaining the small countertop machine. Concept captions remain visible. Minor studio-lighting differences are P3; the lower image is pixel-exact source content.
- Content: matches approved mock; user explicitly deferred wording revisions.
- Interactions: research anchor lands below sticky header; Discuss our research and mobile Contact links navigate correctly; mobile menu works; Careers Research button opens /research; legacy Space query redirects to Research. No real form submissions made.
- Browser console: no errors in the checked Research flow. Images loaded; mobile document has no width overflow.
- Verification: 137 Node tests passed, TypeScript passed, Next production build passed, Flutter release rebuild passed after refreshing its local SDK package paths.

Implementation checklist: complete. Follow-up: user-requested wording refinements after publication.

## Booking flow — Calendly-style simplification, 26 September 2026

final result: passed

Reference: user screenshots `Screenshot 2026-09-26 at 00.56.27.png` and `Screenshot 2026-09-26 at 00.56.42.png`. The approved direction is the meeting-summary/calendar/time-column hierarchy, adapted to GI's existing Inter, red logo and muted green controls rather than Calendly branding.

Implementation: local synthetic-data preview at `http://localhost:4174/qa-booking`; admin preview at `http://localhost:4174/qa-booking?view=admin`. These fixtures are excluded from Git and Vercel. No real applications or bookings were submitted during browser testing.

Evidence: `.design-qa-booking-desktop.png` (1280 × 720), `.design-qa-booking-mobile.png` (390 × 844), `.design-qa-booking-admin.png`. Compared reference and desktop captures together at proportional display scale; verified mobile separately. Full-page capture produced a provider scaling artefact, so final judgments use normal viewport captures, not that artefact.

- Hierarchy: meeting information left, month calendar centre, time choices right only after a date is selected; details are a separate next step. Clean white surfaces and restrained typography.
- Owner flow: Availability is the default view; choose a date, enter From/Until and save hours. One reusable link is primary; private links remain secondary. Bookings and meeting settings are separate tabs.
- Iteration: fixed calendar button specificity against inherited admin styles, reduced private-link prominence, moved Save preferences below all settings, and made selected mobile dates bring available times into view.
- Responsive checks: desktop and 390px candidate/admin layouts inspected; no horizontal overflow. Mobile calendar and slots stack with usable touch targets. Temporary viewport reset afterward.
- Interaction checks: date/time/Next, details and acknowledgement, synthetic confirmation and calendar/Teams links, admin save-hours, and retained private-link route. Browser errors: none in the checked flow.
- Safety: transaction rehearsal verifies record fingerprints unchanged, double-book prevention, reusable-link multiple bookings, idempotent retries, private-table permissions and transactional email queue. All synthetic SQL fixtures roll back.
- Automated verification: 154 tests, TypeScript and production Next build passed. Resend delivery is deliberately not represented as tested: sending remains disabled pending setup and explicit non-UK processing approval.

No remaining P0/P1/P2 visual findings. Email activation is a configuration/privacy follow-up, not a layout blocker.
