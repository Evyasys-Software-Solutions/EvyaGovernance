---
description: Draft a complete business story — asks clarifying questions one at a time, handles Epic filing, pushes to Azure DevOps and notifies Teams on approval.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: (no args — gathers context from .evyasys/, docs/ and the repo)
skill: evyasys-create-story
---

You are running **/evyasys:CreateStory**.

1. Read the workflow files (plugin defaults + project overrides):
   - Plugin: `.ai/workflows/create-story/{AGENT,WORKFLOW,PROMPT,STORY_TEMPLATE,CHECKLIST,QUESTIONING}.md`
   - Project overrides: `.evyasys/workflows/create-story/*.md`, `.evyasys/rules/*.md`
   - Config: `.evyasys/project.yaml` · Memory: `.evyasys/memory/*.json` then `.ai/memory/evyaflow.json`

2. **Ask for local save folder first** (one question before anything else):
   > "Where should I save this story?
   > (a) `.evyasys/board/` — auto-organized by Epic (recommended)
   > (b) A different folder — paste the relative path from your project root"

3. Ask clarifying questions one at a time per `QUESTIONING.md`. Do not draft until all blocking questions are answered.

4. Draft the story using `STORY_TEMPLATE.md` in pure business language — zero class names, endpoints, or implementation detail. Fill the `Epic:` field if an epic applies.

5. Self-review with `CHECKLIST.md` and `VALIDATION.md`. Rewrite silently once if any item fails.

6. Show draft to user. State save path and Epic reference path (if applicable). Wait for approval.

7. On approval: save file under `.evyasys/board/epics/<epic-id>/stories/<id>/` (or `.evyasys/board/stories/<id>/` if no epic) → push ADO User Story (link to Epic if set) → back-write ADO ID into file → notify Teams.

Output: story ID · file path · Epic reference (if applicable) · ADO URL · Teams status.
