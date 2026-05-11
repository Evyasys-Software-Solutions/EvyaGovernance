---
name: evyasys-start-qa
description: Use this skill to generate a comprehensive test plan and test cases (Gherkin where useful) for a story and transition Azure DevOps state to In QA. Triggered by `/EvyaStartQa <StoryID>`.
trigger: /EvyaStartQa
---

# Skill: evyasys-start-qa

Loads `.ai/workflows/start-qa/*` (+ overrides). Drafts a test plan covering positive/negative/edge/regression/non-functional, saves it to `docs/stories/<id>_TestPlan.md`, and on approval moves ADO state to "In QA".
