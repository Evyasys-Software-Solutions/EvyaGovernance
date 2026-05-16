# Test Plan — <EVYA-id>

## Scope
<One paragraph: what this test plan covers and what it excludes.>

## Test environment
- Environment: <staging URL / local / UAT>
- Browser matrix: <e.g. Chrome latest, Firefox latest, Safari — or N/A>
- Mobile / device: <e.g. iOS 17 / Android 14 — or N/A>

## Test data
- Fixtures / seeds: <what data must exist before tests run>
- Accounts / roles: <which user roles are needed>
- External services: <sandbox keys, mocked endpoints — or N/A>

---

## AC-driven test cases

### TC1 — <Short title> (covers AC1)
**Type:** Positive | Negative | Edge | Regression
**Given:** <pre-condition / state>
**When:** <action>
**Then:** <expected result>
**Test data required:** <specific values>

### TC2 — <Short title> (covers AC1 — negative)
**Type:** Negative
**Given:**
**When:**
**Then:**
**Test data required:**

<!-- Add one TC per AC (positive) and one TC per AC (negative). Use Gherkin for multi-step scenarios. -->

---

## Edge cases

<!-- At least 2 per major workflow branch. Examples: empty input, max-length input, concurrent run,
     timezone edge, permission boundary, network failure mid-flow. -->

### TCE1 — <Title>
**Scenario:** <describe the edge>
**Expected behaviour:** <what should happen>

---

## Regression checks

<!-- One check per file in the Dev Summary "Files touched". Two checks for high-risk files. -->

| File touched | Existing behaviour being verified | TC |
|---|---|---|
| `<path/to/file>` | <what should still work> | TCR1 |

---

## Non-functional checks

### Security (apply if Security flag set in Impacted Areas)
| Check | TC | Expected | Pass/Fail |
|---|---|---|---|
| Protected endpoint — unauthorised access | TCS1 | 401 / 403 | |
| User-controlled field — invalid input | TCS2 | Rejected with error | |
| PII not exposed in error responses | TCS3 | No PII in response body or logs | |

*Mark entire section N/A if Security flag is not set — state reason.*

### Performance (apply if Performance flag set)
| Path | Measurement method | Target (from PERFORMANCE.md) | Measured | Pass/Fail |
|---|---|---|---|---|
| `<endpoint or operation>` | <how measured in test env> | <Xms / Xrps> | | |

*Mark entire section N/A if Performance flag is not set — state reason.*

### Accessibility (apply if Frontend flag set)
| Check | Standard (DESIGN_SYSTEM.md) | Pass/Fail |
|---|---|---|
| Keyboard navigation through all interactive elements | All interactive elements reachable via Tab | |
| ARIA labels on all interactive controls | All controls have accessible name | |
| Colour contrast | Meets documented contrast ratio | |

*Mark entire section N/A if Frontend flag is not set — state reason.*

### Data integrity (apply if DB flag set)
| Check | Expected | Pass/Fail |
|---|---|---|
| Migration up runs cleanly | No errors, schema matches expected | |
| Migration down runs cleanly | Rolls back without data loss | |
| FK constraint behaviour | Orphan records blocked / cascades as expected | |

*Mark entire section N/A if DB flag is not set — state reason.*

---

## Exit criteria
- All test cases have a recorded outcome: Pass / Fail / Blocked.
- No P0 (critical / data loss / security) or P1 (broken AC / regression) defects open.
- All applicable non-functional gates above are marked Pass or N/A with reason.
