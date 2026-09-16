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
