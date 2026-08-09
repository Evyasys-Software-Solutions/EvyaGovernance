# Code Review — <EVYA-id>

**Reviewer role:** Senior Code Reviewer (independent)
**Branch:** `feature/<id>-<title>`
**Base:** `main`
**Files changed:** N added / M modified / K deleted

---

## AC Coverage

| AC | Test file :: test name | Status |
|---|---|---|
| AC1 — <text> | `<file> :: <test>` | ✅ Covered / ❌ Missing |
| AC2 — <text> | `<file> :: <test>` | ✅ Covered / ❌ Missing |

---

## Architecture & Code Health

### Brainstorm Alignment

**Agreed approach** (from `<id>_TechBrainstorm.md`): _paste the chosen approach title here_

| Check | Status | Evidence |
|---|---|---|
| Implementation matches agreed approach | ✅ / ⚠️ / ❌ | |
| Technology choices consistent with brainstorm decision | ✅ / ⚠️ / ❌ | |
| No undocumented deviation from agreed design | ✅ / ⚠️ / ❌ | |

### Architecture Consistency Scan

**Feature type:** _CRUD resource / API endpoint / Background job / UI page / Auth change_
**Reference files used:**
- `<path/to/existing/similar/implementation1>`
- `<path/to/existing/similar/implementation2>`

| Consistency axis | Reference | Status | Inconsistency found |
|---|---|---|---|
| Class/module structure (parent class, constructor, method layout) | `<ref1>` | ✅ / ⚠️ / N/A | |
| Error handling (exception types, catch locations, log format) | `<ref1>` | ✅ / ⚠️ / N/A | |
| Return shapes (response envelope, DTO structure, pagination format) | `<ref1>` | ✅ / ⚠️ / N/A | |
| Naming conventions for same concepts ($resource, $id, $data) | `<ref1>` | ✅ / ⚠️ / N/A | |
| Greenfield pattern (no reference found — document for future use) | N/A | ✅ / ⚠️ | |

### Architectural Compliance

| Check | Status | Evidence |
|---|---|---|
| Correct layer placement (logic in service, not controller/UI) | ✅ / ⚠️ / ❌ | `file:line` |
| No cross-layer violations (e.g. DB access from UI layer) | ✅ / ⚠️ / ❌ | |
| New files placed in correct module / folder | ✅ / ⚠️ / ❌ | |
| Existing interfaces and contracts not broken | ✅ / ⚠️ / ❌ | |

### Code Structure & Consistency

| Check | Status | Evidence |
|---|---|---|
| Single Responsibility — each function/class has one job | ✅ / ⚠️ / ❌ | |
| Consistent with existing patterns for same problem | ✅ / ⚠️ / ❌ | |
| Naming follows project conventions | ✅ / ⚠️ / ❌ | |
| No duplicated blocks > 6 lines | ✅ / ⚠️ / ❌ | |

### Standard Practices

| Check | Status | Evidence |
|---|---|---|
| `.ai/rules/*.md` plugin rules followed | ✅ / ⚠️ / ❌ | |
| `.evyasys/rules/*.md` project rules followed | ✅ / ⚠️ / ❌ | |
| Naming conventions (`naming.md` + `project.yaml`) followed | ✅ / ⚠️ / ❌ | |
| No magic numbers or hardcoded strings | ✅ / ⚠️ / ❌ | |
| Error handling consistent with module's existing pattern | ✅ / ⚠️ / ❌ | |
| No mixed concerns in a single function | ✅ / ⚠️ / ❌ | |

### Scalability

| Check | Status | Evidence |
|---|---|---|
| No N+1 queries or I/O inside loops | ✅ / ⚠️ / ❌ | |
| No unbounded linear scan on growing dataset | ✅ / ⚠️ / ❌ | |
| Extension requires no breaking changes to callers | ✅ / ⚠️ / ❌ | |

### Dirty Code

| Smell | Found | Location |
|---|---|---|
| Function > 40 lines | No / Yes | |
| Nesting depth > 3 | No / Yes | |
| Magic numbers / strings | No / Yes | |
| Duplicated block | No / Yes | |
| Inconsistent null / error handling | No / Yes | |
| Dead or commented-out code | No / Yes | |
| Misleading name | No / Yes | |
| Premature abstraction | No / Yes | |

