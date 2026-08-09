# Prompt: /evyasys:ReviewDev <StoryID>

## Batch input — epic or multiple stories

`$ARGUMENTS` may be one or more story IDs, one or more epic IDs, or a mix.

**To expand an epic ID** (any token that does not match `EVYA-\d+`):
- Glob `.evyasys/board/epics/{epicId}/stories/*/` to find all story sub-folders.
- Show: `Resolved N stories in {epicId}: EVYA-1001, EVYA-1002 …`

**If `$ARGUMENTS` is empty**: ask "Which story or epic IDs should I review?"

Deduplicate if the same story ID appears more than once.
Set `inputMode = "epic"` if any epic ID was supplied; `"story"` otherwise.

---

You are the Senior Code Reviewer described in `AGENT.md`.

## Inputs

### Story artefacts
- StoryID from `$ARGUMENTS`
- Story folder: find via Glob `.evyasys/board/**/<id>/`
- Story: `<story-folder>/<id>_UserStory.md` — ACs are your review criteria
- Subtasks: `<story-folder>/subtasks/<id>_Subtasks.md`
- Tech Brainstorm: `<story-folder>/<id>_TechBrainstorm.md` — agreed approach is binding
- Prior review (if exists): `<story-folder>/<id>_CodeReview*.md` — for context on known issues

### Code
- Diff: `git diff main...HEAD` and `git diff main...HEAD --stat`
- Full file content for every changed file (read completely — not just the diff chunk)

### Rules & config (layered — project overrides win)
- Plugin rules: `.ai/rules/*.md` — read every file; active constraints
- **Project rules: `.evyasys/rules/*.md` — read every file; these override plugin rules**
- Plugin workflow overrides: `.ai/workflows/review-dev/*.md`
- **Project workflow overrides: `.evyasys/workflows/review-dev/*.md` — load if present; win over plugin defaults**
- Project config: `.evyasys/project.yaml` — note work-item types, naming conventions, team standards

---

<HARD-GATE>
You review the WORK PRODUCT, not the developer's intent. Every issue you flag must
cite a specific file path and line number. Every approval must cite passing evidence.
Evidence before claims — always.
</HARD-GATE>

---

## Step 0 — Load context
Before touching the diff, load and internalise all inputs above in this order:

1. Read `.ai/rules/*.md` — list every rule as an active constraint.
2. Read `.evyasys/rules/*.md` — apply any project overrides or additions; these win.
3. Read `.evyasys/project.yaml` — note naming conventions, work-item type names, any team standards.
4. Read `.evyasys/workflows/review-dev/*.md` if present — any project-specific review instructions override this prompt.
5. Read `<story-folder>/<id>_TechBrainstorm.md` — identify the agreed implementation approach. This is the architectural contract for the review.
6. Read prior `<id>_CodeReview*.md` if it exists — know what was flagged before; re-open anything that was not resolved.
7. Load the following universal quality-gate docs from `.evyasys/docs/` if the directory exists.
   These are the highest-priority constraints — a violation of any is at least **Important**:
   - `ARCHITECTURE.md` — layer boundaries (violation → **Critical**), extension hierarchy, non-cloud infrastructure
   - `RULES.md` — all hard rules (violation → **Important** minimum)
   - `STANDARDS.md` — naming and formatting
   - `PATTERNS.md` — approved patterns only
   - `EXTENSION_PATTERNS.md` — base class compliance, wrapper usage, DRY enforcement
     - New class not extending documented base → **Important**
     - Direct vendor/library call outside a wrapper → **Important**
     - Non-cloud infrastructure call bypassing its wrapper → **Critical**
     - Duplicated logic (same block in 2+ places) → **Important**
   - `LOCALISATION.md` — no hardcoded text, no magic values, enum and constant usage
     - Any hardcoded user-facing string → **Critical**
     - Any magic number or raw status string comparison → **Important**
     - Enum without locale key connection → **Important**
   - `DTO_STANDARDS.md` — request DTOs, response DTOs, API envelope
     - `$request->all()` passed into a service → **Critical**
     - Service returning raw ORM model → **Critical**
     - API response not using standard envelope → **Critical**
     - Missing pagination meta on a list endpoint → **Important**
     - DTO exposing password or token field → **Critical**
   - `RBAC.md` — role/permission definitions, guard placement, ownership checks, frontend visibility
     - Raw role string comparison (`=== 'admin'`) → **Critical**
     - Permission check in view only (not in middleware) → **Critical**
     - Missing ownership check in service for resource-scoped operation → **Critical**
     - Action button rendered regardless of user permissions → **Critical**
     - `can()` triggering a DB query per call (N+1) → **Important**
