---
name: evyasys-finish-dev
description: Use this skill to wrap development on a story — verify TDD/code-review gates, confirm acceptance criteria coverage, write a dev summary, and transition Azure DevOps state to Ready for QA. Triggered by `/EvyaFinishDev <StoryID>`.
trigger: /EvyaFinishDev
---

# Skill: evyasys-finish-dev

Loads `.ai/workflows/finish-dev/*` (+ overrides), confirms AC coverage, writes a Dev Summary, and on approval moves ADO state to "Ready for QA" and posts the Teams handoff card.