---

## Domain-specific compliance

> Skip any section where the diff contains no changes in that domain. Fill status for every non-skipped row.

### Security — `.evyasys/docs/SECURITY.md`

| Check | Status | Evidence |
|---|---|---|
| Auth enforced at all new entry points | ✅ / ⚠️ / ❌ / N/A | `file:line` |
| Authorisation checks in correct layer | ✅ / ⚠️ / ❌ / N/A | |
| All user input validated before processing | ✅ / ⚠️ / ❌ / N/A | |
| No secrets or credentials in code or logs | ✅ / ⚠️ / ❌ / N/A | |
| Error messages do not expose internal state to users | ✅ / ⚠️ / ❌ / N/A | |

### API — `.evyasys/docs/API_STANDARDS.md` *(N/A if no API changes)*

| Check | Status | Evidence |
|---|---|---|
| Request/response shape matches project standard | ✅ / ⚠️ / ❌ / N/A | |
| Error format matches standard error envelope | ✅ / ⚠️ / ❌ / N/A | |
| HTTP status codes match project mapping | ✅ / ⚠️ / ❌ / N/A | |
| Authentication mechanism as specified in docs | ✅ / ⚠️ / ❌ / N/A | |

### Database — `.evyasys/docs/DB_STANDARDS.md` *(N/A if no DB changes)*

| Check | Status | Evidence |
|---|---|---|
| Table/column naming follows project conventions | ✅ / ⚠️ / ❌ / N/A | |
| Migration file named and structured correctly | ✅ / ⚠️ / ❌ / N/A | |
| No N+1 query patterns introduced | ✅ / ⚠️ / ❌ / N/A | |
| Indexes added for new queries on large tables | ✅ / ⚠️ / ❌ / N/A | |

### General Frontend / UX — `.evyasys/docs/FRONTEND.md` + `DESIGN_SYSTEM.md` *(N/A if no UI changes)*

| Check | Status | Evidence |
|---|---|---|
| Components follow project structure and naming | ✅ / ⚠️ / ❌ / N/A | |
| Design tokens used — no magic colour or spacing values | ✅ / ⚠️ / ❌ / N/A | |
| State management follows approved project pattern | ✅ / ⚠️ / ❌ / N/A | |

### UI Consistency — compared against existing similar pages *(N/A if no UI changes)*

**Page/component type:** _list view / detail view / form page / modal / card / widget_
**Reference pages used:**
- `<path/to/existing/similar/page1>`
- `<path/to/existing/similar/page2>`

| Consistency axis | Reference | Status | Inconsistency |
|---|---|---|---|
| Component/wrapper structure (card nesting, section layout) | `<ref1>` | ✅ / ⚠️ / ❌ / N/A | |
| Data loading pattern (loading / error / empty state) | `<ref1>` | ✅ / ⚠️ / ❌ / N/A | |
| Navigation pattern (breadcrumb, back button, action buttons) | `<ref1>` | ✅ / ⚠️ / ❌ / N/A | |
| Form structure (label placement, error display, submit position) | `<ref1>` | ✅ / ⚠️ / ❌ / N/A | |
| CSS class conventions (Bootstrap/AdminLTE class usage) | `<ref1>` | ✅ / ⚠️ / ❌ / N/A | |

### Accessibility — `.evyasys/docs/fe/ACCESSIBILITY.md` *(run only if frontend files changed and doc exists)*

| Check | Severity | Status | Evidence |
|---|---|---|---|
| Colour contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components | Critical | ✅ / ⚠️ / ❌ / N/A | |
| Keyboard navigation reaches all new/changed interactive elements | Critical | ✅ / ⚠️ / ❌ / N/A | |
| No keyboard trap — Tab and Shift+Tab exit every element | Critical | ✅ / ⚠️ / ❌ / N/A | |
| Focus visible on all focusable elements — no bare `outline: none` | Critical | ✅ / ⚠️ / ❌ / N/A | |
| Every icon-only button has `aria-label` | Critical | ✅ / ⚠️ / ❌ / N/A | |
| Every custom widget has correct ARIA role + state attributes | Critical | ✅ / ⚠️ / ❌ / N/A | |
| Semantic HTML used — landmarks, heading hierarchy, form labels | Important | ✅ / ⚠️ / ❌ / N/A | |
| Touch targets ≥ 44×44 px for all interactive elements | Important | ✅ / ⚠️ / ❌ / N/A | |

