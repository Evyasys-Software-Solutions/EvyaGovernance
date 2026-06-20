# Changelog

All notable changes to EvyaGovernance are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH`

- **MAJOR** — breaking change or significant new capability
- **MINOR** — new feature, backward compatible
- **PATCH** — bug fix or documentation update

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
