# Prompt: /evyasys:CreateSubtask

You are the Senior Developer described in `AGENT.md`.

## Arguments

Space-separated list of story IDs and/or epic IDs.

```
/evyasys:CreateSubtask EVYA-1001
/evyasys:CreateSubtask EVYA-1001 EVYA-1002 EVYA-1003
/evyasys:CreateSubtask EP-001
/evyasys:CreateSubtask EP-001 EVYA-1005
```

---

<HARD-GATE>
Two gates must clear before any subtask is written:
1. IDs confirmed by user at Step 0 — no file reads until then.
2. Consolidated plan approved by user at Gate 1 (Step 7) — no tasks until then.
The shared context (Steps 1–4) must be built in full before per-story planning begins.
</HARD-GATE>

---

## PHASE 1 — SHARED CONTEXT (execute once for the entire batch)

### Step 0 — Resolve inputs

<HARD-GATE>
IDs are mandatory. Do NOT read any file, run any scan, or begin any analysis
until the story/epic list is confirmed by the user at the end of this step.
</HARD-GATE>

#### 0a — Collect IDs (always fires first)

**If `$ARGUMENTS` is empty** — check whether `/evyasys:CreateStory` produced story IDs
earlier in this session. If yes, offer them:

> I can see stories from this session: **EVYA-1001, EVYA-1002, EVYA-1003**
>
> Shall I decompose these into subtasks, or would you like to specify different IDs?
>
> **(A) Use the stories above**  
> **(B) I'll specify the IDs**

If no session context is available (first command of the session, or no stories were
created yet), ask:

> **Which stories or epics should I break down into tasks?**
>
> Provide one or more of:
> - Story IDs — `EVYA-1042 EVYA-1043`
> - Epic IDs — `EP-001` (all stories in the epic)
> - Mix — `EP-001 EVYA-1005`

**Stop. Do not do anything else until the user responds.**

**If `$ARGUMENTS` is provided** — proceed directly to Step 0b. No confirmation needed; the user already specified what they want.

#### 0b — Parse and expand

Parse the confirmed token list. Classify each token:
- Matches `EVYA-\d+` → story ID (direct)
- Anything else → treat as epic ID; glob `.evyasys/board/epics/{id}/stories/*/` to expand

Deduplicate — if a story ID appears both explicitly and via epic expansion, count it once.

Show:
> Resolved **N** stories across **M** epic(s): EVYA-1001, EVYA-1002, …
> Reading story files…

If any ID cannot be resolved, warn inline and continue with the ones found.

---

### Step 1 — Load all story files

Read every `{storyId}_UserStory.md` in one batch (glob `.evyasys/board/**/{storyId}/{storyId}_UserStory.md` for each).

For each story extract and record:
- Title
- Epic ID
- All Acceptance Criteria (full enumerated list)
- Impacted Areas flags: Security / DB / Frontend / API / Performance

Build an internal story registry used throughout. Do **not** read any source-code file yet.

---

### Step 2 — Load shared knowledge base (once)

#### A — Quality-gate docs

Check whether `.evyasys/docs/` exists.

**If YES** — load the base docs shared by all stories (these apply universally — every task written must conform):
`ARCHITECTURE.md` · `RULES.md` · `STANDARDS.md` · `PATTERNS.md` · `ERROR_HANDLING.md` · `EXTENSION_PATTERNS.md` · `LOCALISATION.md` · `DTO_STANDARDS.md` · `RBAC.md`

Then load domain docs based on the **union** of all Impacted Areas flags across all stories:

| Flag in any story | Load from `.evyasys/docs/` |
|---|---|
| Security | `SECURITY.md`, `RBAC.md` |
| DB | `DB_STANDARDS.md` |
| Frontend | `FRONTEND.md`, `DESIGN_SYSTEM.md`, `UI_UX_STANDARDS.md`, `fe/STYLING_MICRO_STANDARDS.md`, `ADMINLTE.md` *(if file exists — AdminLTE projects only)* |
| API | `API_STANDARDS.md`, `DTO_STANDARDS.md` |
| Performance | `PERFORMANCE.md` |

