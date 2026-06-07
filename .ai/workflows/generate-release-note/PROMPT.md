# Prompt: /evyasys:GenerateReleaseNote <StoryID> [StoryID ...]

You are the Release Director described in `AGENT.md`.

## Inputs
- Story IDs from `$ARGUMENTS` (one or more, space-separated)
- Story artefacts for each ID (located via Glob):
  - `_UserStory.md`     — title, ACs, Impacted Areas
  - `_ReleaseNotes.md`  — what's new, changelog, known limitations, rollback
  - `_TestPlan.md`      — TC outcomes, quality gate results
- Release history: `.evyasys/memory/release-notes.json`
- Project config: `.evyasys/project.yaml` (story.velocity, story.point_scale, release_notes.*)
- Release doc template: `.ai/workflows/generate-release-note/RELEASE_DOC_TEMPLATE.md`
- Checklist: `.ai/workflows/generate-release-note/CHECKLIST.md`

---

<HARD-GATE>
Do NOT draft the release document until:
1. All story artefacts for every passed StoryID have been read.
2. The release version/name has been confirmed by the user.
3. Any stories with missing `_ReleaseNotes.md` have been flagged and resolved.
Evidence first — document second.
</HARD-GATE>

---

## Step 0 — Parse and validate story IDs

Split `$ARGUMENTS` on whitespace to extract the list of story IDs.

If none are present, ask:
> "Which story IDs should I include in this release? You can list multiple, e.g.: `EVYA-1042 EVYA-1043 EVYA-1044`"

Wait for the answer before proceeding.

For each story ID:
- Use `Glob .evyasys/board/**/<id>/` to locate the story folder.
- Check for the existence of `<id>_UserStory.md`, `<id>_ReleaseNotes.md`, `<id>_TestPlan.md`.
- If `_ReleaseNotes.md` is MISSING: add the story ID to a "gaps" list.

If the gaps list is non-empty, stop and report:
> "The following stories have no release notes yet — FinishQa must be run before they can be included:
> [list]
> Continue with the remaining stories, or stop and run FinishQa first?"

Wait for the user's decision before proceeding.

---

## Step 1 — Read all story artefacts

For each valid story ID, read:
1. `<id>_UserStory.md` — extract: title, epicId, story points (from `Story Points: N` header line), Impacted Areas flags.
2. `<id>_ReleaseNotes.md` — extract: "What's new" paragraph, changelog bullets, known limitations, rollback steps.
3. `<id>_TestPlan.md` — extract: TC outcomes (pass/fail/blocked counts), quality gate results (Security / Performance / Accessibility / Data Integrity).

Build an in-memory map:
```
{
  storyId: {
    title, epicId, storyPoints,
    impactedAreas: [Security, DB, Frontend, API, Performance],
    whatsNew, changelog, limitations, rollback,
    tcTotal, tcPassed, tcFailed, tcBlocked,
    gates: { security, performance, accessibility, dataIntegrity }
  }
}
```

---

## Step 2 — Read release history and propose version

Read `.evyasys/memory/release-notes.json`. If it doesn't exist, treat it as `{ "releases": [] }`.

Read the `release_notes` section of `.evyasys/project.yaml` for naming convention (e.g., `v{version}`, `Sprint-{N}`, `{date}`).

Based on history and convention, propose a version number or release name:
- If convention is `v{version}`: look at last version, increment the patch or minor component.
- If convention is `Sprint-{N}`: look at last sprint number, increment.
- If convention is `{date}`: use today's date.
- If no convention or no history: ask: "What would you like to call this release? (e.g. v1.2.0, Sprint-15, 2026-Q2)"

Present the proposal:
> "I suggest naming this release **[proposed name]** based on your project's `[convention]` convention and the last release ([last release name]). Does this work?"

Wait for confirmation or a corrected name before proceeding.

---

## Step 3 — Group by Epic

Group the stories by their `epicId`:
- Stories with the same epicId form one section.
- Stories with `epicId = null` go in a "Standalone Stories" section.
- Sort epics alphabetically by epicId.
- Within each epic, sort stories by storyId.

For each epic, read the epic's `_UserStory.md` (if it exists at `.evyasys/board/epics/<epicId>/`) to get the epic title. If not found, use the epicId as the title.

---

## Step 4 — Consolidate quality gates

For each domain gate, apply the rule:
- If ANY story returned **FAIL** → release-level gate = `FAIL`
- If ANY story returned **PASS** and none returned **FAIL** → release-level gate = `PASS`
- If NO story flagged that domain (all are N/A) → release-level gate = `N/A`

