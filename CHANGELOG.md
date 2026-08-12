# Changelog

All notable changes to EvyaGovernance are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking change or significant new capability
- **MINOR** — new feature, backward compatible
- **PATCH** — bug fix or documentation update

---

## [1.4.0] — 2026-08-12

New end-to-end delivery orchestrator: one command takes a story from planning through
coded, self-reviewed, tested, doc-flagged, and committed — with only three human approval
gates. Designed for speed (< 5 min small stories) without sacrificing the quality standards
the plugin already enforces.

### Added
- **`/evyasys:Deliver <StoryID|EpicID> [...]`** — the new end-to-end orchestrator.
  Runs 10 phases with 3 gates: batched clarifying questions (Gate 1, auto-skipped if the
  loaded standards answer everything); architecture recommendation with reference scan
  (Gate 2); final commit summary (Gate 3). Between gates it writes source code following
  every loaded standard, runs a full self code-review with up to 2 auto-fix iterations,
  drafts test plan + release notes, and queues doc updates. On Gate 3 approval the hook
  writes all 5 artefacts, creates/checkouts the feature branch, commits the source
  changes locally (never pushes), transitions PM state to Ready for QA, and fires one
  notification per story or per epic in epic mode.
- **`.ai/workflows/deliver/`** — new workflow directory with `AGENT.md` (Delivery
  Orchestrator role, mandate, three-gate contract, speed targets by story size),
  `PROMPT.md` (10-phase workflow with parallel batch load in Phase 0, standards-driven
  autonomous coding in Phase 3, ReviewDev criteria in Phase 4, structured output blocks
  for the hook), and `CHECKLIST.md` (self-review gate matching the pattern of other
  workflows).
- **`skills/evyasys-deliver/`** — `SKILL.md` (skill definition with speed targets and
  safety guarantees) and `hooks.js` (parses `<!-- EVYADELIVER: EVYA-XXXX { ... } -->`
  blocks and `<!-- EVYADELIVERBATCH { ... } -->` manifest; writes artefact files;
  creates the feature branch if missing; stages listed source paths and creates a
  local commit via `git commit -F <tmpfile>`; transitions PM state via `pm.setState`;
  fires `notify.send({ event: 'dev-finished', ... })`; per-story status report).
- **`commands/Deliver.md`** — command file with the plugin-dir locator pattern
  (matches all other delivery commands).
- **`README.md`** — new Deliver row (10) in the command table with full description;
  command count updated to 14; autocomplete count updated to 14.
- **`commands/command.json`** — new Deliver entry with description.

### Design decisions
- **Three gates, no more.** Clarifying questions are batched into one exchange, not
  one-at-a-time. Architecture is a single recommendation, not a full brainstorm doc.
  Final approval is a compact summary with counts and quality-gate results.
- **Never pushes.** The hook creates a local git commit only. The user pushes when
  they're ready. This preserves reviewability and keeps the plugin from touching
  the remote branch.
- **Parallel batch load in Phase 0.** All rules, quality-gate docs, templates, and
  story artefacts are read in a single message. Cached context is reused across
  every subsequent phase — no re-reads.
- **Auto-fix loop bounded at 2 iterations.** If Critical review findings remain
  after two attempts, the run is marked BLOCKED and the user chooses fix/override/abort
  at Gate 3.
- **Structured output for the hook.** The agent produces machine-parseable
  `<!-- EVYADELIVER: EVYA-XXXX { ... } -->` blocks with all fields the hook needs
  (files changed, commit message, artefacts, quality gate results, docs to update).
- **Speed targets in AGENT.md.** Small stories < 5 min, medium < 15 min, large
  < 30 min with an offer to split up-front.

---

## [1.3.2] — 2026-08-09

### Changed
- **`skills/evyasys-update/hooks.js`** — the "already on latest" path now shows a
  proper confirmation banner instead of a single line. When a user runs `/evyasys:Update`
  after a successful upgrade, they see:
  - A boxed **"You're on the latest version: vX.Y.Z"** banner
  - Release date and source (extracted from CHANGELOG.md)
  - The **"What's in this version"** changelog entry for the current version
    (so the user knows exactly what they got)
  - A clear "Nothing to do — up to date" closing line
- The pre-reopen instruction line also now surfaces the target version in a highlighted
  🎯 line ("After reopening you will be on vX.Y.Z"), making the version transition obvious.
- Added `extractVersionEntry()` helper in the update hook to parse the changelog entry for
  a specific version (date + first ~25 body lines).

