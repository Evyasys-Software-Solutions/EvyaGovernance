# Diagnose Checklist

## Before running the checks
- [ ] Plugin dir locator run and captured
- [ ] `.evyasys/project.yaml` located (may be missing — check 6 handles it)
- [ ] Every check treated as read-only (no writes to disk, no state changes)

## Execution
- [ ] All checks that don't depend on another are launched in parallel
- [ ] Total wall time targeted under 15 seconds
- [ ] Fast-fail on unreachable endpoints (no long retries during a diagnostic run)

## Every FAIL row
- [ ] States exactly what failed (specific message, not "something went wrong")
- [ ] Includes an actionable fix (command to run, file to edit, or doc to consult)
- [ ] Uses the `❌ FAIL` prefix

## Every WARN row
- [ ] Explains why it's a warning and not a failure
- [ ] Includes a fix if one is available, or notes it's optional / user-preference

## Every SKIP row
- [ ] States the reason for skipping (e.g. `pmTool === 'local'`, Python not installed)

## Never fake results
- [ ] No PASS reported for a check that couldn't actually be run
- [ ] No FAIL reported for a check that was actually a SKIP
- [ ] Ambiguous or partial results marked WARN with the ambiguity noted

## Output
- [ ] Report header shows plugin version, project name, PM tool, notification tool
- [ ] One line per check (1–20) with the correct symbol
- [ ] Section headings match the 6 categories
- [ ] Overall tally line at the end
- [ ] "Issues to address" list showing every WARN/FAIL row's fix
- [ ] Structured `<!-- EVYADIAGNOSE ... -->` tail block emitted with valid JSON
- [ ] No artefacts written to `.evyasys/`