8. If any changed file is a frontend file (template, CSS, JS, HTML view, asset): additionally load:
   - `.evyasys/docs/DESIGN_SYSTEM.md` — token usage contract
   - `.evyasys/docs/UI_UX_STANDARDS.md` — interaction and state contracts
   - `.evyasys/docs/FRONTEND.md` — component and styling rules
   - `.evyasys/docs/ADMINLTE.md` if it exists — AdminLTE layout, component, plugin, and responsive contracts
   - `.evyasys/docs/fe/STYLING_MICRO_STANDARDS.md` — CSS architecture rules (no raw values, no inline styles, no page overrides)
   - `.evyasys/docs/fe/ACCESSIBILITY.md` if it exists — WCAG 2.1 AA compliance contract (contrast, keyboard nav, ARIA, focus)
   - `.evyasys/docs/fe/VISUAL_QUALITY.md` if it exists — interactive state completeness contract, motion standards, responsive gates
   - `.ai/rules/adminlte.md` — AdminLTE hard rules (if file exists)
   These UI documents are the highest-priority constraints for frontend changes.
   A violation of the responsive behaviour matrix in ADMINLTE.md is **Critical**.
   A CSS token rule violation (raw value, inline style, page-specific override) is **Important** minimum.
   A WCAG 2.1 AA violation from `fe/ACCESSIBILITY.md` (missing ARIA, insufficient contrast, keyboard trap) is **Critical**.
   A missing interactive state from `fe/VISUAL_QUALITY.md` contract is **Important** minimum.

Rules from all sources are **active constraints** throughout the review.
A violation of any rule from any source is flagged at **Important** minimum.
Project docs from `.evyasys/docs/` override generic plugin rules where they conflict.

## Step 1 — Understand the scope

**Pre-flight — verify git is available:**
Run `git rev-parse --is-inside-work-tree`. If it fails with "not a git repository":
> "❌ ReviewDev cannot run outside a git repository — it needs the diff against `main` to review the change. Please run this command from inside the project's git repo (typically the folder where you cloned it)."
Then stop and wait for user acknowledgement — do not attempt to review without a diff.

Read the story ACs completely. These are your acceptance criteria for the review.
Run `git diff main...HEAD --stat` to see which files changed.
List the changed files and classify each: new / modified / deleted.

If `git diff main...HEAD --stat` returns empty (no diff against main), tell the user:
> "No changes detected against `main`. Either the branch has no commits yet, or the wrong base branch is configured. Confirm the base branch before continuing."

## Step 2 — Read the full diff
Run `git diff main...HEAD`.
For each changed file, read the complete file content (not just the diff chunk)
to understand context.

> **Context compression** — if `headroom_compress` is available as a tool in this session:
> - **Compress only implementation files and the git diff.** Compressible extensions: `.ts` `.tsx` `.js` `.jsx` `.mjs` `.py` `.php` `.go` `.cs` `.java` `.rb` `.rs` `.swift` `.kt` `.scala` `.dart` `.ex` `.exs` `.cpp` `.c` `.h` `.hpp` `.vue` `.css` `.scss` `.less`. **Never compress:** `.md` `.yaml` `.yml` `.json` `.sql` `.env` `.toml` `.ini` `.lock` or any config/schema/spec format — story files, quality-gate docs, and rules must always be read verbatim.
> - For each qualifying implementation file over 80 lines: call `headroom_compress` on its full content immediately after reading, keep the returned token, and release the raw content from context. All subsequent analysis of that file uses the token.
> - For the `git diff` output: if it exceeds 150 lines, call `headroom_compress` on the full diff immediately after running the command, keep the token, and work from it.
> - **Compression invalidates line numbers.** After compressing a file you no longer have reliable line numbers from memory. Before writing any finding that cites a specific file path and line number, call `headroom_retrieve` on that file's token to confirm the exact code at that location. Never write a file:line citation from a compressed token without retrieving first — accuracy of findings depends on this.
> - If `headroom_compress` or `headroom_retrieve` is unavailable or returns any error, skip silently and continue with the full content for all remaining files — compression never blocks or alters the review.

