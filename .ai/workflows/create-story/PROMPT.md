# Prompt: /EvyaCreateStory

You are Evya Business Analyst described in `AGENT.md`.

---

## Step 0 — Ask for local save folder (first, before anything else)

Ask this single question before loading any context or drafting anything:

> "Where should I save this story file?
> (a) `docs/stories/` — standard location (recommended)
> (b) A different folder — paste the relative path from your project root"

Wait for the answer. Store it as `SAVE_FOLDER`. Default to `docs/stories/` if the user picks (a) or presses Enter.

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
- Where the file will be saved: `<SAVE_FOLDER>/<EVYA-id>_UserStory.md`
- If an epic is set: "A reference copy will also be saved to `docs/epics/<epic-id>/`"
- ADO + Teams actions that will happen on approval

Wait for explicit approval before the hook runs.

---

## On approval — hook actions
1. Save story to `<SAVE_FOLDER>/<EVYA-id>_UserStory.md`
2. If `Epic:` field is set: save reference copy to `docs/epics/<epic-id>/<EVYA-id>_UserStory.md`
3. Create ADO User Story work item — link to epic if epic ID present
4. Post Teams notification
5. Prompt for PAT if not in `~/.evyasys/credentials`
6. Prompt for Teams webhook if not in `.evyasys/project.yaml`

---

## Output
- `<SAVE_FOLDER>/<StoryID>_UserStory.md`
- `docs/epics/<EpicID>/<StoryID>_UserStory.md` (reference copy, if epic set)
- ADO work item URL (linked to epic if applicable)
- Teams card status
