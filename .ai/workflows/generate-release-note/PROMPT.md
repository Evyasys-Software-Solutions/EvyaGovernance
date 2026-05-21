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
Minimum 1 story ID required — if none are present, ask: "Which story IDs should I include in this release? (e.g. EVYA-1042 EVYA-1043)"

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

Write 3–5 sentences, plain language:
1. Sentence 1: What this release delivers at the business level (reference epics by name).
2. Sentence 2: Who benefits and how (user persona + outcome).
3. Sentence 3: Quality — "All [N] test cases passed" or "X issues of severity 3–4 were logged for tracking."
4. Sentence 4 (if applicable): Any known limitations or items deferred to next release.

Rules:
- No class names, endpoint paths, or jargon.
- No "we implemented" — use "users can now", "the system now", "this release introduces".
- Maximum 5 sentences.

---

## Step 6 — Draft the full release document

Fill `RELEASE_DOC_TEMPLATE.md` with all collected data:

**Per-story changelog entries** — transform technical descriptions from `_ReleaseNotes.md` into outcome-focused bullets:
- ❌ "Added `VisitService.getHistory()` method"
- ✅ "Users can now view their complete visit history filtered by date and status"

**Deployment Notes** — consolidate all stories' deployment requirements:
- If any story has DB migrations: list the migration commands explicitly.
- If any story requires env variable changes: list them.
- If nothing required: "No deployment steps required — no migrations, no config changes."

**Rollback** — consolidate from stories:
- If any story has a rollback procedure, include it.
- If all are N/A: "N/A — no migrations or destructive changes. Feature flags: off by default."

**Known Issues** — list all cross-story limitations. Never leave this section empty.

---

## Step 7 — Self-review against CHECKLIST.md

Run every item. Fix silently if any fail. Only proceed to Step 8 when all items pass.

---

## Step 8 — Show and confirm

Present the complete release document to the user. Include:
- A summary header: "Release **[name]** covering [N] stories across [M] epics."
- The full document body.
- A gate summary row: "Quality gates: Security ✅ | Performance N/A | Accessibility ✅ | Data Integrity ✅"

Tell the user:
> "On approval I will generate:
> - Markdown: `.evyasys/releases/[filename].md`
> - PDF:      `.evyasys/releases/[filename].pdf`"

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
  "epicGroups": [
    {
      "epicId": "EP-001",
      "epicTitle": "Customer Portal",
      "stories": [
        {
          "id": "EVYA-1042",
          "title": "User Login Enhancement",
          "summary": "One-sentence user-facing summary",
          "changelog": ["Users can now...", "The system now..."],
          "limitations": [],
          "storyPoints": 5,
          "pmId": "12345",
          "testOutcome": "All 8 TCs passed"
        }
      ]
    }
  ],
  "executiveSummary": "Full executive summary text...",
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
- `changelog` must be an array of strings (minimum 1 per story).
- `limitations` must be an array (empty `[]` if none).
- `knownIssues` must be an array (empty `[]` if none).
- `qualityGates` must have exactly these 4 keys: `security`, `performance`, `accessibility`, `dataIntegrity`.
- Values for gate fields: `"PASS"` | `"FAIL"` | `"N/A"`.
- The block must be valid JSON — no trailing commas, no comments inside the JSON.

---

## Output
- Complete release document (markdown, shown to user)
- `<!-- EVYARELEASE {...} -->` block (after approval, stripped from saved markdown by hook)
- Hook generates: `.evyasys/releases/<ReleaseName>_<date>.md` and `.evyasys/releases/<ReleaseName>_<date>.pdf`