### Why
Previously the confirmation post-update was a plain sentence — users couldn't tell
whether the update actually took effect or what they now had. The new banner makes
the version prominent and shows what the release contained.

---

## [1.3.1] — 2026-08-09

Team-readiness hardening pass — audit found several friction points and one authenticated-encryption gap. All fixed before team rollout tomorrow.

### Security
- **`scripts/lib/encrypt.js` — upgraded from AES-256-CBC to AES-256-GCM (authenticated encryption).**
  CBC mode allowed silent ciphertext tampering; GCM adds an authentication tag that fails
  decryption if the credentials file is modified out-of-band. New format: `v2:<iv>:<tag>:<ciphertext>`.
  Legacy CBC format (from ≤ v1.3.0) is still decrypted transparently for backwards compatibility,
  so no user action needed on existing credentials — the next Setup re-save writes v2.

### Fixed
- **`scripts/lib/ensure-compress.js`** — `ensureCompress()` now verifies `isMcpRegistered()`
  returns true after `headroom mcp install` runs. Previously it wrote "compression enabled" to
  `~/.evyasys/settings.json` even if the MCP entry failed to land in `~/.claude/settings.json`,
  so the team thought compression was active when it silently wasn't. Recovery path also now
  requires both PATH + registered.
- **`.ai/workflows/setup/PROMPT.md`** — credential validator lookup now emits `VALIDATOR_NOT_FOUND`
  when the file is missing and Setup aborts cleanly with a clear "run /evyasys:Repair" message.
  Previously it saved a `$VALIDATOR` empty string and produced cryptic `node: ""` errors later.
- **`.ai/workflows/setup/PROMPT.md`** — the "skip validation" path for PM and notification
  credentials now requires the exact confirmation phrase `yes, proceed unverified` after showing
  a warning that downstream sync commands will fail with 401/403. Previously any keyword ("skip",
  "no", enter) saved unverified credentials silently.
- **`.ai/workflows/start-dev/PROMPT.md`** — Step 2 codebase probe now checks `.git/` and Python
  availability before invoking `python scripts/repo_scan.py`. Missing git → continue with
  standards-only brainstorm; missing Python → fall back to manual Glob/Grep scan. Neither aborts.
- **`.ai/workflows/review-dev/PROMPT.md`** — Step 1 now verifies the working directory is a git
  repo before running `git diff main...HEAD`. If not, stops with a clear error rather than crashing
  with `fatal: not a git repository`.
- **`commands/TrainDocs.md`** — corrected three remaining "25 documents" references to "37".
- **`commands/command.json`** — refreshed all descriptions to reflect current behaviour; added
  entries for `CreateFunctionalDocs` and `Repair` (previously missing); TrainDocs description
  updated from "25 documents" to "37 documents".
- **`QUICKSTART.md`** — "25 quality-gate documents" corrected to "37".
- **`project-template/.evyasys/README.md`** — "(25 documents total)" corrected to "37".
- **`.ai/workflows/create-docs/CHECKLIST.md`** — two "35 documents" references corrected to "37".
- **`.ai/workflows/setup/PROMPT.md`** — Step 5 closing message updated from "35 documents" to "37".
- **`README.md`** — heading "The 10 Commands" corrected to "The 13 Commands"; command table now
  includes rows for `/evyasys:Update` (row 12) and `/evyasys:Repair` (row 13).

### Scale & performance
- **`scripts/lib/ado-map.js`** — added `snapshot(repoRoot)` for cached reads across a batch.
  Previously a 50-story batch called `read()` (and thus `fs.readFileSync`) 50+ times; snapshot
  caches the map in memory for the duration of one hook run. Old `lookup()`/`lookupDir()`/`save()`
  exports still work for compatibility with existing hooks — new hooks should prefer `snapshot()`.
- **`scripts/lib/ado-map.js`** — `save()` now does an atomic write (tmp file → rename) after
  re-reading the file to merge in concurrent updates from a parallel hook. Reduces the
  read-modify-write race window to just the rename step (atomic on POSIX and Windows).
- **`scripts/lib/compress-settings.js`** — atomic write for `~/.evyasys/settings.json` (tmp+rename)
  so a crash mid-write can no longer leave the file half-written.
- **`scripts/lib/http-retry.js`** — fails fast on definitive network errors (`ENOTFOUND`,
  `ECONNREFUSED`, `EHOSTUNREACH`, `EAI_AGAIN`) instead of retrying 3× with exponential backoff.
  A 50-story batch against an unreachable Teams webhook now fails in ~50ms per attempt
  instead of ~7s of pointless waiting.
