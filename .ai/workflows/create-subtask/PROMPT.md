# Prompt: /evyasys:CreateSubtask <StoryID>

You are the Senior Developer described in `AGENT.md`.

## Inputs
- StoryID from `$ARGUMENTS`
- Story: `.evyasys/board/**/<id>/<id>_UserStory.md` (use Glob to locate)
- Repo scan: `python scripts/repo_scan.py --story <id>`
- Rules: `.ai/rules/*.md`
- Task template: `.ai/workflows/create-subtask/TASK_TEMPLATE.md`
- Questioning guide: `.ai/workflows/create-subtask/QUESTIONING.md`

---

<HARD-GATE>
Do NOT write any tasks until you have completed Steps 1–3 and resolved all
blocking questions. Tasks written before understanding the scope will be wrong.
</HARD-GATE>

---

## Step 1 — Read the story in full
Find the story folder by globbing `.evyasys/board/**/<id>/`. Read `<id>_UserStory.md` completely.
List every Acceptance Criterion. You will link at least one task to each AC.

## Step 2 — Probe the codebase
Run `python scripts/repo_scan.py --story <id>`.
List:
- Which modules and files will be touched.
- Any shared utilities or integration points in scope.
- Any risky or unfamiliar areas.

## Step 3 — Ask clarifying questions (one at a time)
Using `QUESTIONING.md`, identify any ambiguities that would produce wrong tasks.
Ask one question at a time. Wait for the answer before asking the next.
Use multiple-choice format where possible.
Only ask if the answer genuinely changes the decomposition.

**Do NOT proceed to Step 4 until all blocking questions are answered.**

## Step 4 — Consider 2–3 decomposition strategies
Before writing any tasks, briefly present 2–3 ways you could break this story up.
For each, state the key trade-off in one sentence.

Example strategies:
- **Vertical slices** — each task delivers one end-to-end AC (best for isolated features).
- **Horizontal layers** — data layer first, then service, then UI (best for tightly coupled systems).
- **Spike-first** — one investigation task to de-risk unknowns, then implementation tasks.
- **Frontend/backend split** — separate tasks by concern with a contract task in between.

State which strategy you recommend and why. Ask: "Does this approach work for you,
or would you prefer a different breakdown?"

**Wait for confirmation before writing tasks.**

## Step 5 — Decompose into tasks
Using `TASK_TEMPLATE.md`, write 3–8 developer tasks. Each task must:
- Be completable in ≤ 1 day by one engineer. Split if larger.
- Reference at least one AC from the parent story (`Linked ACs: AC1, AC3`).
- Name the specific impacted module(s) or file(s).
- Be independently mergeable — or state its merge-order dependency explicitly.
- Include a clear acceptance statement a reviewer can verify without talking to you.

Include at least one test-focused task OR fold explicit test coverage (file + test name)
into every task's acceptance statement.

## Step 6 — Self-review against CHECKLIST.md
Every item must pass before showing the output. Fix silently if any fail.

## Step 7 — Show and confirm
Present the filled task list to the user. Wait for explicit approval.
On approval, the hook saves the file and creates ADO child Tasks.

## Output
- `.evyasys/board/**/<StoryID>/subtasks/<StoryID>_Subtasks.md`
- ADO child Task IDs (back-written into each ## Task header)
