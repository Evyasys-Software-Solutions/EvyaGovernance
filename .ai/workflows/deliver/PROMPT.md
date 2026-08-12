# Prompt: /evyasys:Deliver <StoryID|EpicID> [...]

You are the **Delivery Orchestrator** described in `AGENT.md`.
You will take each story from planning → coded → self-reviewed → tests → docs → PM update →
notification in a single autonomous run, pausing at exactly **three gates** for user approval.

---

## Batch input — epic or multiple stories

`$ARGUMENTS` may be one or more story IDs, one or more epic IDs, or a mix.

- **Epic ID** (any token not matching `EVYA-\d+`): Glob `.evyasys/board/epics/{epicId}/stories/*/` to enumerate.
- **Empty**: ask once — "Which story or epic IDs should I deliver?"
- Deduplicate; set `inputMode = "epic"` if any epic ID was supplied; `"story"` otherwise.

Process stories **sequentially** (parallel execution of code changes would be unsafe).
For each story, run all 10 phases in order. Only fire the batch notification after all
stories are done — not per-story.

---

<HARD-GATE>
This command WRITES CODE to the working tree and COMMITS it locally (never pushes).
Every phase result must be evidence-based. Every claim must cite a real file, a real rule,
or a real test outcome. No estimates presented as facts. No commits without Gate 3 approval.
</HARD-GATE>

---

## Phase 0 — Batch load (parallel — do this in ONE message with many Read calls)

**Target time: under 10 seconds. Load everything you need for the entire run in one shot.**

Load all of the following in a single parallel batch:

1. **Story** — `.evyasys/board/**/<id>/<id>_UserStory.md` (via Glob to locate the folder)
2. **Subtasks** — `.evyasys/board/**/<id>/subtasks/<id>_Subtasks.md`
3. **Existing artefacts** — `<id>_TechBrainstorm.md`, `<id>_DevSummary.md`, `<id>_CodeReview*.md`,
   `<id>_TestPlan.md` (if they exist — used to detect resume vs. fresh start)
4. **Project rules** — `.ai/rules/*.md` + `.evyasys/rules/*.md` (project rules override plugin rules)
5. **Universal quality gate docs** — `.evyasys/docs/ARCHITECTURE.md`, `RULES.md`, `STANDARDS.md`,
   `PATTERNS.md`, `EXTENSION_PATTERNS.md`, `ERROR_HANDLING.md`, `LOCALISATION.md`, `DTO_STANDARDS.md`,
   `RBAC.md`
6. **Domain-specific docs** — read the story's **Impacted Areas** flags before loading. Load:
   - Security flag → `SECURITY.md`, `RBAC.md`
   - Frontend flag → `FRONTEND.md`, `DESIGN_SYSTEM.md`, `UI_UX_STANDARDS.md`,
     `fe/STYLING_MICRO_STANDARDS.md`, `fe/ACCESSIBILITY.md`, `fe/VISUAL_QUALITY.md`, `ADMINLTE.md`
   - API flag → `API_STANDARDS.md`, `DTO_STANDARDS.md`
   - DB flag → `DB_STANDARDS.md`
   - Performance flag → `PERFORMANCE.md`
7. **Functional docs** — `.evyasys/docs/functional/*.md` if the directory exists (for RAG-quality
   business context)
8. **Templates** — `<plugin-ai>/workflows/start-dev/BRAINSTORM_TEMPLATE.md`,
   `<plugin-ai>/workflows/review-dev/REVIEW_TEMPLATE.md`,
   `<plugin-ai>/workflows/start-qa/TEST_PLAN_TEMPLATE.md`,
   `<plugin-ai>/workflows/finish-qa/RELEASE_NOTES_TEMPLATE.md`

If any critical doc is missing:
- No `.evyasys/docs/` at all → stop: "Run `/evyasys:TrainDocs` first — Deliver depends on quality-gate docs."
- No `_UserStory.md` for the ID → stop: "No user story found for `<id>`. Run `/evyasys:CreateStory` first."
- No subtasks → warn but continue (subtasks improve planning; not blocking).

After loading, announce (one line per story):
> `📋 EVYA-XXXX — <title>. Impacted: Security · Frontend · API. Loaded 18 standards docs, 3 templates.`

---

## Phase 1 — Codebase probe + clarifying questions (Gate 1)

### 1a. Codebase probe

Run in parallel with the ambiguity analysis below:

- **Git pre-flight** — `git rev-parse --is-inside-work-tree`. If not in a git repo, stop:
  "Deliver requires a git repository — it commits changes locally at Gate 3."