- **`scripts/lib/http-retry.js`** — 429 responses now honour the `Retry-After` header (capped
  at 30s) instead of ignoring it. Azure DevOps / JIRA rate-limit responses now cause the retry
  to wait the exact server-instructed interval.
- **`scripts/lib/http-retry.js`** — fetch availability is now resolved upfront with a clear
  error message if neither built-in fetch nor `node-fetch` is available, instead of throwing
  a cryptic `require` error mid-retry.

### Diagnostics
- **`scripts/lib/compress-settings.js`** — `readSettings()` now emits a `console.warn` when
  `~/.evyasys/settings.json` fails to parse (previously silent-swallow returned `{}`),
  so a corrupt settings file is surfaced instead of silently overwritten.

### Added
- **`.ai/workflows/create-functional-docs/CHECKLIST.md`** — self-review gate for the new
  functional-docs workflow, matching the pattern of other workflows.
- **`.ai/workflows/setup/CHECKLIST.md`** — self-review gate for Setup, previously missing.
- **README.md — "Running your first sprint (team onboarding)" section** — end-to-end walkthrough
  for new team members: Day 1 one-time setup, Day 1 per-teammate steps, per-story flow, and a
  "safe to re-run?" table for every command.
- **README.md Troubleshooting** — four new rows: "not a git repository", "python: command not
  found", "credential validator not found", "Setup skip left me unverified".
- **README.md Command Reference** — batch-mode capability now explicitly noted for StartDev,
  ReviewDev, FinishDev, StartQa, FinishQa, GenerateReleaseNote in a footnote below the table.

---

## [1.3.0] — 2026-08-08

### Added
- **`/evyasys:CreateFunctionalDocs` command** — new command that scans each business module
  and generates a plain-language functional reference document into `.evyasys/docs/functional/`.
  Documents cover: Module Overview, Entities, Access & Permissions, Validations, Actions,
  Business Logic, Workflows, Error Scenarios, Integration Points, and Module Glossary.
  Structured for RAG retrieval — every section is self-contained and can answer end-user
  chat queries independently. Supports `--all`, single module name, and `--update <module>` modes.
- **`skills/evyasys-create-functional-docs/`** — new skill: `SKILL.md` defining the command,
  `hooks.js` parsing `<!-- EVYAFUNCDOC: ModuleName.md -->` delimiters and writing to
  `.evyasys/docs/functional/`, generating `functional/INDEX.md`.
- **`.ai/workflows/create-functional-docs/`** — new workflow directory with `AGENT.md` (Business
  Analyst role), `PROMPT.md` (5-step workflow with module scan, template fill, self-review,
  preview, and update-mode behaviour), and `MODULE_TEMPLATE.md` (RAG-optimized 10-section template).
- **Architecture reference scan in StartDev (Step 0e)** — before generating any brainstorm option,
  StartDev now scans for 2–3 existing implementations of the same feature type (CRUD resource,
  API endpoint, background job, UI page, or auth change) and produces a **Reference Implementations**
  block. Every brainstorm option must explicitly follow or justify deviation from the reference.
  Also finds UI reference pages when Frontend flag is set, establishing a consistency anchor.
- **Architecture consistency scan in ReviewDev** — new subsection in Step 5 (Architecture & Code
  Health). The reviewer locates 2–3 existing implementations of the same type via Grep/Glob and
  compares new code on five axes: class structure, error handling, return shapes, naming conventions,
  and UI structure. Every inconsistency flagged at **Important** minimum. Greenfield patterns noted
  for team review before merge.
- **UI Consistency section in ReviewDev** — new subsection in Step 4. When frontend files change,
  the reviewer finds 2–3 existing pages of the same type (list view, detail view, form, modal) and
  compares component/wrapper structure, data loading pattern, navigation, form structure, and CSS class
  conventions. Structural departure from ≥ 2 existing similar pages → **Important**.
- **Architecture Consistency Scan table in REVIEW_TEMPLATE.md** — new table in Architecture & Code Health
  section recording reference files used and consistency findings per axis.
- **UI Consistency table in REVIEW_TEMPLATE.md** — new table in Domain-specific compliance section
  recording reference pages and consistency per axis (component structure, data loading, navigation, form, CSS).
- **Architecture Reference Scan section in CHECKLIST.md** — new checklist group verifying that the
  feature type was identified, references found and read, reference block recorded, and UI reference
  pages listed when applicable.
