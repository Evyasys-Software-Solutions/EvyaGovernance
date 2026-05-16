# Start-Dev Checklist

## Step 0 — Context loading (complete before reading the story)

- [ ] `CLAUDE.md` read from project root — architecture layers and quality rules extracted
- [ ] `.ai/rules/*.md` loaded — plugin-level standards noted
- [ ] `.evyasys/rules/*.md` loaded (or confirmed absent)
- [ ] `.evyasys/docs/` checked — `ARCHITECTURE.md`, `RULES.md`, `STANDARDS.md`, `PATTERNS.md`, `ERROR_HANDLING.md` loaded if present
- [ ] `<id>_UserStory.md` Impacted Areas flags read — domain docs loaded: SECURITY.md / DB_STANDARDS.md / FRONTEND.md / DESIGN_SYSTEM.md / API_STANDARDS.md / PERFORMANCE.md as flagged
- [ ] Standards compliance scan run (Step 0d) — either "no conflicts" noted or user responded to the compliance report
- [ ] If conflicts found: user chose (a), (b), or (c) — their decision carried into Phase 1
- [ ] `.evyasys/board/**/<id>/` located via Glob
- [ ] `<id>_UserStory.md` confirmed present (abort if missing)
- [ ] `<id>_Subtasks.md` status noted (missing = Gate 1 will fail)
- [ ] `<id>_TechBrainstorm.md` checked — resuming or fresh (confirmed with user if present)
- [ ] `<id>_DevSummary.md` checked — user informed if already developed
- [ ] Pre-flight artefact table shown before proceeding

## Phase 1 — Brainstorm

- [ ] Story and all subtasks read in full before forming any opinion
- [ ] Business outcome summarised in plain language (no implementation detail)
- [ ] Repo scan run — affected modules and risk areas listed
- [ ] At least 3 meaningfully distinct implementation approaches generated
- [ ] Each approach has at least 2 specific pros and 2 specific cons
- [ ] Estimate delta noted for each approach (S / M / L)
- [ ] A single recommended approach stated with a clear deciding reason
- [ ] Top risk of the recommendation named with a mitigation
- [ ] Open questions listed (if any)
- [ ] Brainstorm shown to team in BRAINSTORM_TEMPLATE.md format
- [ ] Team response received — approach agreed or alternative chosen
- [ ] If alternative chosen, recommendation updated accordingly

## Phase 2 — Gates

- [ ] Subtasks file exists and is non-empty (Gate 1)
- [ ] Branch name found and matches naming convention (Gate 2)
- [ ] Draft PR confirmed or exception noted with reason (Gate 3)
- [ ] Definition of Ready re-run line by line against current story (Gate 4)
- [ ] All dependencies checked — status confirmed for each (Gate 5)
- [ ] Gate table produced with overall GO / NO-GO verdict

## Post-approval

- [ ] Brainstorm saved to story folder under `.evyasys/board/`
- [ ] User explicitly approved GO before any ADO state transition