**If NO docs directory** — note: "Quality-gate docs not found — will derive standards from codebase in Step 3."

#### B — Rules and templates

Load `.ai/rules/*.md`, project overrides `.evyasys/rules/*.md` (project wins on conflict), `TASK_TEMPLATE.md`, `QUESTIONING.md`.

---

### Step 3 — Unified code analysis (read each file exactly once)

1. Collect all Impacted Areas from every story in the registry
2. **Union and deduplicate** the file/module list — if EVYA-1001 and EVYA-1002 both touch `UserService.ts`, read it once
3. Run `python scripts/repo_scan.py --story <id>` for each unique module, or read the files directly if repo_scan is unavailable
4. If `.evyasys/docs/` was absent — derive and document key standards from the patterns observed in code (naming conventions, layering, error handling, test patterns)

Produce the **shared technical inventory**:

| Category | Content |
|---|---|
| Files in scope | Every file, annotated with which stories touch it |
| Shared files | Files touched by 2+ stories — flag each with story list |
| DB tables | All tables involved across all stories |
| API routes | All routes touched across all stories |
| Approved patterns | From docs or observed in code |
| Applied standards | Rules that constrain all tasks |

This inventory is the **only code read** that occurs. Phase 2 uses it — no further file reads.

> **Context compression** — if `headroom_compress` is available as a tool in this session:
> - **Compress only implementation files.** Compressible extensions: `.ts` `.tsx` `.js` `.jsx` `.mjs` `.py` `.php` `.go` `.cs` `.java` `.rb` `.rs` `.swift` `.kt` `.scala` `.dart` `.ex` `.exs` `.cpp` `.c` `.h` `.hpp` `.vue` `.css` `.scss` `.less`. **Never compress:** `.md` `.yaml` `.yml` `.json` `.sql` `.env` `.toml` `.ini` `.lock` or any config/schema/spec format — story files, quality-gate docs, and rules must always be read verbatim.
> - For each qualifying implementation file over 80 lines: call `headroom_compress` on its full content immediately after reading, keep the returned token, and release the raw content from context. Build the shared technical inventory from the compressed representations.
> - **Before writing any behaviour contract that references a specific function signature, method name, or field name:** call `headroom_retrieve` on that file's token to confirm the current API before writing the guidance. Compressed tokens do not preserve exact API detail in memory — retrieval is mandatory whenever accuracy of a contract matters.
> - If `headroom_compress` or `headroom_retrieve` is unavailable or returns any error, skip silently and continue with the full content for all remaining files — compression never blocks or alters the analysis.

---

### Step 4 — Cross-story dependency analysis

Using the shared inventory, identify and record:

1. **Shared files** — same file modified by multiple stories → flag for sequencing or ownership split
2. **Shared infrastructure tasks** — one DB migration / base service / config entry needed by multiple stories → created once (in the owning story), referenced in others
3. **Development sequence** — which stories must complete (or partially complete) before others can safely start
4. **Parallelisable stories** — stories with no shared files that can be developed simultaneously without merge conflicts
5. **Merge-conflict risk** — stories that will conflict at PR time if developed in parallel

Summarise findings — displayed at Gate 1 and used to generate cross-story notes in the EVYASUBTASKBATCH manifest.

---

## PHASE 2 — PLANNING

### Step 5 — Clarifying questions (if needed)

Using `QUESTIONING.md`, identify blocking ambiguities. Rules:
- Ask **batch-level questions first** (affect all stories) — one at a time, wait for answer
- Ask story-specific questions only if genuinely blocking for that story
- Use multiple-choice format wherever possible
- Skip if the shared technical context already answers the question

Do **not** proceed to Step 6 until all blocking questions are answered.

---

### Step 6 — Strategy selection

Recommend a strategy for each story. Default to **A** for the batch; vary per story only if the repo scan provides a specific reason.

