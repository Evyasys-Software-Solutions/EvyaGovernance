# Self-Review Checklist — GenerateReleaseNote

Run this checklist before showing output to the user. Fix silently if any item fails.

## Completeness
- [ ] Every story ID passed as an argument appears in the document.
- [ ] Every story is filed under its correct Epic. Ungrouped stories are listed under an explicit "Standalone Stories" section.
- [ ] The Executive Summary mentions every Epic covered in this release (by name, not by ID).
- [ ] Each story's changelog has at least one entry phrased as a user outcome ("Users can now…", "The system now…").

## Accuracy
- [ ] No changelog entry describes an internal method, class, or endpoint.
- [ ] Quality gate results come from the story's `_TestPlan.md` or `_ReleaseNotes.md` — not inferred or assumed.
- [ ] The release date is today's actual date (ISO format: YYYY-MM-DD).
- [ ] Story Points total in the EVYARELEASE block matches the sum of individual story SP values.
- [ ] If a story is missing a `_ReleaseNotes.md`, it is flagged, not silently skipped.

## Quality gates
- [ ] The consolidated quality gate for each domain is FAIL if any single story returned FAIL for that domain.
- [ ] N/A is only used when NO story in the release flagged that domain.
- [ ] At least one test outcome string is populated for each story (e.g., "All 7 TCs passed").

## Language and format
- [ ] Executive Summary is 3–5 sentences, no jargon, readable by non-technical stakeholders.
- [ ] Deployment Notes specify whether a DB migration is needed, and if so, what command.
- [ ] Rollback section is never blank — either steps or "N/A — no rollback required".
- [ ] Known Issues list is never empty; if none exist, write "None identified at release time."
- [ ] Version number follows the project's configured naming convention (from project.yaml or last release in memory).

## EVYARELEASE block
- [ ] Block is valid JSON.
- [ ] All required fields are present: releaseName, version, releaseDate, preparedBy, storyIds, epicGroups, executiveSummary, qualityGates, knownIssues, deploymentNotes, rollback.
- [ ] `epicGroups` array is not empty if stories were passed.
- [ ] Each story in `epicGroups[].stories` has: id, title, summary, changelog (array), storyPoints (number or 0), testOutcome.
- [ ] `qualityGates` has exactly these four keys: security, performance, accessibility, dataIntegrity.
- [ ] The block appears AFTER the confirmed release document, not before.
