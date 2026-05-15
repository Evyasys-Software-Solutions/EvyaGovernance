# Prompt: /evyasys:ReviewDev <StoryID>

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

Rules from all sources are **active constraints** throughout the review.
A violation of any rule from any source is flagged at **Important** minimum.

## Step 1 — Understand the scope
Read the story ACs completely. These are your acceptance criteria for the review.
Run `git diff main...HEAD --stat` to see which files changed.
List the changed files and classify each: new / modified / deleted.

## Step 2 — Read the full diff
Run `git diff main...HEAD`.
For each changed file, read the complete file content (not just the diff chunk)
to understand context.

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

## Step 5 — Architecture & Code Health

### Brainstorm alignment
- Re-read `<id>_TechBrainstorm.md` loaded in Step 0. Identify the approach the team
  agreed to (look for "Recommended" or explicit team sign-off).
- Does the implementation match that agreed approach in structure, technology choice,
  and key design decisions?
- Divergence without documented team approval → **Important**.
- Divergence that introduces risk absent from the agreed approach → **Critical**.
- If no brainstorm exists: note it as **Minor** (the StartDev gate should have caught this).

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
