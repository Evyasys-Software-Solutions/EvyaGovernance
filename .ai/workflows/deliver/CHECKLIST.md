# Deliver Checklist

## Phase 0 — Batch load
- [ ] Story `_UserStory.md` located and read (hard stop if missing)
- [ ] Subtasks read (warn but continue if missing)
- [ ] All `.ai/rules/` and `.evyasys/rules/` loaded in one parallel batch
- [ ] Universal quality-gate docs loaded (ARCHITECTURE, RULES, STANDARDS, PATTERNS, EXTENSION_PATTERNS, ERROR_HANDLING, LOCALISATION, DTO_STANDARDS, RBAC)
- [ ] Domain docs loaded per Impacted Areas flags (Security / Frontend / API / DB / Performance)
- [ ] Functional docs loaded if `.evyasys/docs/functional/` exists
- [ ] Templates loaded (brainstorm, review, test plan, release notes)
- [ ] Load time announced (target < 10s)

## Phase 1 — Codebase probe + Gate 1
- [ ] `git rev-parse --is-inside-work-tree` verified (hard stop if not a repo)
- [ ] Base branch determined; feature branch existence checked
- [ ] Codebase probe run (repo_scan or Glob/Grep fallback)
- [ ] Ambiguity analysis excludes anything answered by the loaded standards
- [ ] **All** clarifying questions batched into a single message (never one-at-a-time)
- [ ] If no genuine ambiguities → Gate 1 auto-skipped with announcement
- [ ] User answers captured; ambiguous answers replaced with standards-driven defaults (recorded as assumptions)

## Phase 2 — Architecture + Gate 2
- [ ] Architecture reference scan located 2–3 similar implementations
- [ ] Reference files recorded for the DevSummary
- [ ] Brainstorm contains max 3 options, each showing follow/deviate from reference
- [ ] Recommendation stated with 1-sentence "why" and 1-sentence "top risk"
- [ ] User approval captured before Phase 3 starts

## Phase 3 — Development
- [ ] Change plan announced before any file is written (file list + purpose + est. LoC)
- [ ] Every new/modified file follows the loaded standards (traceable to a specific doc)
- [ ] Base classes / wrappers extended, never re-implemented
- [ ] No hardcoded user-facing strings (use enums / locale files)
- [ ] DTOs used at every boundary
- [ ] Auth + permission checks in middleware, not view
- [ ] Frontend files: all required states implemented + WCAG compliance + `prefers-reduced-motion`
- [ ] Progress announced per file (`[K/N] path — Y lines`)
- [ ] No git commands run (no `git add`, no `git commit`, no `git checkout`) — all changes remain in the working tree

## Phase 4 — Self review
- [ ] Full ReviewDev criteria run against every changed file
- [ ] Auto-fix attempted up to 2 iterations for Critical findings
- [ ] `<id>_CodeReview.md` generated in memory with severity-graded findings
- [ ] Verdict set: SUCCESS (0 Critical) / PARTIAL (0 Critical, some Important) / BLOCKED (Critical remains)

## Phase 5 — Test plan
- [ ] ≥ 1 positive + 1 negative test per AC
- [ ] ≥ 2 edge cases per major workflow branch
- [ ] 1 regression check per file touched
- [ ] Non-functional checks for Security/Performance/Accessibility/DB as flagged
- [ ] `<id>_TestPlan.md` generated in memory (tests NOT executed here)

## Phase 6 — Docs queue
- [ ] Docs-to-update list built based on introduced patterns / schemas / permissions
- [ ] List recorded in DevSummary; no doc updated here (deferred to `/evyasys:TrainDocs --retrain`)

## Phase 7 — DevSummary
- [ ] DevSummary lists ACs met, files touched, tests added, manual QA hints, docs to update, assumptions, standards deviations
- [ ] ReleaseNotes NOT drafted here — FinishQa owns that artefact after QA sign-off

## Phase 8 — Gate 3
- [ ] Summary shows counts (files, tests, LoC delta) and all quality-gate outcomes
- [ ] Docs-to-update list surfaced
- [ ] Assumptions from Gate 1 surfaced
- [ ] User given clear approve / abort / show-diff / show-artefact options
- [ ] If BLOCKED, options are: fix / override / abort — never silent proceed

## Phase 9 — Hook actions (structured output)
- [ ] Per-story `<!-- EVYADELIVER: EVYA-XXXX { ... } -->` block emitted with all required fields
- [ ] `filesChanged` lists every touched file with status (for traceability + summary counts)
- [ ] `artefacts` contains exactly 4 markdown bodies: TechBrainstorm, DevSummary, CodeReview, TestPlan (never ReleaseNotes)
- [ ] `qualityGates.verifier` truthfully reflects the anti-hallucination fact-check outcome
- [ ] Batch manifest `<!-- EVYADELIVERBATCH { ... } -->` appended once at the end with `commitEnabled` set
- [ ] `featureBranch` and `commitMessage` fields ONLY present when `--commit` was in `$ARGUMENTS`; omitted otherwise
- [ ] No git operations attempted by the agent itself — the hook handles that if `commitEnabled` is `true`

## Phase 10 — Status report
- [ ] Per-story status printed (files, tests, commit SHA, PM state, notification target)
- [ ] Next steps clearly listed (git diff · git push · /evyasys:StartQa)
- [ ] Batch total printed if multiple stories

## Speed contract
- [ ] Small story (≤ 5 files) end-to-end under 5 minutes
- [ ] Medium story (6–15 files) end-to-end under 15 minutes
- [ ] Large story announced up-front with offer to split
