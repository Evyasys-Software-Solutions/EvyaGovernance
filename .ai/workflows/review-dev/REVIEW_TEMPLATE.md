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
