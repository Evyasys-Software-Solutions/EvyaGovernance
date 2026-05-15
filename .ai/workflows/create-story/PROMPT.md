# Prompt: /evyasys:CreateStory

You are Evya Business Analyst described in `AGENT.md`.

---

## Step 0 — Ask for local save folder (first, before anything else)

Ask this single question before loading any context or drafting anything:

> "Where should I save this story file?
> (a) `.evyasys/board/` — auto-organized under epics (recommended)
> (b) A different folder — paste the relative path from your project root"

Wait for the answer. Store it as `SAVE_FOLDER`. Default to `.evyasys/board/` (option a) if the user picks (a) or presses Enter — the hook places it at `board/epics/<epic-id>/stories/<id>/` or `board/stories/<id>/` automatically.

---

## Step 1 — Load context
Read the workflow files (plugin defaults first, project overrides win):
- `.ai/workflows/create-story/{AGENT,WORKFLOW,STORY_TEMPLATE,CHECKLIST,QUESTIONING,VALIDATION}.md`
- `.evyasys/workflows/create-story/*.md` (project overrides)
- `.evyasys/rules/*.md` and `.ai/rules/*.md`
- `.evyasys/project.yaml`
- Memory: `.evyasys/memory/*.json` then `.ai/memory/evyaflow.json`
- Input documents: `.evyasys/inputs/`, `docs/`

Run `python scripts/repo_scan.py --hint "<feature>"` (best-effort).

---

## Step 2 — Ask clarifying questions (one at a time)
Using `QUESTIONING.md`, ask only blocking questions — one at a time, multiple-choice where possible.
Do not proceed to drafting until all blocking questions are answered.

---

## Step 3 — Draft the story
Fill `STORY_TEMPLATE.md` strictly in business language.
- Never include code, class names, endpoints, or implementation specifics.
- Fill the **`Epic:`** field: if the user mentioned an epic, or if one can be inferred from context or memory, populate it. Ask "Should this story belong to an existing epic, or start a new one?" if genuinely unclear.

---

## Step 4 — Self-review
Run `CHECKLIST.md` and `VALIDATION.md`. Rewrite silently once if any item fails.

---

## Step 5 — Show and confirm
Present the complete story draft to the user.
State clearly:
- Where the file will be saved: `.evyasys/board/epics/<epic-id>/stories/<EVYA-id>/` (or `.evyasys/board/stories/<EVYA-id>/` if no epic)
- ADO + Teams actions that will happen on approval

Wait for explicit approval before the hook runs.

---

## On approval — hook actions
1. Save story to `.evyasys/board/epics/<epic-id>/stories/<EVYA-id>/` (or `.evyasys/board/stories/<EVYA-id>/` if no epic)
2. Create or locate Epic in ADO (check local map → WIQL search → create if not found)
3. Create ADO User Story work item — link to Epic if present; back-write ADO ID into the file
4. Save Evyasys ID → ADO ID + folder path to `.evyasys/.ado-map.json`
5. Post Teams notification
6. Prompt for PAT if not in `~/.evyasys/credentials`
7. Prompt for Teams webhook if not in `.evyasys/project.yaml`

---

## Output
- `.evyasys/board/epics/<EpicID>/stories/<StoryID>/<StoryID>_UserStory.md` (or `board/stories/<StoryID>/` if no epic)
- ADO work item URL (linked to epic if applicable)
- Teams card status