| Strategy | Description | Best when |
|---|---|---|
| **A — Logical feature slices** *(recommended)* | Tasks grouped by business capability: data foundation → service behaviour → API contract → UI flow. Each task is a complete, independently verifiable unit — not a whole layer dump. | Most stories |
| **B — Vertical slices** | Each task delivers one complete AC end-to-end across all layers | ACs are truly independent with no shared data model or service |
| **C — Layer by layer** | All data → all service → all UI — each task is one whole layer | Only for large cross-cutting refactors where layer-boundary risk dominates the entire story |

---

### Step 7 — ⛔ GATE 1: Consolidated plan approval (always fires)

Present a single table covering all stories:

| Story | Title | ACs | Strategy | Est. Tasks | Key Areas | Cross-story note |
|---|---|---|---|---|---|---|
| EVYA-1001 | … | 5 | A | 5 | UserService, DB:users | shares DB migration with EVYA-1002 |
| EVYA-1002 | … | 4 | A | 4 | UserService, EmailService | shared DB migration owned by EVYA-1001 |

Below the table show:
- **Shared tasks identified:** N — [list titles]
- **Cross-story flags:** [list each]
- **Recommended sequence:** EVYA-1001 → EVYA-1002 (EVYA-1003 can run in parallel)

Ask:
> **Confirm this plan?** You can adjust the strategy per story or remove stories before drafting begins.

**Wait for explicit confirmation. Do not write a single task before receiving it.**

---

## PHASE 3 — DRAFT ALL SUBTASKS

### Step 8 — Write subtasks for every story (no new file reads — shared context only)

For each story, using the confirmed strategy, write **up to 4 implementation tasks** followed by **exactly one mandatory QA task** as the final item — **maximum 5 tasks total per story, no exceptions**.

#### 5-task limit — density-over-quantity consolidation

If the story's logical units would exceed 4 implementation tasks, consolidate before writing:
- DB schema + service behaviour → one task
- API contract + input validation → one task
- Two closely related UI flows → one task
- Security, performance, and error handling are **sub-sections inside** the relevant task, not separate tasks

If you still have 5+ implementation units after consolidation, merge the two most cohesive units into a single denser task. No AC or business rule is dropped — it is covered at higher density. A task that is denser is better than a task list that is longer.

#### Purpose of a subtask

Each task is a **specification document for `/evyasys:StartDev`**.
StartDev reads the task, runs a technical brainstorm (3+ approaches), gets team approval, then writes the code.
A task is the complete specification StartDev needs — business rules, expected behaviour, file scope, and observable done criteria.

#### Task division — logically complete units (enforced without exception)

**Each task must be one logically complete, independently verifiable unit of functionality.**

A good task covers a natural slice — it may span data + service, or API + validation, or UI + state management — whatever makes a *complete piece of business behaviour* that can be verified on its own.

✅ **Good division** (logical slices):
- "Set up the data foundation for user credentials" → covers DB schema + service layer behaviour for storing credentials
- "Expose the login endpoint" → covers API contract + validation + auth guard + error responses
- "Build the login form and handle the result" → covers UI flow + state + user-facing error messages

❌ **Bad division** (layer dumps — never do this):
- "All DB schema changes for this story" → this is not one logical unit, it's a technical layer
- "All service methods" → same problem — splits business logic from its context
- "All API controllers" → a controller without its business rules is a hollow shell

The test: can this task be picked up by a developer, worked on independently, and verified to work — without needing the adjacent task to also be done first? If yes, it's a good unit.

#### No-code rule (enforced without exception)

Tasks describe **expected behaviour, contracts, and constraints** — not implementation.
The developer writes the code during StartDev, guided by project rules and their own judgement.

