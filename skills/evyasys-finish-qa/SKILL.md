---
name: evyasys-finish-qa
description: Use this skill to validate a QA pass, draft release notes, and transition Azure DevOps state to Done. Triggered by `/evyasys:FinishQa <StoryID>`.
trigger: /evyasys:FinishQa
---

# Skill: evyasys-finish-qa

Loads `.ai/workflows/finish-qa/*` (+ overrides). Confirms TC outcomes, drafts release notes via `RELEASE_NOTES_TEMPLATE.md`, saves to `docs/stories/<id>_ReleaseNotes.md`, and on approval moves ADO state to "Done" and posts the release card.
