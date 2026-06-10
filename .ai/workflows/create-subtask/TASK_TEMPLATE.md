# Subtasks for {{STORY_ID}}

> **Rule: No code in tasks. Maximum 5 tasks per story (up to 4 implementation + 1 QA).**
> Each task is a specification for `/evyasys:StartDev`. StartDev reads it, brainstorms
> implementation approaches, and writes the code. Your job: define scope, business rules,
> data flow, error behaviour, and technical constraints in enough detail that StartDev
> needs zero additional analysis.
> No code blocks, no SQL, no inline logic, no pseudo-code. No existing code reproduced.

---

## Task 1 — <Functional headline: outcome in plain language a product manager can read>

### What this task delivers
_One sentence on user or system value._

### Scope
**In this task:** [exactly what this task covers — be specific about the layers and capabilities included]
**Not in this task:** [what is explicitly deferred to the next task or a later story]

### ACs covered by this task

| AC | How this task addresses it |
|---|---|
| AC1: [full AC text] | [which behaviour contract or business rule in this task delivers it] |
| AC2: [full AC text] | [which behaviour contract or business rule delivers it] |

### Business Rules & Workflow
_Every rule, policy, and process step the system must enforce for this slice.
StartDev uses this section to ensure the implementation enforces the right behaviour._

- **Rule:** [e.g. "A user may attempt login at most 5 times before the account is locked for 15 minutes"]
- **Flow:** [e.g. "Request arrives → validate inputs → check credentials → record attempt → return token or locked error"]
- **Policy:** [e.g. "Error responses must never reveal which specific field — email or password — caused the failure"]
- **Constraint:** [e.g. "Account lock duration is configurable via LOCKOUT_MINUTES env var; default 15"]

### Data Flow
_End-to-end journey of data through this task's scope. StartDev uses this to understand the full path without re-reading the codebase._

1. **Input:** [what arrives — source, shape, who sends it]
2. **Validation:** [what is checked, at which layer, what gets rejected and why]
3. **Processing:** [what transforms — which service, what business logic applies]
4. **Persistence:** [what gets written — table, columns, conditions; or "read-only"]
5. **Output:** [what is returned — shape, status, side-effects (events, cache invalidation, emails)]

### Technical Guidance
_File-level specification for each change. StartDev uses this to locate the work and understand expected behaviour per file._

**Files:**

| File | What changes |
|---|---|
| `src/services/ExampleService.ts` | Add `processX` method |
| `src/controllers/ExampleController.ts` | Wire `POST /api/example` route and validation |

**New files (if any):**

| File | Purpose |
|---|---|
| `src/models/ExampleModel.ts` | Data model for X |

**Behaviour contracts:**
- `processX(input)` — accepts a validated input object, persists the result, returns the created record ID; rejects with a validation error if required fields are missing or malformed
- `POST /api/v1/resource` → body `{ field }` → `201 { id, status }` | `400 { error, field }` | `409 { error }` on duplicate | `401` if unauthenticated

**DB schema (if any):**
- Migration filename: `<timestamp>_<description>`
- Table `example_table` — add column `status` (varchar 50, not null, default `'pending'`)
- Add index on `(user_id, created_at)` — required for the paginated list query

**Security & validation:**
- Validate at: [controller / middleware / service — name the exact layer]
- Auth guard: [role name or middleware name]
- Fields that must be sanitised before persistence: [list them]
- Sensitive values that must never appear in logs or API responses: [list them]

**Performance:**
- Expected data volume and growth rate for this operation
- Index strategy: [which columns, why]
- Caching: [read path only — expectation for cache key, TTL, invalidation trigger]

### Error & recovery behaviour
_Every failure mode for this task's scope. StartDev uses this to ensure all error paths are handled._

| Failure | Expected system behaviour |
|---|---|
| Required field missing | Reject with 400; specify which field in the error body |
| Duplicate record | Reject with 409; do not create a partial record |
| DB write fails | Rollback any partial writes; return 500; log the error internally; do not expose DB details |
| Unauthenticated request | Reject with 401 before any business logic runs |
| Upstream service unavailable | [describe fallback or fail-fast behaviour] |

