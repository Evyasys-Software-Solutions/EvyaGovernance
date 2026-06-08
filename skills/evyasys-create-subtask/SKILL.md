---
name: evyasys-create-subtask
description: Batch-decomposes one or more user stories (or all stories in an epic) into developer-ready subtasks. Builds shared technical context once — no per-story re-scanning. Detects cross-story dependencies, shared infrastructure tasks, and merge risks. Single approval gate covers all stories. One notification with the full batch summary. Triggered by /evyasys:CreateSubtask <EVYA-ID...> or /evyasys:CreateSubtask <EP-ID...>.
trigger: /evyasys:CreateSubtask
---

# Skill: evyasys-create-subtask

`/evyasys:CreateSubtask` decomposes one story or an entire epic's worth of stories in a single run.

---

## What it does

1. **Resolves inputs** — expands epic IDs to all their story IDs; deduplicates
2. **Loads all story files** in one batch — extracts ACs and Impacted Areas per story
3. **Builds shared knowledge base once** — quality-gate docs from `.evyasys/docs/` (or derived from codebase if docs absent); union of all domain docs based on all stories' flags
4. **Unified code analysis** — unions all impacted areas, reads each file once; builds shared technical inventory
5. **Cross-story dependency analysis** — shared files, shared infrastructure tasks, sequence requirements, parallelism opportunities, merge-conflict risk
6. **Single Gate** — consolidated plan table (all stories, strategy, task count, cross-story notes) — one approval for the whole batch
7. **Drafts all subtasks** — functional headlines + business rules + deep Technical Guidance per task, using shared context (no re-reading); no code in any task
8. **Shared task handling** — tasks serving multiple stories written once in the owning story; reference entries in others
9. **Cross-story consistency check** — every AC covered, no contradictions across shared files, QA regression rows cover cross-story touchpoints
10. **Saves and syncs (progressive)** — two modes:
    - **Story input**: each story is saved locally → PM-synced → notified immediately before moving to the next
    - **Epic input**: all stories in the epic are saved locally first, then PM-synced together, then a single notification fires for that epic; the next epic starts immediately after
11. **Playwright spec scaffolding** — one spec file per story from QA test scenarios
12. **Notifications** — `subtasks-batch-created` fires per story (story mode) or per epic (epic mode) — never waits for the entire batch to complete

---

## Input forms

```
/evyasys:CreateSubtask EVYA-1001
/evyasys:CreateSubtask EVYA-1001 EVYA-1002 EVYA-1003
/evyasys:CreateSubtask EP-001
/evyasys:CreateSubtask EP-001 EVYA-1005
```

---

## The load-once principle

Quality-gate docs, plugin rules, and source files are loaded **once per batch run**, not once per story.
For N stories with overlapping code areas, token usage scales with the number of unique files — not N × files.

---

## Two-layer task structure

Every implementation task has:

| Layer | Content | Audience |
|---|---|---|
| **Functional** | Headline + outcome summary + business rules + workflow — plain language | PO, QA, non-developers |
| **Technical Guidance** | Exact file paths · behaviour contracts (what functions do, not how) · DB schema specs · API contracts · edge cases · security layer · performance expectation | Developer implementing the task |

**No code in tasks.** Technical Guidance describes expected behaviour, contracts, and constraints.
The developer writes all implementation code during StartDev using project rules and their own judgement.

Functional headlines never contain class names, method names, or endpoint paths.

---

## Decomposition strategies

| Strategy | Description |
|---|---|
| **A — Backend-first + Frontend in logical groupings** *(default)* | Data/service/API layer first; UI by feature area |
| **B — Vertical slices** | One complete AC end-to-end per task |
| **C — Layer by layer** | All data → all service → all UI |

Recommended per story based on repo scan findings.

---

## Output

| Artefact | Path |
|---|---|
| Subtask file | `.evyasys/board/**/{storyId}/subtasks/{storyId}_Subtasks.md` |
| PM child tasks | Created under parent story in ADO / JIRA / GitHub Projects |
| PM IDs back-written | Into each `## Task N` header |
| Playwright spec | `tests/e2e/{storyId}.spec.ts` (scaffolded) |
| Local map | `.evyasys/.ado-map.json` updated |
| Notification | Single `subtasks-batch-created` card — all stories, task counts, shared tasks, flags |

---

## Docs fallback

If `.evyasys/docs/` does not exist, the agent derives standards from the observed codebase
patterns during the unified code analysis pass. TrainDocs can be run at any time to
formalise these into proper quality-gate documents.

---

## Failure handling

- PM sync failures are reported inline; local file is always saved regardless
- Each story's subtask file is saved before its PM sync is attempted
- Batch continues on individual story or epic PM failure
- Notification for a story/epic group is sent immediately after that group completes (failures included in the notification payload)