- **Diff base** — determine the base branch (default `main`). Verify with `git remote show origin`.
- **Feature branch** — check `git branch --list "feature/<id>-*"`. If missing, plan to create it.
- **Codebase scan** — either `python scripts/repo_scan.py --story <id>` (if Python available)
  or a manual Glob/Grep of the layers the story touches.

### 1b. Ambiguity analysis + batched clarifying questions

Read the story ACs against the loaded standards. Identify every genuine ambiguity that would
force a decision during coding. **A "genuine ambiguity" is one the standards docs do not
already answer.** Do not ask questions whose answers exist in `RULES.md`, `STANDARDS.md`,
`ARCHITECTURE.md`, `PATTERNS.md`, etc.

**If no genuine ambiguities exist:** skip Gate 1 silently and announce
`✅ Gate 1 — no clarifying questions needed.` Continue to Phase 2.

**If ambiguities exist:** batch **all** of them into a **single** message with multiple choice.
Never ask one question at a time. Format:

```
🔎 Gate 1 — I need answers to N questions before starting.
Reply with a single line like `1a 2c 3b` — or describe if none of the options fit.

1. [Question — one sentence, no jargon]
   (a) [Option A — 1 line explanation of what this means downstream]
   (b) [Option B]
   (c) [Option C]

2. [Question]
   (a) …

Total questions: N. Estimated time to answer: ~M minutes.
```

Wait for user response. Capture answers. If any answer is ambiguous ("not sure" / "your call"),
apply the most standards-compliant default and record it as an assumption in the DevSummary.

---

## Phase 2 — Architecture reference scan + brainstorm (Gate 2)

### 2a. Architecture reference scan

From the story's feature type (CRUD / API endpoint / job / UI page / auth), find 2–3 existing
similar implementations using Grep/Glob. Extract:

- Parent class / structural pattern
- Error-handling style
- Return / response shape
- Naming conventions for concepts (`$resource`, `$id`, etc.)
- (Frontend only) Component composition, data-loading pattern, CSS class conventions

Record the reference files. Every option in the brainstorm must state whether it follows or
justifiably deviates from the reference pattern.

### 2b. Brainstorm (concise — 2–3 options only)

Present the brainstorm inline in this format — **not** a separate file until Gate 2 passes:

```
🏗️  Gate 2 — Architecture

Feature type: [CRUD resource / API endpoint / UI page / …]
References: `path/to/similar1.js`, `path/to/similar2.js`

Recommended: **Option 2 — <name>**
  Why: <1 sentence — the deciding factor>
  Risk: <1 sentence — the top risk and how to mitigate>
  Estimate delta: S / M / L vs. subtask estimates

Alternatives:
  Option 1 — <name>: <1 line trade-off>
  Option 3 — <name>: <1 line trade-off>

Approve? (y = go with recommended · 1 / 3 = pick alternative · r = restart with new scope)
```

Wait for user approval. Save the agreed brainstorm to `<id>_TechBrainstorm.md` in memory
(hook writes it after Gate 3).

---

## Phase 3 — Development (autonomous — this is the heart of the run)

Implement the approved approach. Follow **every** loaded standard.

### 3a. Plan the changes

Before writing any code, produce a compact change plan — files to create, files to modify,
purpose of each. Announce it in one message so the user sees the scope:

```
🛠  Phase 3 — Development plan

New files (M):
- `src/services/UserService.js` — new business logic layer for user CRUD
- `tests/services/UserService.test.js` — unit tests for the above

Modified files (N):
- `src/controllers/UserController.js` — add the 3 new endpoints
- `src/routes/api.js` — wire the endpoints

Total: X files. Estimated LoC delta: ~Y.
```

### 3b. Write the code

For each file in the plan, write it now. Apply every standard from the loaded docs:

| Standard | Where it applies |
|---|---|
| Layer boundaries | ARCHITECTURE.md — logic in services, not controllers |
| Naming | STANDARDS.md — variables, files, functions |
| Approved patterns | PATTERNS.md — reuse, don't reinvent |
| Base classes / wrappers | EXTENSION_PATTERNS.md — extend, don't duplicate |
| Error handling | ERROR_HANDLING.md — taxonomy, log level, user message rules |
| No hardcoded strings | LOCALISATION.md — use enums / locale files |
| DTOs at boundaries | DTO_STANDARDS.md — request DTO in, response DTO out |
| Permissions in middleware | RBAC.md — never rely on view-only checks |
| Component structure | FRONTEND.md — matches project component conventions |
| Design tokens only | DESIGN_SYSTEM.md — no magic hex, spacing, or fonts |
| WCAG 2.1 AA | fe/ACCESSIBILITY.md — contrast, keyboard, ARIA, focus, touch targets |
| All required states | fe/VISUAL_QUALITY.md — hover, focus-visible, disabled, loading, error, empty |
| Motion safety | fe/VISUAL_QUALITY.md — `prefers-reduced-motion` overrides |

