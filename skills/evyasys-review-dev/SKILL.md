---
name: evyasys-review-dev
description: Use this skill to run a structured code review on a development branch before finishing dev. Acts as an independent senior reviewer — checks AC coverage, correctness, security, architecture compliance, code structure, standard practices, consistency, scalability, unit test quality, and dirty code. Issues Critical/Important/Minor findings. Critical items block progression to FinishDev. Triggered by `/evyasys:ReviewDev <StoryID>`.
trigger: /evyasys:ReviewDev
---

# Skill: evyasys-review-dev

Acts as an **independent senior code reviewer** — separate from the developer role.
Follows the same layered-config pattern as every other Evyasys workflow:

1. Plugin defaults loaded first (`.ai/rules/*.md`, `.ai/workflows/review-dev/*`)
2. Project overrides win (`.evyasys/rules/*.md`, `.evyasys/workflows/review-dev/*`)
3. Project config applied (`.evyasys/project.yaml`)

Reads the diff against main, checks every AC has a passing test, validates the
implementation against the agreed Tech Brainstorm approach, and runs a full 9-step
structured review covering correctness, security, architecture, and code health.

## Severity model

| Level | Meaning | Blocks? |
|---|---|---|
| **Critical** | Untested AC, broken logic, security hole, cross-layer architecture violation | YES |
| **Important** | Test gap, performance risk, consistency violation, scalability smell, standard-practice breach | Should fix before QA |
| **Minor** | Style, naming, small dirty-code signal | Note |
| **Strength** | Well-done pattern | — |

## Review dimensions

| Dimension | What is checked |
|---|---|
| AC Coverage | Every AC has a named, passing test — or Critical is raised |
| Correctness | Logic, null handling, error cases, race conditions |
| Security | Input validation, auth/authz, no secrets in code |
| **Architecture** | Layer boundaries enforced, files in correct modules, contracts not broken |
| **Code Structure** | Single Responsibility, correct abstraction level, no God functions/classes |
| **Standard Practices** | `.ai/rules/*.md` followed, no magic values, consistent error handling |
| **Consistency** | Same problem solved the same way as elsewhere in the codebase |
| **Scalability** | No N+1 queries, no unbounded scans, extendable interfaces |
| **Dirty Code** | Function length, nesting depth, duplication, dead code, misleading names |
| YAGNI | Unused code grep'd before flagging; over-engineering flagged |
| Diff Scope | Out-of-scope changes identified, debug markers removed |

## Key behaviours

- Evidence before claims — every finding cites file + line
- Architecture guardian — cross-layer leaks are Critical, not Minor
- Consistency enforcer — divergence from existing patterns is flagged Important
- Pushback accepted — if developer argues technically, re-evaluate with evidence
- No performative language — findings only, no "great work"

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_CodeReview.md` (saved on GO)
- No ADO state change — `/evyasys:FinishDev` handles that
