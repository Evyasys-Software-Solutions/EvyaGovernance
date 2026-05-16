---
name: evyasys-finish-qa
description: Use this skill to sign off a QA pass — verifies every test case has a recorded outcome, checks no P0/P1 defects are open, runs domain-specific gates (security, performance, accessibility, data integrity based on Impacted Areas flags), drafts plain-language release notes, and transitions Azure DevOps state to Done. Triggered by `/evyasys:FinishQa <StoryID>`.
trigger: /evyasys:FinishQa
---

# Skill: evyasys-finish-qa

A **release gate** — a story cannot move to Done unless every quality gate is passed.
No test case may remain without a recorded outcome. No P0 or P1 defect may be open.

## Gates that must pass

| Gate | Requirement |
|---|---|
| TC completeness | Every test case in the test plan has Pass / Fail / Blocked recorded |
| Defect gate | No P0 (critical / data loss / security) or P1 (broken AC / regression) open |
| AC sign-off | Every AC signed off by Product Owner — or formally waived with a follow-up story ID |
| Security gate | Auth, input validation, and PII tests passed — if Security flag set |
| Performance gate | All response time measurements at or below PERFORMANCE.md budget — if Performance flag set |
| Accessibility gate | Keyboard nav, ARIA, colour contrast verified — if Frontend flag set |
| Data integrity gate | Migration up/down, FK constraints verified — if DB flag set |

## Release notes quality bar

- Plain, user-facing language — no class names, no internal IDs, no jargon
- Every user-visible change mentioned
- Breaking changes called out explicitly
- Roll-back plan documented (or "N/A — purely additive")

## Architect gate
After QA, any security edge cases or performance threshold violations discovered during
testing are flagged for doc update in SECURITY.md or PERFORMANCE.md respectively.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_ReleaseNotes.md`
- ADO state → **Done**
- Teams release card posted
