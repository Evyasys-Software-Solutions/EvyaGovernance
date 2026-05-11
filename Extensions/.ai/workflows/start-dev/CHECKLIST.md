# Start-Dev Checklist

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

- [ ] Brainstorm saved to `docs/stories/<id>_TechBrainstorm.md`
- [ ] User explicitly approved GO before any ADO state transition
