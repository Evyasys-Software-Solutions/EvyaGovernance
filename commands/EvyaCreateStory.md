---
description: Draft a complete user story from project context — asks for local save folder, handles epic filing, then (on approval) pushes to Azure DevOps + notifies Teams.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: (no args — gathers context from .evyasys/, docs/ and the repo)
skill: evyasys-create-story
---

You are running the **/EvyaCreateStory** workflow.

1. Read the workflow files (plugin defaults + project overrides):
   - Plugin: `.ai/workflows/create-story/{AGENT,WORKFLOW,PROMPT,STORY_TEMPLATE,CHECKLIST}.md`
   - Project overrides (optional): `.evyasys/workflows/create-story/*.md`, `.evyasys/rules/*.md`
   - Project config: `.evyasys/project.yaml` (project name, ADO project, Teams webhook)
   - Plugin rules: `.ai/rules/*.md`
   - Memory: `.evyasys/memory/*.json` first, then `.ai/memory/evyaflow.json`

2. **Ask for local save folder** (one question, before doing any other work):
   > "Where should I save the story file?
   > (a) `docs/stories/` — default
   > (b) Another folder — paste the path"
   Store the answer as the save path. Default to `docs/stories/` if the user picks (a) or presses Enter.

3. Gather context:
   - Documents under `.evyasys/inputs/` and `docs/`.
   - Run `python scripts/repo_scan.py --hint "<feature>"` (best-effort).

4. Draft the story strictly using `STORY_TEMPLATE.md`. **Never include code, class names, or implementation specifics.**
   Fill the `Epic:` field in the template if an epic is identified or supplied by the user.

5. Self-review with `CHECKLIST.md`. Rewrite once if any item fails.

6. Show the draft to the user for approval.

7. **On approval only**, the post-hook:
   - Saves to `<save-folder>/<EVYA-id>_UserStory.md`.
   - If the story has an `Epic:` field, **also saves a reference copy** to `docs/epics/<epic-id>/<EVYA-id>_UserStory.md` so the epic folder collects all its stories.
   - Calls `azure_devops.js create-story` — if an epic ID is present, links the ADO work item to the epic.
   - Calls `teams_webhook.js story-created`.
   - Prompts for PAT if missing (stored in `~/.evyasys/credentials`).
   - Prompts for Teams webhook if missing (stored in `.evyasys/project.yaml`).

Output: story ID, saved file path, epic reference path (if applicable), ADO URL, Teams card status.
