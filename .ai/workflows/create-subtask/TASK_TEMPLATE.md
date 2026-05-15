# Subtasks for {{STORY_ID}}

---

## Task 1 — <Functional headline: outcome in plain language a product manager can read>

### Functional Summary
_One sentence describing what this task delivers to the user or system._

### Technical Analysis

**Files to modify:**

| File | Change |
|---|---|
| `src/services/ExampleService.ts` | Add `processX()` method |
| `src/controllers/ExampleController.ts` | Add `POST /api/example` route handler |

**New files (if any):**

| File | Purpose |
|---|---|
| `src/models/ExampleModel.ts` | New data model for X |

**Implementation details:**
- `ExampleService.processX(input: InputDto): ResultDto` — describe exact logic, branching, return shape
- DB: migration file name + SQL (`ALTER TABLE x ADD COLUMN y VARCHAR(50) NOT NULL DEFAULT ''`)
- API: `POST /api/v1/resource` → request body `{ field: string }` → `201 { id, status }`
- Events / side-effects: cache keys to invalidate, domain events to emit, webhooks to trigger

**Edge cases to handle:**
- What happens when `field` is null / empty / over the size limit?
- What happens when the record already exists (duplicate key)?
- Concurrent request handling — optimistic lock, idempotency key, or last-write-wins?

**Security & validation:**
- Validate inputs at: controller / middleware / service — specify the layer
- Auth guard required: role name or middleware name
- No secrets or sensitive values in logs or responses

**Performance:**
- Expected data volume and growth rate for this operation
- Index required? Which column(s)?
- Caching strategy if this is a read-heavy path

### Acceptance
_How a reviewer can verify this task is complete without speaking to the author._

### Test Coverage
- **File:** `tests/unit/services/ExampleService.test.ts`
- `should return ResultDto when input is valid` — assert `{ id, status: 'pending' }`
- `should throw ValidationError when field is empty`
- `should handle duplicate correctly` — assert `409` or idempotent response

### Metadata
- **Type:** Backend / Frontend / Data / DevOps
- **Estimate:** S | M | L
- **Linked ACs:** AC1, AC3
- **Depends on:** Task n / None

---

## Task 2 — <Functional headline>

### Functional Summary

### Technical Analysis

**Files to modify:**

| File | Change |
|---|---|
| `` | |

**Implementation details:**

**Edge cases to handle:**

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

### Technical Analysis

**Files:**

| File | Purpose |
|---|---|
| `tests/e2e/<storyId>.spec.ts` | Playwright end-to-end automation |
| `tests/unit/<module>.test.ts` | Unit tests for service / logic layer |

**Implementation details:**
- Locator strategy: `data-testid` or ARIA role selectors only — no raw CSS classes
- Group Playwright tests in a `describe('<Story Title>')` block
- One `test()` per "Yes" row in the scenario table below

**Edge cases to handle:** (covered by the Negative and Edge rows in the table)

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
