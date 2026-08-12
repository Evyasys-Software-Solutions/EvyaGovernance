---
name: evyasys-deliver
description: Use this skill for end-to-end story delivery in a single command. Reads the story + subtasks; batches clarifying questions into one exchange; does an architecture reference scan; writes the code following every loaded standard (ARCHITECTURE, RULES, STANDARDS, PATTERNS, EXTENSION_PATTERNS, ERROR_HANDLING, LOCALISATION, DTO_STANDARDS, RBAC, plus domain docs based on Impacted Areas); runs a full self code-review with two auto-fix iterations for Critical findings; drafts a test plan; queues doc updates; drafts release notes; then on user approval commits the changes locally on a feature branch, updates the PM tool state to Ready for QA, and fires one notification per story or per epic. Three approval gates only — clarifying questions (batched, skipped if unambiguous), architecture recommendation, and final commit summary. Never pushes. Accepts one or more story IDs, one epic ID, or a mix. Triggered by `/evyasys:Deliver`.
trigger: /evyasys:Deliver
---

# Skill: evyasys-deliver

## What it does

End-to-end story orchestrator that runs 10 phases with 3 human approval gates:

| Phase | Action | Autonomous? |
|---|---|---|
| 0 | Batch-load story + subtasks + rules + all quality-gate docs + templates | Yes |
| 1 | Codebase probe + batch clarifying questions (Gate 1 — auto-skipped if none) | Gate |
| 2 | Architecture reference scan + brainstorm recommendation (Gate 2) | Gate |
| 3 | Write the code following every loaded standard | Yes |
| 4 | Full ReviewDev self-review with up to 2 auto-fix iterations | Yes |
| 5 | Generate test plan (positive/negative/edge/regression/non-functional) | Yes |
| 6 | Queue doc updates for `TrainDocs --retrain` | Yes |
| 7 | Draft DevSummary + ReleaseNotes | Yes |
| 8 | Final approval summary (Gate 3 — commit + PM update + notify) | Gate |
| 9 | Hook: writes artefacts, creates feature branch, local commit, PM update, notification | Yes |
| 10 | Per-story status report + next steps | Yes |

## What it produces per story

All artefacts written to `.evyasys/board/**/<StoryID>/`:

| Artefact | Purpose |
|---|---|
| `<id>_TechBrainstorm.md` | The approved architecture decision + reference files |
| `<id>_DevSummary.md` | ACs met, files touched, tests added, manual QA hints, docs to update, assumptions |
| `<id>_CodeReview.md` | Full self-review with severity-graded findings |
| `<id>_TestPlan.md` | AC-driven test cases including edge and regression |
| `<id>_ReleaseNotes.md` | Plain-language user-facing draft |

Plus:
- Local git commit on `feature/<id>-<title>` branch (never pushed)
- PM state transitioned to Ready for QA
- One notification per story (or per epic in epic mode)

## Speed targets (from AGENT.md)

| Story size | Target wall time |
|---|---|
| Small (1–3 subtasks, ≤ 5 files) | < 5 min |
| Medium (4–7 subtasks, 6–15 files) | < 15 min |
| Large (8+ subtasks, 15+ files) | < 30 min (announced up-front with offer to split) |

## Safety

- Never pushes to remote — user pushes when ready.
- Nothing irreversible happens before Gate 3.
- If Critical review findings remain after 2 auto-fix iterations, the run is marked BLOCKED and
  the user chooses fix / override / abort.
- Rejected at Gate 3 → no artefacts written, no commit, no PM change, no notification.

## Usage

| Command | Effect |
|---|---|
| `/evyasys:Deliver EVYA-1042` | Deliver a single story |
| `/evyasys:Deliver EVYA-1042 EVYA-1043` | Deliver stories sequentially; batched notifications |
| `/evyasys:Deliver EP-001` | Auto-expand epic to its stories; sequential delivery; one epic-summary notification |
