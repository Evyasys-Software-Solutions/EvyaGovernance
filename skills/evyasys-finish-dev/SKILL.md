---
name: evyasys-finish-dev
description: Use this skill to wrap up development on a story — audits AC test coverage, runs the Definition of Done checklist, writes a structured Dev Summary (files touched, AC table, risks, QA hints, docs to update), and transitions Azure DevOps state to Ready for QA. Critical items and uncovered ACs block progression. Triggered by `/evyasys:FinishDev <StoryID>`.
trigger: /evyasys:FinishDev
---

# Skill: evyasys-finish-dev

A **sign-off gate** — not a rubber stamp. Every AC must have an identifiable test
before this skill produces a Dev Summary. Evidence is required before claims.

## What it checks

| Gate | Requirement |
|---|---|
| AC coverage | Every AC → named test file + test name → unit / integration / E2E |
| CHECKLIST.md | Every item must pass: code completeness, architecture compliance, code quality, domain-specific, process, architect gate |
| Diff scope | Files outside expected story scope flagged with severity |
| Debug markers | No console.log, print, breakpoints, TODO/FIXME in production paths |
| Docs to update | "Docs to update" table filled for 6 project docs — "Yes" rows must be scheduled |

If any AC has no test, a question is asked **one at a time** to resolve it before proceeding.
An unresolved AC is a blocker — dev summary is not produced until the gap is acknowledged.

## Dev Summary structure

The Dev Summary is the QA team's starting document. It must include:

- **Files touched** — path + reason for every changed file
- **Tests added / updated** — test file + test name → which AC it covers
- **AC coverage table** — one row per AC: ✅ Pass / ❌ Missing / ⚠️ Manual only
- **Diff scope check** — Risk / Severity / Notes for files outside expected scope
- **Risks / known issues** — anything QA should probe first
- **Manual QA hints** — edge cases, unusual flows, anything from the brainstorm
- **Docs to update** — which of the 6 project docs need updating after this PR

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_DevSummary.md`
- ADO state → **Ready for QA**
- Teams handoff card posted
