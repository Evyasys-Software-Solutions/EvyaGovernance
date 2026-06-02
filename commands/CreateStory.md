---
description: Creates Epics AND Stories in one command. Resolves or creates all required epics (Gate 1), plans the full story batch with one approval (Gate 2), drafts every story at SuperPower BA quality, syncs to the PM tool, and sends exactly 2 notifications — epics table and stories table.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "(no args — command presents the choice interactively)"
skill: evyasys-create-story
---

You are running **/evyasys:CreateStory**.

## Step 0 — Input Gate  ⛔ HARD GATE

Read the full workflow from `.ai/workflows/create-story/PROMPT.md`.

The very first thing you do is present the user with **two options** and wait:

> **How would you like to provide the story requirements?**
>
> **(A) Describe it here** — I'll guide you through structured questions one at a time.
>
> **(B) Reference document** — provide a path to a requirements doc, transcript, wireframe, or written brief. I'll analyse it as BA + Architect + Scope before asking only the gaps that are missing.

**Do not read any project files, detect any epics, or load any context until the user responds.**

---

### Path A — Describe here
Follow PROMPT.md Steps 1–6: load context → Epic resolution (Gate 1) → clarifying Q&A → story plan (Gate 2) → draft all → output blocks.

---

### Path B — Reference document
1. Ask for the file path and wait.
2. Read every file provided.
3. Run **BA + Architect deep analysis** (four perspectives: Business, Architecture, Quality, Scope Decomposition — cite document text for each finding).
4. Ask only **blocking Q&A questions** (one at a time, with reason stated).
5. **Archive the document** to `.evyasys/board/referencedoc/{YYYY-MM-DD}/` — append the full analysis + Q&A to the archived copy.
6. **Notify the user** of the archive location.
7. Continue to PROMPT.md Steps 1–6.

---

## What gets created

In a single run, this command creates **everything needed to start building a feature**:

| Artefact | Where |
|---|---|
| Epic files (new epics only) | `.evyasys/board/epics/{epicId}/{epicId}_Epic.md` |
| Story files (all stories) | `.evyasys/board/epics/{epicId}/stories/{storyId}/{storyId}_UserStory.md` |
| Reference doc archive (Path B) | `.evyasys/board/referencedoc/{date}/{filename}` |
| PM work item IDs | Back-written into every epic and story file |

## The two gates

| Gate | When it fires | What the user confirms |
|---|---|---|
| **Gate 1** | Only when ≥ 1 new epic is needed | Epic IDs, titles, goals — before anything is created |
| **Gate 2** | Always | Full story plan table (ID, Title, Epic, SP, key ACs) — user can remove/rename/adjust |

## Notifications (exactly 2)

1. **Epics table** — all epics involved, with New/Existing status and PM IDs
2. **Stories table** — all stories with Epic, SP, PM ID, and sync status for every story; PM sync failures are highlighted inline when they occur.
