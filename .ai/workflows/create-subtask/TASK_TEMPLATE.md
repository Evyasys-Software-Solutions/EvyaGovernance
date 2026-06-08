# Subtasks for {{STORY_ID}}

> **Rule: No code in tasks.**
> Tasks describe expected behaviour, contracts, and constraints — the developer writes the code
> during StartDev guided by project rules and their own judgement.
> Allowed: function signatures as behaviour references, business rules, technical flow descriptions,
> DB schema specs, API contracts.
> Never: code blocks of any language, SQL syntax, inline logic, pseudo-code.

---

## Task 1 — <Functional headline: outcome in plain language a product manager can read>

### Functional Summary
_One sentence describing what this task delivers to the user or system, in terms of user or business value._

### Business Rules & Workflow
_The rules and flow that constrain the implementation. Include every business rule, policy, and process step the developer must honour._

- Rule: [e.g. "A user may attempt login at most 5 times before the account is locked for 15 minutes"]
- Flow: [e.g. "Request arrives → validate input → check credentials → update attempt counter → return token or descriptive error"]
- Policy: [e.g. "Error responses must never reveal which field (email vs password) caused the failure"]

### Technical Guidance

**Files to modify:**

| File | Change |
|---|---|
| `src/services/ExampleService.ts` | Add `processX` method |
| `src/controllers/ExampleController.ts` | Wire `POST /api/example` route |

**New files (if any):**

| File | Purpose |
|---|---|
| `src/models/ExampleModel.ts` | New data model for X |

**Behaviour contracts:**
- `processX(input)` — receives an input object, validates it, persists the result, and returns the created record ID; throws a validation error on invalid input
- `POST /api/v1/resource` → request body `{ field }` → `201 { id, status }` | `400 { error }` | `409` on duplicate
- Events / side-effects: cache keys to invalidate, domain events to emit, webhooks to trigger

**DB schema changes (if any):**
- Migration filename: `<timestamp>_<description>`
- Table: `example_table` — add column `status` (varchar 50, not null, default `'pending'`)
- Index: add index on `(user_id, created_at)` to support the list query

**Edge cases:**
- What happens when `field` is null / empty / over the size limit?
- What happens when the record already exists (duplicate)?
- Concurrent request behaviour — idempotency expectation

**Security & validation:**
- Validate inputs at: controller / middleware / service — specify the layer
- Auth guard required: role or middleware name
- No secrets or sensitive values exposed in logs or API responses

**Performance:**
- Expected data volume and growth rate
- Index required? Which column(s)?
- Caching expectation if this is a read-heavy path

### Acceptance
_How a reviewer confirms this task is complete without asking the author._

### Test Coverage
- **File:** `tests/unit/services/ExampleService.test.ts`
- `processX succeeds with valid input` — expected: created record returned with correct status
- `processX rejects empty field` — expected: validation error, no record created
- `processX handles duplicate gracefully` — expected: conflict response, no duplicate in DB

### Metadata
- **Type:** Backend / Frontend / Data / DevOps
- **Estimate:** S | M | L
- **Linked ACs:** AC1, AC3
- **Depends on:** Task n / None

---

## Task 2 — <Functional headline>

### Functional Summary

### Business Rules & Workflow

### Technical Guidance

**Files to modify:**

| File | Change |
|---|---|
| `` | |

**Behaviour contracts:**

**DB schema changes (if any):**

**Edge cases:**

**Security & validation:**

**Performance:**

### Acceptance

### Test Coverage
- **File:**
-

### Metadata
- **Type:**
- **Estimate:**
- **Linked ACs:**
- **Depends on:**

---

## Task N — QA: Test Scenarios & Playwright Automation

### Functional Summary
Full test validation for {{STORY_ID}} — every AC proven across all scenario types. All UI-facing paths automated.

### Technical Guidance

**Files:**

| File | Purpose |
|---|---|
| `tests/e2e/<storyId>.spec.ts` | Playwright end-to-end automation |
| `tests/unit/<module>.test.ts` | Unit tests for service / logic layer |

**Testing approach:**
- Locator strategy: `data-testid` or ARIA role selectors only — no raw CSS class selectors
- Group E2E tests in a describe block named after the story title
- One test per "Yes" row in the scenario table below

**Edge cases:** (covered by Negative and Edge rows in the table)

**Security & validation:** (covered by Negative scenarios)

**Performance:** N/A for QA task

### Test Scenarios

| # | Scenario | Type | Expected Result | Playwright? |
|---|----------|------|-----------------|-------------|
| 1 | <primary happy path — valid data, all ACs satisfied> | Happy Path | <expected outcome> | Yes |
| 2 | <additional valid input / state that must succeed> | Positive | <expected outcome> | Yes |
| 3 | <invalid input or missing required field — must be rejected> | Negative | Error shown, no data saved | Yes |
| 4 | <boundary value / empty collection / max-length input> | Edge / Corner | <expected outcome> | No |
| 5 | <adjacent feature that must not break> | Regression | Existing behaviour unchanged | No |

> Add more rows as needed. At minimum one row per category above.

### Playwright Automation Notes
- Spec file: `tests/e2e/<storyId>.spec.ts`
- Describe block: `<Story Title>`
- One `test()` per "Yes" row above

### Acceptance
Every row in the scenario table above has a passing test. Playwright spec exists, all `Yes` rows automated, CI passes.

### Metadata
- **Type:** Test
- **Estimate:** M
- **Linked ACs:** (all ACs)
- **Depends on:** All implementation tasks