This must reflect what actually happened in QA — not what was expected.

---

## Step 5 — Draft the Executive Summary

Write **1–2 sentences** — a punchy, plain-language tagline that sits below the release header:
- Sentence 1: What this release delivers and who benefits (mention epic names).
- Sentence 2 (optional): Quality highlight or a notable deferral, only if it adds real context.

Rules:
- No class names, endpoint paths, or technical jargon.
- No "we implemented" — use "users can now", "this release brings", "teams can now".
- Maximum 2 sentences. Short is better.

---

## Step 6 — Draft the full release document

Fill `RELEASE_DOC_TEMPLATE.md` with all collected data. Apply these formatting rules for a short, beautiful document:

### ✨ What's New section
- Group stories under their epic bold heading.
- One bullet per story — a single outcome-focused sentence.
- ❌ "Added `VisitService.getHistory()` method"
- ✅ "Users can now view their complete visit history filtered by date and status"
- No sub-headings per story, no QA detail in this section. Keep it scannable.

### 🔍 Quality Gates table
Map each gate result to an icon and render the compact single-row table from the template:
- `PASS` → `✅ PASS`
- `FAIL` → `❌ FAIL`
- `N/A`  → `➖ N/A`

### ⚠️ Known Issues
Short bullet list. If none: "None identified at release time." Never leave blank.

### 🚀 Deployment Notes
- If DB migrations exist: list the exact command(s).
- If env vars changed: list them.
- If nothing required: "No deployment steps required."

### ↩️ Rollback
- If a rollback procedure exists: list steps concisely.
- If not: "N/A — no rollback required."

### 📎 Stories table
Compact reference table — story ID, title, QA outcome, work item number if available.
`HAS_PM_IDS` = true if at least one story has a non-empty `pmId`.

---

## Step 7 — Self-review against CHECKLIST.md

Run every item. Fix silently if any fail. Only proceed to Step 8 when all items pass.

---

## Step 8 — Show and confirm

Present the complete release document to the user exactly as it will appear in the PDF.

After the document, add a one-line save notice:
> "Approve to save → `.evyasys/releases/[filename].md` + `.evyasys/releases/[filename].pdf`"

Wait for explicit approval before outputting the EVYARELEASE block.

---

## Step 9 — Output the EVYARELEASE block

After approval, append **exactly one** structured block at the very end of your output.
This block is parsed by the hook to generate the PDF and save release history.

```
<!-- EVYARELEASE
{
  "releaseName": "Release v1.2.0",
  "version": "1.2.0",
  "releaseDate": "YYYY-MM-DD",
  "preparedBy": "QA Team",
  "storyIds": ["EVYA-1042", "EVYA-1043"],
  "storyCount": 2,
  "totalSP": 13,
  "epicGroups": [
    {
      "epicId": "EP-001",
      "epicTitle": "Customer Portal",
      "stories": [
        {
          "id": "EVYA-1042",
          "title": "User Login Enhancement",
          "summary": "Users can now log in via SSO — one click replaces the password flow",
          "storyPoints": 5,
          "pmId": "12345",
          "testOutcome": "All 8 TCs ✅"
        }
      ]
    }
  ],
  "executiveSummary": "1–2 sentence tagline here.",
  "qualityGates": {
    "security": "PASS",
    "performance": "N/A",
    "accessibility": "PASS",
    "dataIntegrity": "N/A"
  },
  "knownIssues": [],
  "deploymentNotes": "No deployment steps required.",
  "rollback": "N/A — no rollback required."
}
-->
```

**JSON rules:**
- `storyPoints` must be a number (0 if unknown), not a string.
- `storyCount` must equal `storyIds.length`.
- `totalSP` must equal the sum of all `storyPoints`.
- `summary` per story must be one sentence, user-outcome focused.
- `knownIssues` must be an array (empty `[]` if none).
- `qualityGates` must have exactly these 4 keys: `security`, `performance`, `accessibility`, `dataIntegrity`.
- Values for gate fields: `"PASS"` | `"FAIL"` | `"N/A"`.
- The block must be valid JSON — no trailing commas, no comments inside the JSON.

---

## Output
- Complete release document (markdown, shown to user)
- `<!-- EVYARELEASE {...} -->` block (after approval, stripped from saved markdown by hook)
- Hook generates: `.evyasys/releases/<ReleaseName>_<date>.md` and `.evyasys/releases/<ReleaseName>_<date>.pdf`
