# Prompt: /evyasys:StartDev <StoryID>

You are the Engineering Lead described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story: `docs/stories/<id>_UserStory.md`
- Subtasks: `docs/stories/<id>_Subtasks.md`
- Repo scan: `python scripts/repo_scan.py --story <id>`
- Naming rules: `.ai/rules/naming.md`
- Definition of Ready: `.ai/rules/definition-of-ready.md`

---

## Phase 1 — Technical Brainstorm

### Step 1: Deep read
Read the story and all subtasks completely. Write a 2–3 sentence plain-English
summary of **what the system must do differently** after this story ships.
No implementation detail — business outcome only.

### Step 2: Codebase probe
Run `python scripts/repo_scan.py --story <id>`.
List:
- Which existing modules / files will be touched.
- Which shared utilities or services are in scope.
- Any risky or unfamiliar areas flagged by the scan.

### Step 3: Generate approaches (minimum 3, maximum 5)
For each approach write:

```
### Option N — <Short name>
Summary: 2–3 sentences on the approach.
Pros:
  - <specific advantage 1>
  - <specific advantage 2>
Cons:
  - <specific risk or cost 1>
  - <specific risk or cost 2>
Estimate delta: S / M / L relative to the current subtask estimates.
```

Approaches must be meaningfully different. Examples of distinct directions:
event-driven vs direct call, new microservice vs in-process, feature-flag
incremental vs big-bang, cache-first vs DB-first, etc.

### Step 4: Recommend
State which option you recommend and why in 2–4 sentences.
Name the one deciding factor that tips the balance.
Name the top risk of your recommendation and how to mitigate it.

### Step 5: Open questions
List any unknowns the team should resolve before or during development.
Format: `? <question>` on each line.

### Step 6: Show and wait
Present the brainstorm using `BRAINSTORM_TEMPLATE.md`.
Ask the team:
1. "Do you agree with the recommended approach?"
2. "Any constraint or context I missed?"

**Wait for an explicit response before moving to Phase 2.**
The team may select a different option — update the recommendation accordingly.

---

## Phase 2 — Start-Dev Gates

Run only after the brainstorm is approved or an alternative approach is agreed.

### Gate 1: Subtasks exist
Check `docs/stories/<id>_Subtasks.md` exists and has at least one task.
Status: ✅ exists and populated / ❌ missing or empty

### Gate 2: Branch naming
Run `git branch --list 'feature/<id>-*'`.
Expected format per naming rules: `feature/<id>-<kebab-title>`
Status: ✅ found / ❌ missing — suggest: `feature/<id>-<title-from-story>`

### Gate 3: Draft PR
Run `gh pr list --head "feature/<id>-" --state open 2>/dev/null` (best-effort).
If `gh` is unavailable: ask the user to confirm a draft PR exists.
Status: ✅ confirmed / ❌ missing / ⚠️ unverifiable (note why)

### Gate 4: Definition of Ready re-check
Re-run `definition-of-ready.md` line by line against the current story.
List each criterion: ✅ pass / ❌ fail with the specific gap.
Status: ✅ all pass / ❌ N items failing (list them)

### Gate 5: Dependencies cleared
List every dependency from the story's Dependencies section.
For each, confirm status with the user: cleared / blocked / not applicable.
Status: ✅ all clear / ❌ N blocked (name them)

---

## Gate summary table

| Gate | Status | Notes |
|---|---|---|
| Subtasks exist | ✅ / ❌ | |
| Branch naming | ✅ / ❌ | `feature/<id>-<title>` |
| Draft PR | ✅ / ❌ / ⚠️ | |
| Definition of Ready | ✅ / ❌ | |
| Dependencies cleared | ✅ / ❌ | |

**Overall decision: GO ✅ / NO-GO ❌**

If NO-GO: list exactly which items are blocking and what must happen to unblock each.

---

## On user approval

1. Save the agreed brainstorm to `docs/stories/<id>_TechBrainstorm.md`.
2. The hook transitions ADO state to **In Progress** and posts the Teams kickoff card.
