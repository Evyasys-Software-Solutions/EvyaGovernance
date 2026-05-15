---
name: evyasys-create-story
description: Use this skill to draft a complete user story (title, context, acceptance criteria, scenarios, out-of-scope) from project documents and code context, with no technical implementation details. Triggered by `/evyasys:CreateStory`. Self-reviews against a Definition-of-Ready checklist before asking the user to approve creation in Azure DevOps + Teams notification.
trigger: /evyasys:CreateStory
---

# Skill: evyasys-create-story

Drives the **Create Story** phase of Evyasys.

## Inputs (loaded by the session-start hook)
- User-attached docs / wireframes / transcripts under `docs/` or `.evyasys/inputs/`.
- Repo scan summary from `scripts/repo_scan.py`.
- `.evyasys/memory/*.json` and `.ai/memory/evyaflow.json`.
- `.ai/rules/*.md` and any project overrides under `.evyasys/rules/`.
- `.evyasys/project.yaml` (project name, ADO project, Teams webhook, story id prefix).

## Behaviour
1. Read `.ai/workflows/create-story/AGENT.md` (+ any project override) and adopt the BA/PO role.
2. Follow `WORKFLOW.md` step-by-step.
3. Fill `STORY_TEMPLATE.md`. Never include code or class names.
4. Self-review with `CHECKLIST.md`; rewrite once if anything fails.
5. Show the draft to the user. Wait for explicit approval.
6. On approval, run `hooks.js` → save markdown, push to Azure DevOps, notify Teams.

## Output
- `.evyasys/board/epics/<EpicID>/stories/<StoryID>/<StoryID>_UserStory.md` (or `board/stories/<StoryID>/` if no epic)
- ADO work item URL (ID back-written into file)
- Teams card status