- **UI Consistency checklist item in CHECKLIST.md** — new item in Domain docs compliance confirming
  2+ existing similar pages were compared and structural departures flagged.

### Changed
- `skills/evyasys-train-docs/SKILL.md` — document count corrected: "up to 35 documents" → "up to 37 documents".

---

## [1.2.0] — 2026-06-25

### Added
- **`fe/ACCESSIBILITY.md`** — new TrainDocs-generated document. WCAG 2.1 AA compliance
  contract covering: colour contrast minimums (4.5:1 body, 3:1 large/UI), keyboard
  navigation model per widget type, focus management rules (when focus moves
  programmatically and where), ARIA usage contract per custom widget, semantic HTML
  contract, minimum touch target sizes (44×44px recommended), and a screen reader
  testing checklist. ReviewDev and StartQa load this automatically when the story has
  a Frontend flag.
- **`fe/VISUAL_QUALITY.md`** — new TrainDocs-generated document. Interactive state
  contract that specifies every required state per component type (button, input,
  select, checkbox, modal, form, data view — all states from `default` through `error`
  and `empty`). Also covers: visual hierarchy rules (primary action, heading scale,
  information density), motion/animation standards (`prefers-reduced-motion` mandatory,
  duration and easing token catalogue), dark mode token pair table (if applicable),
  breakpoint-by-breakpoint responsive quality gates, and image/media loading rules.
  ReviewDev blocks merges on missing states. StartQa uses it to generate complete state
  test cases.
- **ReviewDev UI Quality section** — new `### UI Quality & Accessibility` review block
  in Step 4. Checks interactive state completeness against `fe/VISUAL_QUALITY.md`,
  ARIA compliance against `fe/ACCESSIBILITY.md`, motion safety (`prefers-reduced-motion`),
  and colour token correctness. Each failure is graded: missing ARIA or keyboard trap →
  **Critical**; missing interactive state or missing `prefers-reduced-motion` override →
  **Important**. Only runs when frontend files are changed and the docs exist.
- **FinishQa accessibility/visual gate upgraded** — the existing Accessibility gate now
  loads `fe/ACCESSIBILITY.md` and `fe/VISUAL_QUALITY.md`, checks contrast ratios,
  ARIA, focus visibility, automated axe scan (if available), and interactive state
  completeness. Gate severity: fail blocks Done.

### Changed
- TrainDocs document count corrected and updated: **37 documents** (was labelled 25
  in the command file despite the manifest having 35; now correctly 37 after the two
  new `fe/` documents). `commands/TrainDocs.md` description and output line updated.
  README command table and TrainDocs section updated.
- `fe/` subdirectory grows from 3 to **5 documents**: `STYLING_MICRO_STANDARDS.md`,
  `HOOKS_DEEP_RULES.md`, `DEPENDENCIES_WORKFLOW.md`, `ACCESSIBILITY.md`,
  `VISUAL_QUALITY.md`.

---

## [1.1.0] — 2026-06-22

### Added
- **`/evyasys:Update` command** — check installed version vs. latest on GitHub, see
  changelog highlights, manage context compression (update / enable / disable / keep),
  then run 3 commands to complete the update. Project config, credentials, and docs
  are never touched.
- **`/evyasys:Repair` command** — full clean reinstall for broken plugin installs.
  Clears plugin cache and marketplace dirs, removes plugin entries from Claude Code
  settings, then shows 4-step reinstall sequence. Project config, credentials, docs,
  board artefacts, and compression preferences are never touched.
- **Plugin path resolution in all 10 delivery commands** — commands now locate the
  plugin's installed `.ai/` directory at runtime (via bash on macOS/Linux, PowerShell
  on Windows) and read workflow files from that absolute path. Prevents stale project-
  level `.ai/` folders from shadowing the plugin's current workflow files. Falls back
  to relative `.ai/` if a specific file is not found in the installed version.
- **`PowerShell` in `allowed-tools`** — all 10 delivery commands now include
  `PowerShell` alongside `Bash` so agents can run the plugin-dir locator on Windows.
- **Compression consent model** — Setup now asks the user once whether to enable
  context compression (Y/N). Preference is saved to `~/.evyasys/settings.json` on the
  local machine. Never asked again on re-run (returns "keep"). Never reset by plugin
  updates, reinstalls, or Repair.
- **Compression version tracking** — `~/.evyasys/settings.json` stores the installed
  `headroom-ai` version and last-updated timestamp. `/evyasys:Update` shows the before/
  after version when upgrading the compression engine.