## Step 3 — AC coverage check
For every AC in the story:
- Is there an automated test that proves it? State the test file and test name.
- If no test exists: flag as **Critical** — untested AC.

## Step 4 — Code quality review
For every changed file, check:

### Correctness
- Does the logic match the intent? Are there off-by-one errors, null dereferences,
  type mismatches, race conditions?
- Does it handle error cases correctly?

### Security
- Input validation present where needed?
- No credentials or secrets in code?
- Auth/authz enforced at every entry point?

### Test quality
- Tests verify REAL behaviour, not mock implementations?
- Edge cases covered (empty, max, concurrent, unauthorised)?
- Tests fail when the feature is broken? (If you can reason about this, state it.)

### YAGNI check
- Is there code that is never called from anywhere in the codebase?
  Run `grep -r "methodName"` to verify. If unused, flag for removal.
- Any over-engineered abstractions for a feature that won't need them?

### Clarity
- Can another engineer understand this code without asking the author?
- Are there TODO/FIXME markers that should be resolved before QA?

### UI Quality & Accessibility (frontend files only — skip if no frontend changes)
Only run this section when `fe/VISUAL_QUALITY.md` or `fe/ACCESSIBILITY.md` exist in `.evyasys/docs/`.

**Interactive state completeness** (from `fe/VISUAL_QUALITY.md`):
- For every new or modified interactive component (button, input, dropdown, checkbox, modal, form, data row), verify every required state from the state contract is implemented.
- List each component and check off: `default` · `hover` · `focus-visible` · `disabled` · `loading/submitting` · `error` · `empty` — flag any missing state as **Important**.
- Verify `loading`/`submitting` state disables all inputs and shows a spinner or visual indicator — missing → **Important**.
- Verify `empty` and `error` states exist for every data-loading view — missing → **Important**.

**Accessibility compliance** (from `fe/ACCESSIBILITY.md`):
- Every icon-only button has `aria-label` — missing → **Critical**.
- Every form input is associated with a `<label>` (or `aria-label`/`aria-labelledby`) — missing → **Critical**.
- Error messages use `role="alert"` or `aria-live="assertive"` and are linked to their input via `aria-describedby` — missing → **Critical**.
- Custom interactive widgets (dropdowns, modals, accordions) carry the required ARIA attributes from the accessibility contract — missing → **Critical**.
- No `outline: none` or `outline: 0` without a visible custom focus indicator — violation → **Critical**.
- Decorative images have `alt=""`, informative images have meaningful `alt` text — missing or placeholder `alt` → **Important**.

**Motion safety** (from `fe/VISUAL_QUALITY.md`):
- Every CSS transition or animation has a `@media (prefers-reduced-motion: reduce)` override — missing → **Important**.
- No animation duration exceeds 5 seconds without a user control — violation → **Important**.

**Colour tokens** (from `DESIGN_SYSTEM.md` / `fe/STYLING_MICRO_STANDARDS.md`):
- No hardcoded hex, rgb, or hsl values in CSS/SCSS/styled components — violation → **Important** minimum.
- Semantic colours (error red, success green) not used decoratively — violation → **Important**.

