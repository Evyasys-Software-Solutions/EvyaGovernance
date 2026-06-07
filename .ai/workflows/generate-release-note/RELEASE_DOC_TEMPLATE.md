# 🚀 {{RELEASE_NAME}}

> **📅** {{RELEASE_DATE}}  ·  **📦** {{STORY_COUNT}} {{#if STORY_COUNT_PLURAL}}stories{{else}}story{{/if}}  ·  **⚡** {{TOTAL_SP}} sp  ·  **👤** {{PREPARED_BY}}

{{EXECUTIVE_SUMMARY}}

---

## ✨ What's New

{{#each EPIC_GROUPS}}
**{{EPIC_TITLE}}**
{{#each STORIES}}
- {{STORY_SUMMARY}}
{{/each}}

{{/each}}

---

## 🔍 Quality Gates

| Security | Performance | Accessibility | Data Integrity |
|:---:|:---:|:---:|:---:|
| {{GATE_SECURITY_ICON}} {{GATE_SECURITY}} | {{GATE_PERFORMANCE_ICON}} {{GATE_PERFORMANCE}} | {{GATE_ACCESSIBILITY_ICON}} {{GATE_ACCESSIBILITY}} | {{GATE_DATA_INTEGRITY_ICON}} {{GATE_DATA_INTEGRITY}} |

> Gate legend: ✅ PASS · ❌ FAIL · ➖ N/A

---

## ⚠️ Known Issues

{{#if KNOWN_ISSUES}}
{{#each KNOWN_ISSUES}}
- {{this}}
{{/each}}
{{else}}
None identified at release time.
{{/if}}

---

## 🚀 Deployment

{{DEPLOYMENT_NOTES}}

---

## ↩️ Rollback

{{ROLLBACK}}

---

## 📎 Stories

| Story | Title | QA Outcome |{{#if HAS_PM_IDS}} Work Item |{{/if}}
|---|---|---|{{#if HAS_PM_IDS}}---|{{/if}}
{{#each EPIC_GROUPS}}{{#each STORIES}}| `{{STORY_ID}}` | {{STORY_TITLE}} | {{TEST_OUTCOME}} |{{#if PM_ID}} #{{PM_ID}} |{{/if}}
{{/each}}{{/each}}
