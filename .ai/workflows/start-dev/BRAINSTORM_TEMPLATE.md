# Technical Brainstorm — <EVYA-id>

**Story:** <Title>
**Date:** <YYYY-MM-DD>
**Engineering Lead:** <Name / handle>

---

## Business outcome (plain language)
<2–3 sentences: what the system must do differently after this story ships.
No class names, endpoints, or implementation detail.>

---

## Affected codebase areas

| Module / File | Impact | Notes |
|---|---|---|
| `<path>` | High / Med / Low | <why it's touched> |

**Risk flags from scan:** <anything unfamiliar or high-risk>

---

## Architecture & standards alignment

### Docs consulted

| Document | Relevant? | Key constraint for this story |
|---|---|---|
| `ARCHITECTURE.md` | Yes / No | <layer boundary or structural rule that applies> |
| `RULES.md` | Yes / No | <hard "never" or "must" rule> |
| `STANDARDS.md` | Yes / No | <naming or organisation rule> |
| `PATTERNS.md` | Yes / No | <approved pattern to use — name it> |
| `SECURITY.md` | Yes / No | <auth, validation, or secrets concern> |
| `DB_STANDARDS.md` | Yes / No | <schema, migration, or query constraint> |
| `API_STANDARDS.md` | Yes / No | <endpoint contract or versioning rule> |
| `FRONTEND.md` | Yes / No | <component, state, or routing rule> |
| `DESIGN_SYSTEM.md` | Yes / No | <token, component, or accessibility rule> |
| `PERFORMANCE.md` | Yes / No | <budget, hot path, or caching concern> |
| `ERROR_HANDLING.md` | Yes / No | <error taxonomy or log format rule> |

**Pre-brainstorm compliance:** ✅ No conflicts found / ⚠️ Conflicts noted — see Step 0d report

---

## Approaches considered

### Option 1 — <Short name>
**Summary:** ...

**Pros:**
- ...
- ...

**Cons:**
- ...
- ...

**Estimate delta:** S / M / L

---

### Option 2 — <Short name>
**Summary:** ...

**Pros:**
- ...
- ...

**Cons:**
- ...
- ...

**Estimate delta:** S / M / L

---

### Option 3 — <Short name>
**Summary:** ...

**Pros:**
- ...
- ...

**Cons:**
- ...
- ...

**Estimate delta:** S / M / L

---

## Recommendation

**Recommended:** Option N — <Name>

**Why:** <2–4 sentences. Name the single deciding factor.>

**Top risk:** <What could go wrong>
**Mitigation:** <How to handle it>

---

## Open questions

- ? <question 1>
- ? <question 2>

---

## Team decision

**Agreed approach:** Option N — <Name>  *(may differ from recommendation)*
**Approved by:** <Name>
**Notes / constraints:** <anything the team added>

---

## Docs that may need updating after this story ships

| Document | Update needed? | Reason |
|---|---|---|
| `PATTERNS.md` | Yes / No | <New pattern introduced that should become canonical> |
| `DECISIONS.md` | Yes / No | <New architectural decision made — needs an ADR> |
| `SECURITY.md` | Yes / No | <Auth model or security approach changed> |
| `API_STANDARDS.md` | Yes / No | <New API pattern established> |
| `DB_STANDARDS.md` | Yes / No | <New schema or migration convention introduced> |
| `PERFORMANCE.md` | Yes / No | <New hot path or budget established> |

**If any "Yes" rows exist:** run `/evyasys:CreateDocs --retrain` after the PR merges,
or update the specific doc directly before the story moves to Done.

---

*This document is saved to `.evyasys/board/**/<id>/<id>_TechBrainstorm.md` and
committed with the PR so the architectural decision travels with the code.*
