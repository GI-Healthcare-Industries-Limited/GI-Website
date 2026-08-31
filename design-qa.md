# Design QA — portfolio-first careers application

## Evidence

- Source visual truth selected by the user: `/var/folders/nf/y0bjgpm530n_g2dp6dngbrqr0000gn/T/TemporaryItems/NSIRD_screencaptureui_nyHYrD/Screenshot 2026-08-31 at 01.30.26.png` (`2136 × 1474` pixels).
- Density-normalized source used for the one-to-one comparison: `/Users/gihealthcareindustrieslimited/.codex/generated_images/019fb87f-090d-79b1-94ba-81092418c106/exec-044200a6-21ac-4a72-aec0-ade7ae41fd72.png` (`1487 × 1058` pixels).
- Final browser-rendered implementation: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-apply-final-2.png` (`1488 × 1059` pixels).
- Final full-view comparison: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-apply-comparison-final-2.png`.
- Focused comparisons:
  - header and eligibility: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-focus-header-final.png`
  - form and submission area: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-focus-form-final.png`
  - role and progress rail: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-focus-rail-final.png`
- Supplementary admin sign-in render: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-admin-login.png`.
- CSS viewport: `1488 × 1059`; implementation device pixel ratio: `1`.
- State: Embedded Systems Engineer selected, UK right-to-work answer set to Yes, remaining form empty and enabled.
- Normalization: the selected generated source was compared at its native `1487 × 1058` density against a DPR-1 implementation capture at `1488 × 1059`; no browser chrome or device frame was included.

## Findings

No actionable P0, P1 or P2 differences remain.

- Fonts and typography: Inter matches the source's neutral grotesk character and the implemented weights, wrapping, hierarchy and uppercase tracking are visually consistent. The role heading, eligibility question and small field labels retain the same optical order.
- Spacing and layout rhythm: the two-column frame, fixed red rail, toolbar, section dividers, narrow field measure and bottom submission row now align with the source. The final form ends at the same viewport edge without clipping the primary button.
- Colors and visual tokens: the white workspace, GI red rail and actions, pale selected state, grey borders, and dark text hierarchy map cleanly to the source. Contrast remains sufficient for text and controls.
- Image and icon fidelity: the existing GI Healthcare butterfly asset is reused rather than recreated. Phosphor icons provide a consistent real icon family for location, role, external link, eligibility and privacy states; no handwritten SVG, emoji or CSS-drawn asset substitutes are present.
- Copy and content: the source structure is preserved. `Edinburgh` and `info@gihealthcare.co.uk` intentionally replace the mock's London location and old careers address so the production interface reflects GI Healthcare's real role location and the previously approved contact address. The explicit consent line is an intentional functional addition.
- States and accessibility: role selection updates the rail; Yes reveals the application; No immediately shows the ineligibility explanation and removes the submission path. Form controls have labels, keyboard focus treatments, semantic fieldsets, accessible status announcements and practical target sizes.

Residual P3 polish only:

- Native font antialiasing and the source render's slight red texture make the two rails differ subtly at pixel level; the implemented solid GI red token is more stable and remains faithful to the selected direction.
- The implementation's input fields are a few pixels taller than the normalized source, improving usability without changing the visual hierarchy.

## Comparison history

1. Initial comparison: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-apply-comparison.png`
   - [P2] The first implementation was materially too tall and too wide: the lower form content fell below the selected viewport, the fields spread across most of the workspace, the rail heading wrapped to three lines, and the native radio retained a browser-specific focus appearance.
   - Fixes: reduced toolbar and section padding; constrained field and eligibility widths; tightened type scale and rail padding; replaced native radio artwork with Phosphor selected/unselected icons while preserving the semantic inputs; shortened the work textarea and submission spacing.
2. Second comparison: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-apply-comparison-2.png`
   - Post-fix evidence showed that the entire form and primary action now fit the target viewport and the major grid proportions matched.
   - [P2] The left progress rail was still too compressed: steps two and three sat visibly higher than the source.
   - Fix: increased the rail progress padding and step rhythm to match the source's vertical sequence.
3. Final comparison: `/Users/gihealthcareindustrieslimited/Documents/GI Healthcare Website/.design-qa-apply-comparison-final-2.png`
   - Post-fix evidence shows matching two-column proportions, section rhythm, field measure, bottom action position and near-identical progress-step placement. No actionable P0/P1/P2 difference remains.

## Functional verification

- Browser interaction: role switch, Yes reveal, No blocking state, submit-path removal for ineligible applicants, admin login render.
- Browser console: zero errors on `/apply` and `/admin`.
- API/database: a synthetic eligible application returned `201`, persisted the new role, portfolio URL and `right_to_work = true`, and was then removed; an ineligible application returned `400` and was not stored.
- Admin API: authenticated request returned `200` with the new portfolio and right-to-work fields.
- Build checks: `npm run typecheck` and `npm run build` passed.
- Responsive test gap: the in-app browser's temporary viewport override did not apply to a new tab, so the mobile breakpoint was reviewed from the implemented media rules rather than captured as separate browser evidence. This does not affect the selected desktop target comparison.

## Implementation checklist

- [x] Match the selected option-three visual hierarchy.
- [x] Replace CV upload with portfolio/project evidence.
- [x] Block applicants who do not already have the right to work in the UK.
- [x] Update the public role names and descriptions.
- [x] Carry portfolio and eligibility data into Supabase and the admin inbox.
- [x] Verify build, API persistence, rejection logic, admin API and browser console.

final result: passed