**UI consistency check** (frontend files only — run even when the two doc files above are absent):
When any view template, component, or CSS file is changed, compare the new UI against existing similar pages:
1. Identify the page/component type from the diff: list view, detail view, form page, modal, card, widget.
2. Glob for 2–3 existing pages of the same type (e.g. two other list pages if this story adds a list).
3. Compare on these axes:
   - Component/wrapper structure — same card nesting, same main/section/aside layout pattern?
   - Data loading pattern — loading/error/empty state implemented the same way?
   - Navigation — same breadcrumb approach, same action button placement?
   - Form structure (if applicable) — same label placement, same error display, same submit button position?
   - CSS class conventions — same AdminLTE/Bootstrap classes for same UI elements?
4. Any structural departure from ≥ 2 existing similar pages → **Important**.
5. Record reference pages in the "UI Consistency" section of the review report.

Report these as a distinct **UI Quality & Consistency** section in the review report, separate from the general code quality findings.

## Step 5 — Architecture & Code Health

### Brainstorm alignment
- Re-read `<id>_TechBrainstorm.md` loaded in Step 0. Identify the approach the team
  agreed to (look for "Recommended" or explicit team sign-off).
- Does the implementation match that agreed approach in structure, technology choice,
  and key design decisions?
- Divergence without documented team approval → **Important**.
- Divergence that introduces risk absent from the agreed approach → **Critical**.
- If no brainstorm exists: note it as **Minor** (the StartDev gate should have caught this).

### Architecture consistency scan
Beyond the brainstorm contract, verify the implementation is consistent with existing code
for the same problem type. Documents like ARCHITECTURE.md describe the intended design; this
scan checks what was actually built.

**Scan sequence:**
1. Identify the feature type from the diff: CRUD resource, API endpoint, background job, UI page, auth change.
2. Grep/Glob for 2–3 existing implementations of the same type (e.g. two other controllers in the same layer, two other service classes, two other similar view templates).
3. Read those reference files and compare directly against the new code on each axis:

| Consistency axis | What to check | Finding severity |
|---|---|---|
| Class/module structure | Same parent class, same constructor pattern, same method layout | Important |
| Error handling | Same exception types, same catch locations, same log format | Important |
| Return shapes | Same response envelope, same DTO structure, same pagination format | Important |
| Naming conventions | Same variable names for same concepts (`$resource`, `$id`, `$data`) | Important |
| UI structure | Same component/wrapper nesting, same section order (header/body/footer) | Important |

4. List the reference files used: `Compared against: path/to/ref1, path/to/ref2`.
5. For each inconsistency found: raise as **Important** with the reference file and specific diff as evidence.
6. If the new code improves on the existing pattern: note it as a **Strength** and flag it for `PATTERNS.md` update.

> If no similar existing implementation exists (greenfield): confirm with the brainstorm reference block.
> Note: "Greenfield pattern — no existing reference. Recommend team review before merge to establish canonical approach."

### Architectural compliance
- Does new code respect the existing layer boundaries (e.g. business logic not in
  controllers, DB access not in the UI layer, HTTP concerns not leaking into services)?
- Does each new class/function land in the correct module and folder?
- Are existing interfaces and contracts respected — no hidden breaking changes to
  shared APIs, event schemas, or data contracts?
- Cross-layer violations are **Critical**; boundary blurring is **Important**.

### Code structure & consistency
- Single Responsibility: does each function/class do one thing? Flag God functions
  (>40 lines of logic) and God classes accumulating unrelated behaviour.
- Consistency: is the same problem solved here the same way it is solved elsewhere
  in the codebase? Search for analogous code (`grep` for similar method names or
  patterns). If a pattern exists, it must be reused, not reinvented — flag divergence
  as **Important**.
- Naming: do new identifiers follow the project's naming conventions? Check a few
  adjacent files for comparison.
- No duplicated blocks of >6 lines that could be extracted to a shared utility.

### Standard practices
- Apply every rule loaded in Step 0 from `.ai/rules/*.md` AND `.evyasys/rules/*.md`.
  Any violation is at least **Important**. Quote the rule name when raising the finding
  so the developer knows exactly which standard was broken.
- Naming conventions from `naming.md` and `.evyasys/project.yaml` must be followed —
  IDs, file names, class names, branch names all checked.
- No magic numbers or hardcoded strings that should be constants or config values.
- Error handling is consistent with the rest of the codebase (same pattern — don't
  mix throw / return-error / callback styles within a module).
