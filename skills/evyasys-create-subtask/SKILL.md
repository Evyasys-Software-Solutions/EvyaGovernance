---
name: evyasys-create-subtask
description: Use this skill to break a user story into developer-ready subtasks with functional headlines and deep technical analysis. Always presents Strategy A (Backend-first), B (Vertical slices), C (Layer by layer) — recommends A. Each task has a functional headline plus a full Technical Analysis (files, methods, DB, API, edge cases, security, performance). Final task is always a dedicated QA task. Triggered by `/evyasys:CreateSubtask <StoryID>`. Creates child Tasks in Azure DevOps on approval.
trigger: /evyasys:CreateSubtask
---

# Skill: evyasys-create-subtask

Loads `.ai/workflows/create-subtask/*` (with `.evyasys/workflows/create-subtask/*` overrides),
runs as Senior Developer & Technical Analyst, and produces two-layer tasks via `TASK_TEMPLATE.md`.

## Two-layer task structure

Every implementation task has:

| Layer | Content | Audience |
|---|---|---|
| **Functional** | Headline + Functional Summary — outcome in plain language | Product, QA, non-developers |
| **Technical** | Files, methods, DB, API, edge cases, security, performance | Developer implementing the task |

Functional headlines never contain class names, method names, or endpoint paths.
Technical Analysis must be specific enough to implement from cold — no hand-waving.

## Decomposition strategies (always all three — A recommended)

| Strategy | Description |
|---|---|
| **A — Backend-first + Frontend in logical groupings** *(recommended)* | Data/service/API first; UI grouped by feature area |
| **B — Vertical slices** | One complete AC end-to-end per task |
| **C — Layer by layer** | All data → all service → all UI |

## Final task — always QA

A dedicated **QA: Test Scenarios & Playwright Automation** task is always the last task:
- Test scenarios table with Happy Path / Positive / Negative / Edge / Regression rows
- Playwright spec file path and locator strategy for all UI-facing ACs

## Output
- `.evyasys/board/**/<StoryID>/subtasks/<StoryID>_Subtasks.md`
- ADO Task IDs (back-written into each ## Task header)
