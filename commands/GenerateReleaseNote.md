---
description: >
  Compile short, beautiful, branded PDF release notes from one or more completed stories.
  Pass story IDs as arguments, or run with no arguments and the agent will ask.
  Reads FinishQa artefacts, groups by Epic, consolidates quality gates, proposes version number
  from release history, and generates a compact PDF saved to .evyasys/releases/.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: "[StoryID ...] — space-separated story IDs (optional, e.g. EVYA-1042 EVYA-1043). Omit to be prompted."
skill: evyasys-generate-release-note
---

You are running **/evyasys:GenerateReleaseNote**.

## Quick summary

1. Parse story IDs from `$ARGUMENTS`. If none provided, ask: "Which story IDs should I include in this release? (e.g. EVYA-1042 EVYA-1043)"

2. Read the workflow files:
   - `.ai/workflows/generate-release-note/{AGENT,PROMPT,CHECKLIST,RELEASE_DOC_TEMPLATE}.md`
   - `.evyasys/workflows/generate-release-note/*.md` (project overrides if any)
   - `.evyasys/project.yaml` (brand color, company name, output dir, naming convention)
   - `.evyasys/memory/release-notes.json` (version history)

3. For each story ID, locate `.evyasys/board/**/<id>/` and read:
   - `<id>_UserStory.md` — title, epic, story points, impacted areas
   - `<id>_ReleaseNotes.md` — what's new, changelog, rollback (**required** — flag if missing)
   - `<id>_TestPlan.md`  — TC outcomes and quality gate results

4. Propose a version/release name from history + project naming convention. Confirm with user.

5. Draft the release document using `RELEASE_DOC_TEMPLATE.md`:
   - Executive summary (3–5 sentences, no jargon)
   - Stories grouped by Epic, each with user-facing changelog
   - Consolidated quality gate table
   - Known issues, deployment notes, rollback

6. Self-review with `CHECKLIST.md`. Fix silently if any item fails.

7. Show the complete document to the user. Tell them what files will be saved. Wait for approval.

8. On approval, output the `<!-- EVYARELEASE {...} -->` block.

9. The hook:
   - Saves `.evyasys/releases/<name>_<date>.md` (markdown)
   - Generates `.evyasys/releases/<name>_<date>.pdf` (branded PDF via pdfkit)
   - Updates `.evyasys/memory/release-notes.json` (release history)
   - Sends notification if configured

## PDF setup

pdfkit is installed automatically on first run if not already present.

Configure branding in `.evyasys/project.yaml` under `release_notes:` or run `/evyasys:Setup` to set:
- `company_name` — appears in header and footer
- `logo_path`    — relative path to logo (PNG/JPEG), optional
- `brand_color`  — hex color for header/cover (default: #0078d4)
- `output_dir`   — where PDFs are saved (default: .evyasys/releases/)
- `naming_convention` — e.g. `v{version}`, `Sprint-{N}`, `{date}`

Output: short, visually formatted release note · release name · markdown path · PDF path · release history entry.