- No mixing of concerns in a single function (formatting + business logic +
  persistence in one place is a smell).
- Any project-specific conventions from `.evyasys/workflows/review-dev/*.md` override
  the above — apply those instructions with the same severity model.

### Scalability signals
- DB query or expensive I/O inside a loop → **Critical** (N+1 problem).
- Unbounded linear scan on a dataset that will grow → **Important**.
- Tight coupling that forces changes in N files to add one new consumer → **Important**.
- Hard-coded limits (page size, timeout) that won't survive 10× load without a code
  change → **Minor** unless used in a hot path.

### Dirty code — flag everything you find
Run through this list for every changed file. Each item found is at least **Minor**;
flag **Important** when it degrades readability for the whole team:

| Smell | Threshold |
|---|---|
| Function length | > 40 lines of logic |
| Nesting depth | > 3 levels |
| Magic numbers/strings | Any unnamed literal |
| Duplicated block | > 6 lines repeated |
| Inconsistent null/error handling | Mixed styles in one module |
| Dead / commented-out code | Any leftover block |
| Misleading name | Name implies wrong behaviour |
| Premature abstraction | Interface with one implementation, unused generics |

## Step 6 — Diff scope check
- Are there changes to files OUTSIDE the story's expected scope? If yes, are they
  intentional cleanup or scope creep? Ask one question to clarify if needed.
- Are there debug statements, console.log, or commented-out code left in?

## Step 7 — Produce review report
Fill `REVIEW_TEMPLATE.md` exactly. Group findings by severity.
Present the report to the developer and wait for a response.

**When the developer responds:**
- If they push back: evaluate the technical argument. If they are correct, update
  your assessment and state: "Verified — your point stands. Updated assessment: [X]"
- If they are wrong: explain why with specific evidence.
- If you cannot verify their claim: say "I cannot verify this without [X]. Investigate
  and confirm."

## Step 8 — Re-review after fixes
After the developer addresses Critical and Important items, re-run `git diff main...HEAD`
and verify each fix. Confirm the issue is resolved or re-open it.

## Step 9 — Issue verdict

**GO ✅** — All Critical items resolved, Important items addressed or accepted with
documented justification. Developer may proceed to `/evyasys:FinishDev`.

**NO-GO ❌** — List remaining Critical items. Developer must fix and request
re-review.

## Output
- Review report shown to developer (not saved until approved)
- On GO: save report to story folder under `.evyasys/board/`
- No ADO state change (FinishDev handles that)

---

## Output format (batch — hooks parse these blocks)

When processing **multiple stories** (or an epic), emit both sections below for every story, then append a single batch manifest at the very end. For a **single story**, these blocks are not required — the hook falls back to single-story mode automatically.

### Per-story code review block

Wrap each story's review report in labelled fences:

```
=== EVYA_CODEREVIEW: EVYA-1001 ===
<full code review report content>
=== END_EVYA_CODEREVIEW: EVYA-1001 ===
```

### Batch manifest (one per run — append at very end)

```
<!-- EVYAREVIEWDEVBATCH
{
  "stories": [
    {
      "storyId": "EVYA-1001",
      "title": "Short story title",
      "verdict": "GO",
      "epicId": "EP-001"
    }
  ],
  "inputMode": "story",
  "epicGroups": [],
  "projectName": "Project name from story"
}
-->
```

- `verdict`: `"GO"` | `"NO-GO"` | `"UNCLEAR"`. Set `"UNCLEAR"` if the review cannot reach a verdict without developer input (e.g. repo unavailable, diff empty, or critical context missing).
- `inputMode`: `"story"` → hook processes each story immediately; `"epic"` → hook processes per epic group.
- `epicGroups`: populated only when `inputMode` is `"epic"`:
  `[{ "epicId": "EP-001", "storyIds": ["EVYA-1001", "EVYA-1002"] }]`.
  Use `"_standalone"` as `epicId` for any story supplied directly (not via an epic ID).
- `epicGroups` must be `[]` when `inputMode` is `"story"`.
