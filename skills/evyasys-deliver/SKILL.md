---
name: evyasys-deliver
description: Use this skill for end-to-end story delivery in a single command. Reads the story + subtasks; batches clarifying questions into one exchange; does an architecture reference scan; writes the code to the working tree via Edit/Write following every loaded standard (ARCHITECTURE, RULES, STANDARDS, PATTERNS, EXTENSION_PATTERNS, ERROR_HANDLING, LOCALISATION, DTO_STANDARDS, RBAC, plus domain docs based on Impacted Areas); runs a full self code-review with two auto-fix iterations for Critical findings plus an anti-hallucination fact-check via the verifier CLI; drafts a test plan; queues doc updates; drafts the DevSummary; then on user approval writes 4 artefacts (TechBrainstorm, DevSummary, CodeReview, TestPlan), updates the PM tool state to Ready for QA, and fires one notification. **No git operations by default** — the developer commits and pushes themselves. Opt-in `--commit` flag makes the hook additionally create the feature branch and a local commit (never pushed). Three approval gates only. Never drafts release notes (FinishQa owns that). Accepts one or more story IDs, one epic ID, or a mix. Triggered by `/evyasys:Deliver`.
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

**4 artefacts** (never 5 — release notes belong to FinishQa) written to `.evyasys/board/**/<StoryID>/`:

| Artefact | Purpose |
|---|---|
| `<id>_TechBrainstorm.md` | The approved architecture decision + reference files |
| `<id>_DevSummary.md` | ACs met, files touched, tests added, manual QA hints, docs to update, assumptions |
| `<id>_CodeReview.md` | Full self-review with severity-graded findings + verifier fact-check result |
| `<id>_TestPlan.md` | AC-driven test cases including edge and regression |

Plus:
- PM state transitioned to Ready for QA
- One notification per story (or per epic in epic mode)
- Traceability entry appended to `.evyasys/traceability.json`
- `.evyasys/CONTEXT.md` regenerated
- **No git operations** (default) — source-code changes are in the working tree, developer commits + pushes
- **With `--commit`**: hook additionally creates the feature branch and a local commit (never pushed)

## Speed targets (from AGENT.md)

| Story size | Target wall time |
|---|---|
| Small (1–3 subtasks, ≤ 5 files) | < 5 min |
| Medium (4–7 subtasks, 6–15 files) | < 15 min |
| Large (8+ subtasks, 15+ files) | < 30 min (announced up-front with offer to split) |

## Safety

- **No git operations by default.** Source code is written to the working tree only. The developer stays in control of git.
- **Never pushes to remote** — even with `--commit`, only a local commit is created.
- Nothing irreversible happens before Gate 3.
- If Critical review findings remain after 2 auto-fix iterations, the run is marked BLOCKED and the user chooses fix / override / abort.
- If the anti-hallucination verifier fails on any claim, that's treated as a Critical finding.
- Rejected at Gate 3 → no artefacts written, no PM change, no notification. Working-tree source changes are untouched by the rejection.

## Usage

| Command | Effect |
|---|---|
| `/evyasys:Deliver EVYA-1042` | Deliver a single story. Code written to working tree; no git ops. |
| `/evyasys:Deliver EVYA-1042 EVYA-1043` | Deliver stories sequentially; batched notifications. |
| `/evyasys:Deliver EP-001` | Auto-expand epic to its stories; sequential delivery; one epic-summary notification. |
| `/evyasys:Deliver EVYA-1042 --commit` | As above, plus hook creates feature branch + local commit after Gate 3. |