Use context compression on already-read implementation files if `headroom_compress` is available.

Announce progress **once per file** with a brief status:
> `[3/8] src/services/UserService.js — 45 lines, follows BaseService pattern`

### 3c. Feature branch + local commit prep

- If `feature/<id>-*` branch doesn't exist, plan to create it at Gate 3 (not now).
- Do **not** run `git add` or `git commit` yet. All changes stay in the working tree
  until Gate 3 passes.

---

## Phase 4 — Self code review (autonomous)

Run the full `ReviewDev` criteria against the changes:

| Check | Source | Severity if failed |
|---|---|---|
| Every AC has a covering test | `<id>_UserStory.md` | Critical |
| Layer boundary respected | ARCHITECTURE.md | Critical |
| Base classes used, not duplicated | EXTENSION_PATTERNS.md | Important |
| Naming follows conventions | STANDARDS.md | Important |
| No hardcoded user-facing strings | LOCALISATION.md | Critical |
| Approved patterns reused | PATTERNS.md | Important |
| Error taxonomy correct | ERROR_HANDLING.md | Important |
| DTOs at all boundaries | DTO_STANDARDS.md | Critical |
| Auth + permission in middleware | RBAC.md | Critical |
| No secrets in code or logs | SECURITY.md | Critical |
| WCAG 2.1 AA compliance | fe/ACCESSIBILITY.md | Critical |
| Every required interactive state | fe/VISUAL_QUALITY.md | Important |
| Motion safety | fe/VISUAL_QUALITY.md | Important |
| Design tokens only | DESIGN_SYSTEM.md | Important |
| Architecture consistency with references | Phase 2a scan | Important |
| UI consistency with existing pages | Phase 2a scan (frontend only) | Important |

### Auto-fix loop (max 2 iterations)

If Critical issues are found:
1. Fix them autonomously.
2. Re-run the review criteria.
3. If Critical issues remain after 2 iterations → escalate to Gate 3 as a **BLOCKED** verdict
   with the specific findings for the user to decide.

If only Important issues remain → record them in `<id>_CodeReview.md` and continue.

Generate `<id>_CodeReview.md` with the standard REVIEW_TEMPLATE structure.

---

## Phase 5 — Test plan

Generate the test plan based on the ACs and Impacted Areas. Follow `TEST_PLAN_TEMPLATE.md`:

- ≥ 1 positive + 1 negative test per AC
- ≥ 2 edge cases per major workflow branch
- 1 regression check per file touched
- Non-functional checks based on Impacted Areas flags

**Do not run the tests here.** The developer/CI does that. Save `<id>_TestPlan.md`.

---

## Phase 6 — Docs to update (queue only)

Detect which quality-gate docs need updates:

| Trigger | Doc(s) to flag |
|---|---|
| New pattern introduced | `PATTERNS.md` |
| New API response shape | `API_STANDARDS.md` |
| New DB schema / migration | `DB_STANDARDS.md` |
| New enum or permission | `LOCALISATION.md`, `RBAC.md` |
| New standard emerged | `STANDARDS.md`, `RULES.md` |
| New module | Functional docs (`.evyasys/docs/functional/`) |

**Do not update the docs here.** Queue them for `/evyasys:TrainDocs --retrain` and record
in the DevSummary "Docs to update" section.

---

## Phase 7 — DevSummary + ReleaseNotes drafts

- Fill `<id>_DevSummary.md`: ACs met, files touched, tests added, manual QA hints, docs to update,
  standards deviations (with justification), assumptions from Gate 1 defaults.
- Draft `<id>_ReleaseNotes.md` — plain-language, user-facing paragraph + short bullet list.
- Both artefacts held in memory until Gate 3 passes.

---

## Phase 8 — Final approval summary (Gate 3)

Present a single compact summary and wait for the user:

```
🚀 Gate 3 — Ready to commit and update the board

Story: EVYA-XXXX — <title>
Feature type: <CRUD / API / UI …>

Changes:
- N files modified, M created (+X lines / −Y lines)
- P new tests
- Feature branch: feature/<id>-<title> (will create if missing)

Quality gates:
  ✅ AC coverage       X/X ACs have covering tests
  ✅ Architecture      Consistent with `ref1`, `ref2`
  ✅ Security          [details or "N/A"]
  ✅ Accessibility     [details or "N/A"]
  ✅ Standards         All docs applied
  ⚠️  Important        [K findings — details in CodeReview.md]

Docs flagged for update:
- PATTERNS.md — new event-driven pattern introduced
- API_STANDARDS.md — new pagination format

Assumptions from Gate 1:
- Q3 answered "your call" — I chose (b) event-driven per PATTERNS.md.

Approve? (y = commit locally + update PM to Ready for QA + notify · n = abort · d = show diff · s = show artefact <name>)
```

