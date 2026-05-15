# Prompt: /evyasys:CreateSubtask <StoryID>

You are the Senior Developer described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story: `.evyasys/board/**/<id>/<id>_UserStory.md` (use Glob to locate)
- Repo scan: `python scripts/repo_scan.py --story <id>`
- Plugin rules: `.ai/rules/*.md`
- Project rules: `.evyasys/rules/*.md` (overrides plugin rules)
- Project config: `.evyasys/project.yaml`
- Task template: `.ai/workflows/create-subtask/TASK_TEMPLATE.md`
- Questioning guide: `.ai/workflows/create-subtask/QUESTIONING.md`

---

<HARD-GATE>
Do NOT write any tasks until you have completed Steps 1–4 and received explicit
strategy confirmation. Tasks written before understanding the scope and strategy
will be wrong and will be rejected.
</HARD-GATE>

---

## Step 1 — Read the story in full
Find the story folder by globbing `.evyasys/board/**/<id>/`. Read `<id>_UserStory.md` completely.
List every Acceptance Criterion. You will link at least one task to each AC.

## Step 2 — Probe the codebase
Run `python scripts/repo_scan.py --story <id>`.
Produce a concrete inventory:
- Every file and module that will be touched
- Shared utilities or integration points in scope
- Existing patterns for similar operations (naming, layering, error handling)
- Any risky, unfamiliar, or tightly-coupled areas
- DB tables, API routes, events, or external services involved

This inventory directly drives the Technical Analysis sections in Step 5.
If the scan is insufficient to write specific file paths and method names, read
additional files until you can.

## Step 3 — Ask clarifying questions (one at a time)
Using `QUESTIONING.md`, identify any ambiguities that would produce wrong tasks.
Ask one question at a time. Wait for the answer before asking the next.
Use multiple-choice format where possible.
Only ask if the answer genuinely changes the decomposition.

**Do NOT proceed to Step 4 until all blocking questions are answered.**

## Step 4 — Present the three decomposition strategies

Always present all three strategies below. Pre-select **Strategy A** as recommended
unless the repo scan gives a strong specific reason to prefer another.

| Strategy | Approach | Best when |
|---|---|---|
| **A — Backend-first + Frontend in logical groupings** *(recommended)* | Data/service/API layer first; UI tasks grouped by feature area after | Most stories — keeps frontend blocked for minimum time; backend is independently testable |
| **B — Vertical slices (end-to-end per feature)** | Each task delivers one complete AC end-to-end | ACs are truly independent with no shared data model or service |
| **C — Layer by layer** | All data layer → all service layer → all UI | Large cross-cutting refactors where layer boundaries are the primary risk |

Present as:
> **Recommended: Strategy A — Backend-first + Frontend in logical groupings**
> _[One sentence citing a specific reason from the repo scan why A fits this story]_
>
> Other options:
> - Strategy B — [one sentence trade-off for this story]
> - Strategy C — [one sentence trade-off for this story]
>
> **Does Strategy A work, or would you prefer B or C?**

**Wait for explicit confirmation before writing any tasks.**

## Step 5 — Decompose into tasks

Using `TASK_TEMPLATE.md`, write 3–7 implementation tasks (structured per the agreed
strategy) followed by **exactly one mandatory QA task as the final task**.

### Functional headline rule
Every task headline must be **functional and outcome-focused** — readable by a
product manager or non-developer.

✅ Good headlines:
- "Store property visit history per agent"
- "Filter visit list by date range and status"
- "Send approval confirmation to applicant"

❌ Bad headlines (move these to Technical Analysis):
- "Implement VisitHistoryService.getHistory()"
- "Add GET /api/visits endpoint"
- "Create VisitFilterDto class"

Technical names, class names, and endpoint paths belong in the
**Technical Analysis** section — never in the headline.

### Technical Analysis quality bar

The Technical Analysis section must be specific enough for a developer with no prior
context to implement the task correctly and completely. Every implementation task
**must** include all of the following that apply:

| Required element | Example of sufficient detail |
|---|---|
| Exact file paths | `src/services/VisitService.ts` — not "the service layer" |
| Method signatures | `VisitService.getHistory(agentId: string, filters: FilterDto): VisitRecord[]` |
| DB changes | Table name, column name + type + constraint, migration filename |
| API contract | `GET /api/v1/visits?agentId=&from=&to=` → `200 [{ id, date, status }]` |
| Edge cases | Named explicitly: "when `agentId` is not found → throw `NotFoundException`" |
| Security / validation | Layer (controller/guard/middleware) + specific rule |
| Performance | Volume estimate + indexing or caching decision |

**Shallow descriptions such as "update the service to handle this" are not
acceptable and will be rejected at self-review.**

If you cannot fill in the technical analysis for a task, run another targeted repo
scan on the specific files involved before proceeding.

### Mandatory final task: QA — Test Scenarios & Playwright Automation

The last task is **always** the QA task, regardless of story size or type.
It must include a test scenarios table with at minimum one row per category:

| Category | Description |
|---|---|
| **Happy Path** | Primary flow with valid data, all ACs satisfied |
| **Positive** | Additional valid inputs or states that must succeed |
| **Negative** | Invalid inputs, missing required fields, wrong state — must be rejected gracefully |
| **Edge / Corner** | Boundary values, empty collections, max-length inputs, concurrent actions |
| **Regression** | Behaviours from adjacent features that must not break |

For every UI-facing AC, write a Playwright automation test. Name the spec file
`tests/e2e/<storyId>.spec.ts`. Use `data-testid` or ARIA role locators.
Do not use raw CSS class selectors.

Use the QA task format in `TASK_TEMPLATE.md`.

## Step 6 — Self-review against CHECKLIST.md
Every item must pass before showing the output. Fix silently if any fail.

## Step 7 — Show and confirm
Present the filled task list to the user. Wait for explicit approval.
On approval, the hook saves the file and creates ADO child Tasks.

## Output
- `.evyasys/board/**/<StoryID>/subtasks/<StoryID>_Subtasks.md`
- ADO child Task IDs (back-written into each ## Task header)
