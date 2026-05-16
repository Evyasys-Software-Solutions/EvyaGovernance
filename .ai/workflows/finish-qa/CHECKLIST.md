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

## Accessibility gate (apply if story's Impacted Areas includes Frontend — DESIGN_SYSTEM.md)
- [ ] Keyboard navigation verified through all new/changed interactive elements
- [ ] ARIA labels confirmed on all interactive controls
- [ ] Colour contrast confirmed against DESIGN_SYSTEM.md standard

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
