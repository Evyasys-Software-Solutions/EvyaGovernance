---
name: evyasys-create-story
description: Creates both Epics AND Stories in a single command. Resolves or creates all required epics first (Gate 1), plans the full story batch with one approval (Gate 2), drafts every story with high BA quality, syncs everything to the PM tool, and sends exactly 2 notifications — epics table and stories table.
trigger: /evyasys:CreateStory
---

# Skill: evyasys-create-story

`/evyasys:CreateStory` is the **full feature delivery kick-off** — one command creates everything needed to start building.

---

## What it does

1. **Captures intent** — describe requirements inline (Path A) or provide a reference document (Path B).
2. **Resolves epics** — scans existing epics, matches themes to them, proposes new epics for unmatched themes.
3. **Gate 1** — confirms new epics before creating them (skipped if all epics already exist).
4. **Plans all stories** — proposes the complete story list across all epics, with IDs, SP estimates, and key ACs.
5. **Gate 2** — one approval for the full batch (user can remove, rename, or adjust SP).
6. **Drafts every story** — full `STORY_TEMPLATE.md` fill, self-review per story, cross-story consistency check.
7. **Saves + syncs** — local files first (always safe), then PM tool (ADO / JIRA / GitHub Projects), PM IDs back-written.
8. **Notification A** — epics table: ID, Title, Status (New/Existing), PM ID.
9. **Notification B** — stories table: ID, Title, Epic, SP, PM ID, sync status for every story (failures highlighted when they occur).

---

## Two paths for requirements input

### Path A — Describe here
The agent guides the user through structured clarifying questions one at a time.

### Path B — Reference document
User provides a file path. The agent:
1. Reads all provided files.
2. Analyses from **four perspectives**: Business Analyst, Architect, Quality, Scope Decomposition (multi-epic scope only).
3. Asks only the **blocking questions** — one at a time, with reason.
4. Archives the doc + analysis + Q&A to `.evyasys/board/referencedoc/{YYYY-MM-DD}/`.
5. Notifies user of the archive path.
6. Drafts stories with a `Reference Doc:` metadata line pointing to the archive.

---

## Gates

| Gate | Fires when | What it confirms |
|---|---|---|
| **Gate 1** | ≥ 1 new epic proposed | Epic IDs, titles, and goals before any file is created |
| **Gate 2** | Always | Full story plan table — user can modify before drafting begins |

---

## Output

| Artefact | Path |
|---|---|
| Epic files | `.evyasys/board/epics/{epicId}/{epicId}_Epic.md` |
| Story files | `.evyasys/board/epics/{epicId}/stories/{storyId}/{storyId}_UserStory.md` |
| Reference doc archive | `.evyasys/board/referencedoc/{date}/{filename}` (Path B only) |
| PM work item IDs | Back-written into every epic and story file |
| Local map | `.evyasys/.ado-map.json` |
| Notification A | Epics table sent to configured channel |
| Notification B | Stories table sent to configured channel |

---

## Story ID sequencing

The agent scans existing story folders to find the highest current ID and assigns the batch sequentially from the next number. No collisions with existing stories.

---

## Failure handling

- PM sync failures are reported inline and logged to `.ado-map.json` with `adoId: null`.
- The local file is always saved regardless of PM status.
- Notification B includes only failures (if any) — no noise when everything succeeds.
- Failed syncs resolve automatically when the PM tool is reachable and the user re-runs the affected command.
