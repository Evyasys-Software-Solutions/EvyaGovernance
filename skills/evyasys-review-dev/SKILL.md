---
name: evyasys-review-dev
description: Use this skill to run a structured code review on a development branch before finishing dev. Acts as an independent senior reviewer — checks AC coverage, correctness, security, YAGNI, test quality, diff scope. Issues Critical/Important/Minor findings. Critical items block progression to FinishDev. Triggered by `/evyasys:ReviewDev <StoryID>`.
trigger: /evyasys:ReviewDev
---

# Skill: evyasys-review-dev

Acts as an **independent senior code reviewer** — separate from the developer role.
Reads the diff against main, checks every AC has a passing test, reviews code for
correctness / security / YAGNI / test quality, and issues a structured report.

## Severity model (from SuperPower code review pattern)

| Level | Meaning | Blocks? |
|---|---|---|
| **Critical** | Untested AC, broken logic, security hole | YES |
| **Important** | Test gap, performance risk, unclear code | Should fix |
| **Minor** | Style, naming | Note |
| **Strength** | Well-done pattern | — |

## Key behaviours

- Evidence before claims — every finding cites file + line
- YAGNI check — grep before flagging unused code
- Pushback accepted — if developer argues technically, re-evaluate
- No performative language — findings only, no "great work"

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_CodeReview.md` (saved on GO)
- No ADO state change — `/evyasys:FinishDev` handles that
