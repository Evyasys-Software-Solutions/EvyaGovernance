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

### Frontend / UX — `.evyasys/docs/FRONTEND.md` + `DESIGN_SYSTEM.md` *(N/A if no UI changes)*

| Check | Status | Evidence |
|---|---|---|
| Components follow project structure and naming | ✅ / ⚠️ / ❌ / N/A | |
| Design tokens used — no magic colour or spacing values | ✅ / ⚠️ / ❌ / N/A | |
| State management follows approved project pattern | ✅ / ⚠️ / ❌ / N/A | |
| Accessibility requirements met (ARIA, keyboard nav, contrast) | ✅ / ⚠️ / ❌ / N/A | |

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
