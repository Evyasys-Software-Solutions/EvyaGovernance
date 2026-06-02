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
7. **Drafts all subtasks** — functional headlines + deep Technical Analysis per task, using shared context (no re-reading)
8. **Shared task handling** — tasks serving multiple stories written once in the owning story; reference entries in others
9. **Cross-story consistency check** — every AC covered, no contradictions across shared files, QA regression rows cover cross-story touchpoints
10. **Saves and syncs** — each story's subtask file saved locally; child tasks created in PM tool linked to parent story
11. **Playwright spec scaffolding** — one spec file per story from QA test scenarios
12. **Single notification** — one `subtasks-batch-created` card with all stories, task counts, shared tasks, and cross-story flags

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
| **Functional** | Headline + outcome summary — plain language | PO, QA, non-developers |
| **Technical** | Exact file paths, method signatures, DB changes, API contract, edge cases, security, performance | Developer implementing the task |

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
- Batch continues on individual story PM failure
- Notification sent after all stories are processed (reports any failures inline)