### Done when
_Observable evidence StartDev and QA use to confirm this task is complete._
- [ ] [e.g. "POST /api/v1/resource returns 201 with a valid ID for correct input"]
- [ ] [e.g. "Missing required field returns 400 with the field name in the error body"]
- [ ] [e.g. "Duplicate input returns 409 — no duplicate row in the DB"]
- [ ] [e.g. "Unauthenticated request returns 401 before reaching business logic"]

### Test coverage
- **File:** `tests/unit/services/ExampleService.test.ts`
- `processX succeeds with valid input` — expected: record created, correct ID returned
- `processX rejects missing field` — expected: validation error, nothing persisted
- `processX rejects duplicate` — expected: 409, no duplicate in DB
- `processX unauthorised` — expected: 401, no service method called

### Metadata
- **Type:** Backend / Frontend / Data / DevOps
- **Estimate:** S | M | L
- **Linked ACs:** AC1, AC2
- **Depends on:** None

---

## Task 2 — <Functional headline>

### What this task delivers

### Scope
**In this task:**
**Not in this task:**

### ACs covered by this task

| AC | How this task addresses it |
|---|---|
| AC3: | |

### Business Rules & Workflow

### Data Flow
1. **Input:**
2. **Validation:**
3. **Processing:**
4. **Persistence:**
5. **Output:**

### Technical Guidance

**Files:**

| File | What changes |
|---|---|
| `` | |

**Behaviour contracts:**

**DB schema (if any):**

**Security & validation:**

**Performance:**

### Error & recovery behaviour

| Failure | Expected system behaviour |
|---|---|
| | |

### Done when
- [ ]
- [ ]

### Test coverage
- **File:**
-

### Metadata
- **Type:**
- **Estimate:**
- **Linked ACs:**
- **Depends on:**

---

## Task N — QA: Test Scenarios & Playwright Automation

### What this task delivers
Full test validation for {{STORY_ID}} — every AC proven across all scenario types. All UI-facing paths automated.

### Scope
**In this task:** All test scenarios for {{STORY_ID}} — end-to-end, integration, and unit coverage.
**Not in this task:** Implementation fixes — any failure found here is a defect logged against the relevant implementation task.

### ACs covered by this task
All ACs — this task verifies every AC via the scenario table below.

### Test Scenarios

| # | Scenario | AC | Type | Expected Result | Playwright? |
|---|----------|----|------|-----------------|-------------|
| 1 | <primary happy path — all ACs satisfied with valid data> | AC1, AC2 | Happy Path | <expected outcome> | Yes |
| 2 | <additional valid input or state that must succeed> | AC1 | Positive | <expected outcome> | Yes |
| 3 | <invalid input or missing field — must be rejected> | AC2 | Negative | Error returned, nothing persisted | Yes |
| 4 | <boundary value — empty, max-length, concurrent> | AC1 | Edge / Corner | <expected outcome> | No |
| 5 | <adjacent feature that must not break> | — | Regression | Existing behaviour unchanged | No |

> Add rows as needed. Every AC must appear in at least one scenario row.

### Technical Guidance

**Files:**

| File | Purpose |
|---|---|
| `tests/e2e/<storyId>.spec.ts` | Playwright end-to-end automation |
| `tests/unit/<module>.test.ts` | Unit tests for service and logic layer |

**Testing approach:**
- Locator strategy: `data-testid` or ARIA role selectors only — no raw CSS class selectors
- E2E tests grouped under the story title as the describe block name
- One automated test per "Yes" row in the scenario table above

### Done when
- [ ] Every scenario row has a recorded outcome (pass / fail / blocked).
- [ ] All "Yes" rows automated in `tests/e2e/<storyId>.spec.ts`, CI passes.
- [ ] Every AC appears in at least one passing scenario.

### Metadata
- **Type:** Test
- **Estimate:** M
- **Linked ACs:** All ACs
- **Depends on:** All implementation tasks
