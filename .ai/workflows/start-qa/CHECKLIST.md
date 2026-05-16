# Start-QA self-review checklist

## Context loading (must complete before writing any test cases)
- [ ] `.ai/rules/*.md` read — active constraints noted
- [ ] `.evyasys/rules/*.md` read — project overrides applied (win over plugin rules)
- [ ] `TESTING.md` loaded — test strategy, naming rules, coverage requirements, mocking policy applied
- [ ] Story's **Impacted Areas** domain flags read → loaded: SECURITY.md / PERFORMANCE.md / FRONTEND.md / DESIGN_SYSTEM.md / DB_STANDARDS.md as flagged
- [ ] Dev Summary read in full — "Files touched", "Manual QA hints", and "Risks / known issues" all noted
- [ ] Code Review artefact checked — previously flagged issues carried into test cases as edge cases
- [ ] Test environment confirmed from user (HARD-GATE: no test cases written until answered)
- [ ] Test data availability confirmed if story is stateful or user-specific (HARD-GATE)

## AC coverage
- [ ] Every Acceptance Criterion identified and listed
- [ ] Every AC has ≥ 1 positive test case (happy path, expected data, expected state)
- [ ] Every AC has ≥ 1 negative test case (boundary, invalid input, unauthorised access, missing data)
- [ ] Gherkin (`Given / When / Then`) used for every multi-step or workflow-level scenario
- [ ] Test case IDs are unique and follow `TESTING.md` naming rules

## Edge cases
- [ ] At least 2 edge cases per major workflow branch
- [ ] Empty input covered
- [ ] Maximum/boundary input covered
- [ ] Concurrent execution scenario considered (covered or marked N/A with reason)
- [ ] Timezone edges considered if story involves dates/times
- [ ] Permission boundaries tested (what happens below required permission level)
- [ ] Network failure mid-flow considered if story makes external calls

## Regression checks
- [ ] Every file in the Dev Summary's "Files touched" has at least one regression check
- [ ] Every file the Dev Summary marked high-risk has at least two regression checks
- [ ] Regression checks verify existing behaviour still holds, not just that new code runs

## Security testing (apply if story touches auth / permissions / data — SECURITY.md)
- [ ] Every protected endpoint tested for unauthorised access (401/403 expected)
- [ ] Every user-controlled field has an invalid input test case
- [ ] PII exposure tested: confirm not present in error messages, logs, or API responses
- [ ] Session/token behaviour tested where applicable

## Performance testing (apply if story touches a hot path — PERFORMANCE.md)
- [ ] Response time budget from PERFORMANCE.md cited as explicit pass/fail threshold
- [ ] Method for measuring response time in test environment stated
- [ ] Load scenario described if story involves concurrent or bulk operations

## Accessibility (apply if story touches UI — DESIGN_SYSTEM.md)
- [ ] Keyboard navigation check covers all interactive elements
- [ ] ARIA labels verified on all interactive controls
- [ ] Colour contrast meets the project's documented standard from DESIGN_SYSTEM.md

## Data integrity (apply if story touches DB — DB_STANDARDS.md)
- [ ] Foreign key constraint scenarios covered (orphan records, cascade behaviour)
- [ ] Migration runs cleanly up and down in test environment
- [ ] Concurrent write / race condition scenario considered

## Non-functional section
- [ ] Every non-functional category is either filled or marked "N/A — <reason>"
- [ ] No blank cells in non-functional table

## Plan quality
- [ ] Test data required for each case is explicitly stated
- [ ] Test environment (URL, DB seed, feature flag state) is explicit
- [ ] Exit criteria are listed (what "done" looks like for this QA cycle)
- [ ] No test case relies on production data or uncontrolled external state
