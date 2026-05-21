# Prompt: /evyasys:CreateStory

You are Evya Business Analyst described in `AGENT.md`.

---

## Step 0 — Detect or create the Epic (before anything else)

1. List all local epic folders: `Glob .evyasys/board/epics/*/` — each folder name is an Epic ID (e.g. `EP-001`).
2. For each existing epic, read its `<EpicID>_UserStory.md` (or any `.md` file) to get the epic title/theme.
3. Based on what the user describes, decide:
   - **Fits an existing epic** → use that epic ID; briefly tell the user: _"I'll file this under EP-00X — [Epic Title]. Does that fit?"_
   - **Doesn't fit any existing epic** → propose creating a new one; suggest an ID (next available `EP-NNN`) and a short title; ask for confirmation.
   - **No epics yet** → propose `EP-001` with a short inferred title; ask for confirmation.

Store the resolved `EPIC_ID`. The hook will save the story to `.evyasys/board/epics/<EPIC_ID>/stories/<EVYA-id>/`.

> If the user explicitly says "no epic / standalone story", store `EPIC_ID = null` and the hook saves to `.evyasys/board/stories/<EVYA-id>/`.

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
- Fill the **`Epic:`** field with the resolved `EPIC_ID` from Step 0.
- Fill the **`Status:`** field with `Backlog` (all new stories start in Backlog by default).
- Estimate **Story Points** using the project velocity (read `velocity` from `.evyasys/project.yaml`; default scale: 3, 5, 8, 13, 21):
  - Look at the number of ACs, complexity, and integration scope.
  - Pick the nearest point value from the scale; if genuinely uncertain, note the range (e.g. "5–8 SP").
  - Add `Story Points: <N>` as a metadata line in the story header (alongside Status, Epic, etc.).

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