✅ **Allowed:**
- Function signatures as behaviour references: "`login(email, password)` — validates credentials, returns an auth token, throws on invalid input"
- Business rules: "lock account after 5 failed attempts using the LockoutPolicy; never reveal which field failed"
- Technical flow: "controller validates input → service checks credentials → DB records attempt → response returned"
- DB schema specification: "add column `failed_attempts` (integer, not null, default 0) to `users` table; migration filename `<timestamp>_add_failed_attempts`"
- API contracts: "POST /api/v1/auth/login → 200 { token, expiresAt } | 401 { error } | 423 when locked"
- Expected test results: "`login succeeds with valid credentials` — expected: token in response"

❌ **Never allowed:**
- Code blocks of any language — no ` ``` `TypeScript` ``` `, ` ``` `SQL` ``` `, ` ``` `JavaScript` ``` `, or any other language fence
- SQL DDL/DML: `ALTER TABLE`, `CREATE TABLE`, `INSERT INTO`, `SELECT`, etc.
- Inline implementation logic: `if (attempts >= 5) { throw new LockoutException(); }`
- Pseudo-code that mimics implementation
- Framework-specific decorators or annotations written as implementation hints
- **Quoting or reproducing existing code from the codebase** — existing code is read during Step 3 for analysis only; it must never appear in task bodies. Translate what you read into behaviour contracts and guidance, not code excerpts.

#### Functional headline rule (enforced without exception)

Headlines are outcome-focused and readable by a product manager. Technical names belong in Technical Guidance.

✅ Correct: "Store user credentials with secure hashing"
❌ Wrong: "Implement UserService.hashPassword()" — move to Technical Guidance

#### Technical Guidance quality bar

Every implementation task **must** include all that apply. Write guidance, not code.

| Required element | Example of sufficient guidance |
|---|---|
| **AC Coverage Map** | Table: each AC this task addresses → which behaviour contract or rule delivers it |
| **Data Flow** | 5 steps: Input (source + shape) → Validation (layer + rejections) → Processing (service + logic) → Persistence (table/columns/conditions) → Output (response shape + side-effects) |
| **Error & Recovery** | Table: each failure mode → expected system behaviour (status code, rollback, log, fallback) |
| Exact file paths | `src/services/UserService.ts` — not "the service layer" |
| Behaviour contract | "`login(email, password)` — authenticates a user, returns a token, locks account after 5 failures" |
| DB schema change | Table `users`, add column `failed_attempts` (integer, not null, default 0), migration `<timestamp>_add_failed_attempts` |
| API contract | `POST /api/v1/auth/login` → `200 { token, expiresAt }` \| `401` \| `423` |
| Business rules | "after 5 consecutive failures, apply LockoutPolicy — never reveal which specific field failed" |
| Edge cases | "empty password → reject before hitting the DB; over-limit input → truncation or rejection?" |
| Security/validation | Layer (controller/guard/middleware) + specific rule name |
| Performance | Volume estimate + indexing or caching expectation |

Shallow descriptions like "update the service to handle this" will be rejected at self-review.
A task missing the AC Coverage Map, Data Flow, or Error & Recovery table will be rejected at self-review.

If you cannot fill in the Technical Guidance from the shared context, you have not read enough in Step 3 — do not proceed; go back and read the missing file.

#### Shared task handling

When a task logically serves multiple stories (e.g., one DB migration for EVYA-1001 and EVYA-1002):
- Write it **in full** in the story that owns it (first in sequence)
- In the other story's file, add a reference task: "**Shared task — [title]** — implemented under EVYA-1001 Task N. No separate implementation required; verify the migration is applied before starting this story."

#### QA task (mandatory final task — every story)

The last task is always:

**## QA Task — Test Scenarios & Playwright Automation**

Include:

| Category | Min. rows |
|---|---|
| Happy Path | 1 — primary flow, all ACs satisfied |
| Positive | 1 — additional valid inputs |
| Negative | 1 — invalid input, wrong state, must fail gracefully |
| Edge / Corner | 1 — boundary values, empty set, max length, concurrent |
| Regression | 1 per shared file — verify adjacent functionality from other stories is unaffected |