### Visual Quality & Interactive States — `.evyasys/docs/fe/VISUAL_QUALITY.md` *(run only if frontend files changed and doc exists)*

| Check | Severity | Status | Evidence |
|---|---|---|---|
| Every new/changed interactive component has all required states (hover, focus-visible, disabled, loading, error, empty) | Important | ✅ / ⚠️ / ❌ / N/A | |
| All transitions and animations have a `@media (prefers-reduced-motion: reduce)` override | Important | ✅ / ⚠️ / ❌ / N/A | |
| Motion duration and easing use project token values — no magic values | Important | ✅ / ⚠️ / ❌ / N/A | |
| Dark mode token pairs used correctly — no hardcoded colour in dark contexts | Important | ✅ / ⚠️ / ❌ / N/A | |
| Layout and components verified at all documented breakpoints | Important | ✅ / ⚠️ / ❌ / N/A | |
| Visual hierarchy maintained — primary action, heading scale, information density correct | Important | ✅ / ⚠️ / ❌ / N/A | |

### Performance — `.evyasys/docs/PERFORMANCE.md`

| Check | Status | Evidence |
|---|---|---|
| No new code on a known hot path without profiling | ✅ / ⚠️ / ❌ / N/A | |
| Response time within documented project budget | ✅ / ⚠️ / ❌ / N/A | |
| Caching applied where the performance doc requires it | ✅ / ⚠️ / ❌ / N/A | |

### Error Handling — `.evyasys/docs/ERROR_HANDLING.md`

| Check | Status | Evidence |
|---|---|---|
| Errors use project taxonomy (correct category and code) | ✅ / ⚠️ / ❌ / N/A | |
| Log messages use structured format at correct level | ✅ / ⚠️ / ❌ / N/A | |
| User-facing messages follow project "show vs hide" rule | ✅ / ⚠️ / ❌ / N/A | |

---

## Architect gate — docs to update

| Document | Update needed? | Reason |
|---|---|---|
| `PATTERNS.md` | Yes / No | New pattern introduced that should become canonical |
| `DECISIONS.md` | Yes / No | Significant architectural decision — needs an ADR |
| `SECURITY.md` | Yes / No | Auth or security model changed |
| `API_STANDARDS.md` | Yes / No | New API response or error pattern established |
| `DB_STANDARDS.md` | Yes / No | New schema or migration convention introduced |
| `PERFORMANCE.md` | Yes / No | New hot path identified or performance budget changed |
| `fe/ACCESSIBILITY.md` | Yes / No | New widget type or ARIA pattern introduced |
| `fe/VISUAL_QUALITY.md` | Yes / No | New component states, motion pattern, or dark mode usage introduced |

**If any "Yes" rows exist:** the relevant doc must be updated before or alongside the PR merge.
Run `/evyasys:TrainDocs --retrain` or update the specific doc directly.
**A GO verdict does not close this gate — the team is accountable for keeping docs current.**

---

## Critical Issues ❌ (must fix before FinishDev)

### CR-1 — <Short title>
**File:** `<path/to/file>` line <N>
**Issue:** <Specific description of what is wrong and why it matters>
**Evidence:** `<code snippet or grep output>`
**Fix required:** <What specifically needs to change>

---

## Important Issues ⚠️ (should fix before QA)

### IMP-1 — <Short title>
**File:** `<path>` line <N>
**Issue:** <Description>
**Suggestion:** <What to do>

---

## Minor Issues 💡 (note for later)

- `<file>:<line>` — <brief note>

---

## Strengths ✓

- <What was done well — be specific, cite file/pattern>

---

## Verdict

**[ ] GO ✅** — All Critical resolved. Proceed to `/evyasys:FinishDev <id>`.
**[ ] NO-GO ❌** — Fix Critical items listed above and request re-review.

---

*Developer response area — push back with technical reasoning if any finding is incorrect.*
