# Finish-QA checklist

## Test execution completeness
- [ ] Every test case has a recorded outcome: Pass / Fail / Blocked
- [ ] No test case left with outcome "Not run" unless formally deferred with documented justification
- [ ] All Blocked cases have a root cause noted (environment issue, missing data, dependency)

## Defect gate
- [ ] No P0 (critical / data loss / security) defects open against this story
- [ ] No P1 (broken AC, regression) defects open against this story
- [ ] All P2+ defects are logged with severity, steps to reproduce, and owner assigned

## AC sign-off
- [ ] Every Acceptance Criterion in the story is marked Pass or formally waived by the Product Owner
- [ ] Any waived AC has a follow-up story ID or ADO item linked in the sign-off

## Security testing gate (apply if story's Impacted Areas includes Security — SECURITY.md)
- [ ] Auth / authorisation tests executed and passed
- [ ] Input validation tests executed and passed
- [ ] No PII found in error responses, logs, or API payloads in any executed test
- [ ] Penetration scenarios from SECURITY.md checklist verified

## Performance testing gate (apply if story's Impacted Areas includes Performance — PERFORMANCE.md)
- [ ] Response time measurements recorded against PERFORMANCE.md budgets
- [ ] All measurements at or below the documented threshold
- [ ] Any measurement above threshold has a filed defect before sign-off

## Accessibility gate (apply if story's Impacted Areas includes Frontend — fe/ACCESSIBILITY.md or DESIGN_SYSTEM.md)
- [ ] Colour contrast verified — ≥ 4.5:1 body text, ≥ 3:1 large text and UI components
- [ ] Keyboard navigation verified through all new/changed interactive elements — no traps
- [ ] Focus visible on all focusable elements — no bare `outline: none`
- [ ] ARIA labels and roles confirmed on all icon buttons, custom widgets, and form errors
- [ ] Semantic HTML verified — landmarks, heading hierarchy, form labels, image alt text
- [ ] Touch targets ≥ 44×44 px verified for all interactive controls
- [ ] Automated accessibility scan run (axe / jest-axe / Lighthouse) — zero new violations

## Visual Quality gate (apply if story's Impacted Areas includes Frontend — fe/VISUAL_QUALITY.md)
- [ ] Every new/changed interactive component has all required states: hover, focus-visible, disabled, loading, error, empty
- [ ] All transitions and animations have `@media (prefers-reduced-motion: reduce)` override verified
- [ ] Motion duration and easing values use project tokens — no magic values in CSS
- [ ] Dark mode: all new/changed components use correct token pairs — no hardcoded colours in dark contexts
- [ ] Layout and components verified at all documented breakpoints

## Data integrity gate (apply if story's Impacted Areas includes DB — DB_STANDARDS.md)
- [ ] Migration up/down verified in test environment
- [ ] FK / cascade scenarios verified
- [ ] No orphaned records introduced

## Release notes
- [ ] Release notes written in plain, user-facing language (no internal IDs, no tech jargon)
- [ ] Every user-visible change is mentioned
- [ ] Breaking changes (if any) are called out explicitly

## Architect gate — docs to update
- [ ] QA findings reviewed for any undocumented edge cases that expose doc gaps
- [ ] If any security edge case was found during QA, SECURITY.md flagged for update
- [ ] If any performance threshold was exceeded, PERFORMANCE.md flagged for update
- [ ] Architect gate table from ReviewDev / FinishDev confirmed as resolved or escalated

## Process
- [ ] Roll-back plan documented (or explicitly "N/A — purely additive")
- [ ] Sprint tag applied (or cross-sprint note added to release notes)
- [ ] Story ADO state transitions to Done only after all P0/P1 defects are closed