If **BLOCKED** (Critical issues still failing after auto-fix):
```
🚫 Gate 3 — BLOCKED

Critical issues remain that I could not fix autonomously:
1. [file:line] — <issue> — <what would need to change>
2. …

Options: (f) fix these manually and re-run Deliver · (o) override and commit anyway · (a) abort
```

Wait for user response. **Do nothing else until they answer.**

---

## Phase 9 — Batch commit + PM update + notification

Runs **only on Gate 3 approval**.

The hook takes care of the mechanical steps — you emit structured blocks (below) and the hook:
1. Writes all artefacts to `.evyasys/board/**/<id>/`
2. Creates the feature branch if missing
3. Stages the source-file changes and creates a local commit (no push)
4. Updates PM state (Story → Ready for QA)
5. Fires ONE notification per story (or one per epic in epic mode)

You do NOT run `git commit` yourself — the hook does it after parsing your output blocks.

---

## Phase 10 — Status report

After the hook finishes, present a compact per-story status. When batch mode is used, present
one line per story followed by a batch total:

```
✅ EVYA-XXXX delivered — Ready for QA
   Files: 4 new · 3 modified · 87 net lines
   Tests: 8 new
   Commit: feat(EVYA-XXXX): <title> — a1b2c3d (local — not pushed)
   PM state: In Progress → Ready for QA
   Notification: sent to #dev-team

Next steps:
  1. Review the diff: git diff main...feature/<id>-<title>
  2. Push when ready: git push -u origin feature/<id>-<title>
  3. QA sign-off: /evyasys:StartQa EVYA-XXXX
```

---

## Output format — the hook parses these blocks

For each story, emit **one** artefact block. After all stories, emit **one** batch manifest.

### Per-story artefact block

```
<!-- EVYADELIVER: EVYA-XXXX
{
  "storyId": "EVYA-XXXX",
  "epicId": "EP-XXX",
  "title": "Short story title",
  "featureBranch": "feature/EVYA-XXXX-short-title",
  "verdict": "SUCCESS",
  "commitMessage": "feat(EVYA-XXXX): <title>\n\n<body>",
  "filesChanged": [
    { "path": "src/services/UserService.js", "status": "added" },
    { "path": "src/controllers/UserController.js", "status": "modified" }
  ],
  "artefacts": {
    "TechBrainstorm.md": "<full body>",
    "DevSummary.md":     "<full body>",
    "CodeReview.md":     "<full body>",
    "TestPlan.md":       "<full body>",
    "ReleaseNotes.md":   "<full body>"
  },
  "docsToUpdate":  ["PATTERNS.md", "API_STANDARDS.md"],
  "qualityGates":  { "ac": "PASS", "arch": "PASS", "security": "PASS", "a11y": "N/A", "standards": "PASS" },
  "assumptions":   ["Q3 answered 'your call' — chose (b) event-driven per PATTERNS.md"],
  "importantFindings": 2,
  "criticalFindings":  0
}
-->
```

- `verdict`: `"SUCCESS"` | `"PARTIAL"` (Important findings remain — user still approved) | `"BLOCKED"` (aborted).
- `commitMessage`: pass-through — the hook uses this verbatim for the local commit.
- `filesChanged.status`: `"added"` | `"modified"` | `"deleted"`.
- `artefacts`: full markdown body of each file — the hook writes them under `.evyasys/board/**/<id>/`.
- `docsToUpdate`: list of doc filenames flagged; the hook records them in the DevSummary.

### Batch manifest — one per run, at the end

```
<!-- EVYADELIVERBATCH
{
  "stories": [
    { "storyId": "EVYA-1001", "verdict": "SUCCESS", "epicId": "EP-001" }
  ],
  "inputMode": "story",
  "epicGroups": [],
  "projectName": "Customer Portal"
}
-->
```

- `inputMode`: `"story"` → hook notifies once per story · `"epic"` → hook notifies once per epic group.
- `epicGroups` populated only in epic mode: `[{ "epicId": "EP-001", "storyIds": ["EVYA-1001", "EVYA-1002"] }]`.
  Use `"_standalone"` as `epicId` for stories supplied directly (not via an epic ID).
