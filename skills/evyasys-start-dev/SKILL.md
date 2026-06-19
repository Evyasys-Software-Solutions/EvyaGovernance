---
name: evyasys-start-dev
description: Use this skill to start development on one or more stories or an entire epic. Accepts a single story ID, multiple story IDs, one or more epic IDs, or any mix (e.g. `EVYA-1042`, `EVYA-1042 EVYA-1043`, `EP-001`, `EP-001 EVYA-1005`). Epic IDs are automatically expanded to their constituent stories. Runs a two-phase workflow for each story — structured technical brainstorm (minimum 3 approaches, explicit recommendation, team approval) then start-dev gates (branch naming, draft PR, Definition of Ready, dependencies). On GO approval transitions each story to In Progress and posts a kickoff notification. Triggered by `/evyasys:StartDev <StoryID|EpicID> [...]`.
trigger: /evyasys:StartDev
---

# Skill: evyasys-start-dev

## Phase 1 — Technical Brainstorm

Loads the story and subtasks. Runs a repo scan. Generates at least 3 distinct
implementation approaches (each with pros, cons, estimate delta). Recommends one
with a clear deciding reason. Waits for team to agree before proceeding.

The brainstorm is saved to the story folder under `.evyasys/board/` — it travels
with the PR so the architectural decision is on record.

## Phase 2 — Start-Dev Gates

| Gate | Check |
|---|---|
| Subtasks | `.evyasys/board/**/<id>/subtasks/<id>_Subtasks.md` exists and is non-empty |
| Branch | matches `feature/<id>-<kebab>` naming convention |
| Draft PR | confirmed open (via `gh` or user confirmation) |
| Definition of Ready | re-checked line by line against current story |
| Dependencies | each story dependency confirmed cleared |

Produces a gate table with GO / NO-GO verdict.

## Output
- `.evyasys/board/**/<StoryID>/<StoryID>_TechBrainstorm.md` — agreed technical plan
- ADO state → **In Progress**
- Teams kickoff card posted
