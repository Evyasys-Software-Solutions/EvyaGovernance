# Finish-Dev (Definition of Done) checklist

## Code completeness
- [ ] Every AC has at least one passing automated test.
- [ ] All linters and type checks pass on the branch.
- [ ] No outstanding TODO/FIXME tagged with this StoryID.
- [ ] No debug statements, console.log, print, or breakpoints left in production paths.

## Architecture compliance
- [ ] No cross-layer violations — ARCHITECTURE.md layer boundaries respected throughout.
- [ ] All new files placed in the correct module/folder per STANDARDS.md naming rules.
- [ ] All new patterns follow approved patterns from PATTERNS.md, or deviation is documented in DECISIONS.md.
- [ ] No hardcoded config values — all configuration sourced from env vars or config files.

## Code quality — non-dirty code
- [ ] No function longer than 40 lines of logic.
- [ ] No nesting depth greater than 3 levels.
- [ ] No duplicated blocks of more than 6 lines.
- [ ] No dead code, commented-out blocks, or leftover debug code.
- [ ] No misleading or ambiguous names — every identifier means what it says.
- [ ] Error handling follows ERROR_HANDLING.md taxonomy and log format.

## Domain-specific (check applicable areas based on story Impacted Areas flags)
- [ ] **Security**: if story touched auth/permissions/data — SECURITY.md rules verified throughout the diff.
- [ ] **API**: if story added/changed endpoints — response format and error codes match API_STANDARDS.md.
- [ ] **Database**: if story touched DB — migrations named correctly, no N+1 introduced, indexes added.
- [ ] **Frontend/UX**: if story touched UI — design tokens used, component structure follows FRONTEND.md.
- [ ] **Performance**: if story touched a hot path — response time within budget from PERFORMANCE.md.

## Process
- [ ] Code review approved by at least one other engineer.
- [ ] Feature flag default state confirmed (off for risky or incremental changes).
- [ ] Rollback plan documented in the PR description (or "N/A — purely additive").
- [ ] Dev Summary saved to story folder under `.evyasys/board/`.

## Architect gate
- [ ] "Docs to update" table in Dev Summary is fully filled.
- [ ] Any "Yes" rows are scheduled: retrain command noted or specific doc update committed to.
- [ ] If new ADR required: stub created in DECISIONS.md before this story moves to QA.
