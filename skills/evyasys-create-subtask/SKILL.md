---
name: evyasys-create-subtask
description: Use this skill to break a user story into 3–8 developer-ready subtasks with technical scope, ACs, estimates and dependencies. Triggered by `/evyasys:CreateSubtask <StoryID>`. Creates child Tasks in Azure DevOps on approval.
trigger: /evyasys:CreateSubtask
---

# Skill: evyasys-create-subtask

Loads `.ai/workflows/create-subtask/*` (with `.evyasys/workflows/create-subtask/*` overrides), runs as Senior Developer, decomposes the story into 3–8 tasks via `TASK_TEMPLATE.md`, and on approval creates child Tasks in ADO.

## Output
- `docs/stories/<StoryID>_Subtasks.md`
- ADO Task IDs
