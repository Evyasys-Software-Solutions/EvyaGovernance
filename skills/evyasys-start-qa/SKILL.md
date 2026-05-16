---
name: evyasys-start-qa
description: Use this skill to generate a comprehensive, executable test plan for a story — AC-driven test cases (positive + negative + edge), regression checks for every touched file, and domain-specific non-functional tests (security, performance, accessibility, data integrity) based on the story's Impacted Areas flags. Confirms test environment and data availability before writing any test cases. Transitions Azure DevOps state to In QA. Triggered by `/evyasys:StartQa <StoryID>`.
trigger: /evyasys:StartQa
---

# Skill: evyasys-start-qa

A **test plan is only as good as the environment it runs in.** This skill has a
HARD-GATE before writing test cases: test environment and data availability must be
confirmed. A plan that can't be executed is not a plan.

## What it reads

- Story ACs and **Impacted Areas** flags — flags drive which quality-gate docs are loaded
- Dev Summary — "Files touched" drives regression scope; "Manual QA hints" are starting points
- Code Review artefact (if present) — flagged issues become edge cases
- `TESTING.md` — always; test strategy, naming rules, coverage requirements, mocking policy
- `SECURITY.md` — if Security flag set
- `PERFORMANCE.md` — if Performance flag set
- `FRONTEND.md` + `DESIGN_SYSTEM.md` — if Frontend flag set
- `DB_STANDARDS.md` — if DB flag set

## Test plan structure

| Section | Content |
|---|---|
| AC-driven cases | ≥1 positive + ≥1 negative per AC; Gherkin for multi-step scenarios |
| Edge cases | ≥2 per major workflow branch: empty, max, concurrent, timezone, permissions, network failure |
| Regression checks | ≥1 per file touched; ≥2 per file marked high-risk in Dev Summary |
| Security tests | Every protected endpoint → 401/403; every user-controlled field → invalid input |
| Performance tests | Response time target from PERFORMANCE.md as explicit pass/fail threshold |
| Accessibility | Keyboard nav, ARIA labels, colour contrast — if Frontend flag |
| Data integrity | FK constraints, cascade, migration up/down — if DB flag |

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_TestPlan.md`
- ADO state → **In QA**
- Teams QA-started card posted
