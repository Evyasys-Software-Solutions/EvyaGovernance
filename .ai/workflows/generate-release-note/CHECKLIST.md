# Self-Review Checklist — GenerateReleaseNote

Run this checklist before showing output to the user. Fix silently if any item fails.

## Completeness
- [ ] Every story ID passed as an argument appears in the document.
- [ ] Every story is filed under its correct Epic. Ungrouped stories are listed under an explicit "Standalone Stories" section.
- [ ] The Executive Summary mentions every Epic covered in this release (by name, not by ID).
- [ ] Each story has a `summary` sentence phrased as a user outcome ("Users can now…", "The system now…").

## Accuracy
- [ ] No story summary bullet describes an internal method, class, or endpoint — only user-facing outcomes.
- [ ] Quality gate results come from the story's `_TestPlan.md` or `_ReleaseNotes.md` — not inferred or assumed.
- [ ] The release date is today's actual date (ISO format: YYYY-MM-DD).
- [ ] Story Points total in the EVYARELEASE block matches the sum of individual story SP values.
- [ ] If a story is missing a `_ReleaseNotes.md`, it is flagged, not silently skipped.

## Quality gates
- [ ] The consolidated quality gate for each domain is FAIL if any single story returned FAIL for that domain.
- [ ] N/A is only used when NO story in the release flagged that domain.
- [ ] At least one test outcome string is populated for each story (e.g., "All 7 TCs passed").

## Language and format
- [ ] Executive Summary is 1–2 sentences max — a punchy tagline, no jargon, readable by non-technical stakeholders.
- [ ] "What's New" section uses one bullet per story under bold epic headings — no per-story sub-headings.
- [ ] Every "What's New" bullet is a single outcome-focused sentence ("Users can now…" / "The system now…").
- [ ] Quality gate table uses icon notation: ✅ PASS · ❌ FAIL · ➖ N/A.
- [ ] Deployment Notes specify whether a DB migration is needed, and if so, what command.
- [ ] Rollback section is never blank — either steps or "N/A — no rollback required".
- [ ] Known Issues list is never empty; if none exist, write "None identified at release time."
- [ ] Version number follows the project's configured naming convention (from project.yaml or last release in memory).
- [ ] Stories table is present and each row has: story ID, title, QA outcome, work item (if available).
- [ ] Document is compact — no walls of prose, no redundant repetition of data already in the table.

## EVYARELEASE block
- [ ] Block is valid JSON.
- [ ] All required fields are present: releaseName, version, releaseDate, preparedBy, storyIds, storyCount, totalSP, epicGroups, executiveSummary, qualityGates, knownIssues, deploymentNotes, rollback.
- [ ] `storyCount` equals `storyIds.length`.
- [ ] `totalSP` equals the sum of all story `storyPoints` values.
- [ ] `epicGroups` array is not empty if stories were passed.
- [ ] Each story in `epicGroups[].stories` has: id, title, summary (one outcome sentence), storyPoints (number or 0), testOutcome.
- [ ] `qualityGates` has exactly these four keys: security, performance, accessibility, dataIntegrity.
- [ ] The block appears AFTER the confirmed release document, not before.