- **`scripts/lib/compress-settings.js`** — new library for reading/writing
  `~/.evyasys/settings.json` with deep-merge so unrelated keys are never clobbered.
- **Release Notes / PDF branding in Setup** — Step 3 of the Setup wizard now optionally
  collects company name, logo path, brand colour, output directory, and release naming
  convention. All saved to `project.yaml`.

### Changed
- **`scripts/lib/ensure-compress.js`** fully rewritten — `isMcpRegistered()` scans
  `~/.claude/settings.json` mcpServers values for any entry with `headroom` in the
  command (robust to any key name). `ensureCompress()` has correct fast-path when
  already installed. Catch block distinguishes "already registered" from real failures.
  `updateCompress()` and `disableCompress()` added. All exports are stable.
- Setup compress block now supports `"enable"` / `"disable"` / `"keep"` preferences and
  shows the appropriate confirmation message for each case.
- Update hook reads `<!-- EVYACOMPRESS update|disable|skip -->` marker output by the
  Update agent and acts on it with explicit user consent — never changes compression
  state silently.
- README "Context compression" section corrected: was "fully automatic, no questions"
  (wrong); now documents the one-time opt-in consent model accurately.
- README Troubleshooting table: added row for stale `.ai/` folder shadowing issue with
  fix command (`rm -rf .ai` / `Remove-Item -Recurse .ai`).
- Command count in README updated to 12 (added Update and Repair).

### Fixed
- Update hook no longer imports unused `getCompressState` — dead import removed.
- Repair hook message corrected: no longer falsely states "compression re-activates on
  next Setup run" (wrong — Setup only asks if no compress key exists, and `settings.json`
  survives Repair). Now says "Run `/evyasys:Update` to manage compression after reinstalling."
- Compression question in Update now fires AFTER the user confirms the update (Step 3),
  not before (was Step 2 in the old flow — confusing order fixed).
- Setup confirmation table (Step 4) now includes a Context Compression row only when the
  preference is being changed (`"enable"` or `"disable"`); row is omitted for `"keep"`.

---

## [1.0.0] — 2026-06-20

First public release. MIT licensed and open to all teams.

### Added
- **Context compression** — automatic 40–70% token reduction for `/evyasys:ReviewDev`,
  `/evyasys:CreateSubtask`, and `/evyasys:StartDev` batch via `headroom-ai[mcp]`.
  Installed silently during `/evyasys:Setup` when Python 3.8+ is available. Setup now
  detects Python, asks user preference (auto / install later / skip), and activates
  compression accordingly. Auto-bypasses if Python unavailable — no quality impact.
- **Multi-story and epic StartDev** — `/evyasys:StartDev` now accepts multiple story IDs,
  epic IDs, or any mix (e.g. `EP-001 EVYA-1042 EVYA-1043`). Epic IDs auto-expand to
  all constituent stories before processing begins.
- **TrainDocs update-mode** — re-running `/evyasys:TrainDocs` on an existing project
  extends and improves docs without removing valid rules or reducing coverage.
  Separately tracks created vs updated files in the run summary.
- **Code grouping and function comment standards** — STANDARDS.md §21 (code regions/
  grouping) and §22 (function comment rules) added for better code visibility and
  maintainability.
- **MIT License** — `LICENSE` file added; open for public use by any team.
- **CHANGELOG.md** — version history maintained from this release forward.

### Changed
- TrainDocs generates **35 quality-gate documents** (was 25); 10 additional micro-standard
  documents added covering frontend, backend, testing, and deployment patterns.
- **STANDARDS.md fully language-agnostic** — all JavaScript/Python-specific sections
  replaced with cross-language principles and an official style guide authority table.
  Works for any tech stack.
- Setup closing message correctly references 35 documents.
- StartDev no-args prompt now accepts story IDs, epic IDs, or a mix.
- `EVYASYS_COMPRESS=0` escape hatch for compression; `EVYASYS_HEADROOM` removed.

### Removed
- All SuperPower methodology references replaced with Evyasys-native quality framing
  across README, CLAUDE.md, PROMPT.md files, and command descriptions.

---

## [0.2.0] — prior release

Internal release — Azure DevOps + Teams integration, PDF release notes,
email/WhatsApp/Slack notification support, dry-run mode.

---

## [0.1.0] — initial release

Initial private release — core delivery pipeline (CreateStory → CreateSubtask →
StartDev → ReviewDev → FinishDev → StartQa → FinishQa).