For every UI-facing AC: Playwright spec path `tests/e2e/{storyId}.spec.ts`, using `data-testid` or ARIA locators only (no raw CSS class selectors).

---

### Step 9 — Cross-story consistency check

Before emitting any output, verify silently:
- [ ] Every AC in every story has at least one task linked to it
- [ ] Shared tasks appear in full in exactly one story; only reference entries in others
- [ ] No two stories use contradictory behaviour contracts for the same shared file
- [ ] QA tasks for stories sharing code each include regression rows covering the shared areas
- [ ] Technical Guidance in every task cites specific file paths and behaviour contracts (no hand-waving)
- [ ] No task contains code blocks, SQL syntax, or inline implementation logic (no-code rule)
- [ ] All tasks comply with docs loaded in Step 2 (architecture layer, approved patterns, hard rules)

Fix silently. Do not flag failures as output — resolve them.

---

## OUTPUT FORMAT

Emit blocks in this exact order. No prose between blocks.

### 1 — Subtask content blocks (one per story)

```
=== EVYA_SUBTASKS: {storyId} ===
{complete subtask markdown in TASK_TEMPLATE.md format}
=== END_EVYA_SUBTASKS: {storyId} ===
```

### 2 — Playwright spec blocks (one per story)

```
<!-- EVYASPEC:{storyId}
[
  { "id": "TC-001", "ac": "AC1: short title", "title": "test case title", "type": "happy-path" },
  { "id": "TC-002", "ac": "AC1: short title", "title": "...", "type": "negative" }
]
-->
```

`type` values: `happy-path` | `positive` | `negative` | `edge` | `regression`
One entry per row in the QA test scenarios table. Emit `[]` if no Playwright tests apply.

### 3 — Batch manifest (once, after all story blocks)

```
<!-- EVYASUBTASKBATCH
{
  "projectName": "",
  "inputMode": "story",
  "epicGroups": [],
  "stories": [
    {
      "storyId": "EVYA-1001",
      "title": "Login with email and password",
      "epicId": "EP-001",
      "strategy": "A",
      "taskCount": 5,
      "acCount": 5,
      "keyAreas": ["UserService.ts", "AuthController.ts", "DB:users"],
      "sharedTaskRefs": ["EVYA-1001-T1"]
    }
  ],
  "sharedTasks": [
    {
      "ref": "EVYA-1001-T1",
      "title": "Database migration — user authentication schema",
      "ownedBy": "EVYA-1001",
      "linkedStories": ["EVYA-1001", "EVYA-1002"]
    }
  ],
  "crossStoryFlags": [
    "EVYA-1001 and EVYA-1002 both modify UserService.ts — complete EVYA-1001 first"
  ]
}
-->
```

**`inputMode`** — controls when PM sync and notifications fire:
- `"story"` — user provided individual story IDs (e.g. `EVYA-1001 EVYA-1002`). The hook will save → PM sync → notify immediately after **each story**.
- `"epic"` — user provided one or more epic IDs (e.g. `EP-001 EP-002`). The hook will save all stories in an epic to local first, then PM sync all, then notify **once per epic**. A mixed input (`EP-001 EVYA-1005`) uses `"epic"` mode; the standalone story ID is placed in its own single-story epicGroup.

**`epicGroups`** — required when `inputMode` is `"epic"`; empty array `[]` when `inputMode` is `"story"`.

```json
"epicGroups": [
  { "epicId": "EP-001", "storyIds": ["EVYA-1001", "EVYA-1002"] },
  { "epicId": "EP-002", "storyIds": ["EVYA-1003"] },
  { "epicId": "_standalone", "storyIds": ["EVYA-1005"] }
]
```

Use `"_standalone"` as the epicId for individual story IDs supplied alongside epic IDs in a mixed invocation.

`keyAreas`: 2–4 items maximum — file names, service names, or `DB:{table}`. No full paths — short identifiers only.
`sharedTasks`: empty array `[]` if none.
`crossStoryFlags`: empty array `[]` if none.
