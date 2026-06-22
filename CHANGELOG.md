# Changelog

All notable changes to EvyaGovernance are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking change or significant new capability
- **MINOR** — new feature, backward compatible
- **PATCH** — bug fix or documentation update

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
