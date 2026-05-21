# {{RELEASE_NAME}} — Release Notes

> **Version:** {{VERSION}}
> **Release Date:** {{RELEASE_DATE}}
> **Prepared by:** {{PREPARED_BY}}
> **Stories:** {{STORY_IDS}}

---

## Executive Summary

{{EXECUTIVE_SUMMARY}}

---

## What's in This Release

{{#each EPIC_GROUPS}}
### {{EPIC_TITLE}} ({{EPIC_ID}})

{{#each STORIES}}
#### {{STORY_ID}} — {{STORY_TITLE}}

{{STORY_SUMMARY}}

**What changed:**
{{#each CHANGELOG}}
- {{this}}
{{/each}}

{{#if LIMITATIONS}}
**Known limitations for this story:**
{{#each LIMITATIONS}}
- {{this}}
{{/each}}
{{/if}}

**QA outcome:** {{TEST_OUTCOME}}

---
{{/each}}
{{/each}}

## Quality Gate Summary

| Gate | Result | Scope |
|---|---|---|
| Security | {{GATE_SECURITY}} | Auth, input validation, PII handling |
| Performance | {{GATE_PERFORMANCE}} | Response time budgets, load scenarios |
| Accessibility | {{GATE_ACCESSIBILITY}} | Keyboard nav, ARIA labels, colour contrast |
| Data Integrity | {{GATE_DATA_INTEGRITY}} | FK constraints, migration up/down |

---

## Known Issues & Limitations

{{#if KNOWN_ISSUES}}
{{#each KNOWN_ISSUES}}
- {{this}}
{{/each}}
{{else}}
None identified at release time.
{{/if}}

---

## Deployment Notes

{{DEPLOYMENT_NOTES}}

---

## Rollback Procedure

{{ROLLBACK}}

---

## Appendix — Story & Work Item References

{{#each EPIC_GROUPS}}
**{{EPIC_ID}}: {{EPIC_TITLE}}**
{{#each STORIES}}
- `{{STORY_ID}}` — {{STORY_TITLE}}{{#if PM_ID}} · Work Item #{{PM_ID}}{{/if}}
  - Test plan: `.evyasys/board/**/{{STORY_ID}}/{{STORY_ID}}_TestPlan.md`
{{/each}}
{{/each}}
