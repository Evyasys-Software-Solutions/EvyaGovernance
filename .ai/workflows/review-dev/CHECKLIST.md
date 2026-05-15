# Review-Dev Checklist

## Before showing the report

### Context loading (Step 0 — must complete before reading the diff)
- [ ] `.ai/rules/*.md` read in full — every rule noted as active constraint
- [ ] `.evyasys/rules/*.md` read in full — project overrides applied (win over plugin rules)
- [ ] `.evyasys/project.yaml` read — naming conventions and work-item types noted
- [ ] `.evyasys/workflows/review-dev/*.md` checked — project-specific review instructions applied if present
- [ ] `<id>_TechBrainstorm.md` read — agreed approach identified and recorded in report
- [ ] Prior `<id>_CodeReview*.md` checked — previously flagged items re-verified

### Scope & Reading
- [ ] Read the story ACs in full — not just the title
- [ ] Read the complete diff (not just --stat)
- [ ] Read the full content of every changed file (not just the diff chunk)
- [ ] Every Critical/Important finding cites a specific file path and line number

### AC Coverage
- [ ] Every AC has been checked — either a test found, or flagged Critical
- [ ] Unit tests verify real behaviour, not just mock chains

### Brainstorm Alignment
- [ ] Implementation matches the approach agreed in the TechBrainstorm
- [ ] No undocumented deviation from the agreed technology or design decisions

### Architecture & Structure
- [ ] Architectural layer boundaries checked for every changed file — no cross-layer leaks
- [ ] New files/classes land in the correct module and folder
- [ ] Existing interfaces and contracts not silently broken
- [ ] Single Responsibility checked — no God functions or God class additions
- [ ] Consistency checked — searched codebase for the same pattern; divergence flagged

### Standard Practices
- [ ] Every rule from `.ai/rules/*.md` checked — violation raised at Important minimum, rule name cited
- [ ] Every rule from `.evyasys/rules/*.md` checked — same severity
- [ ] Naming conventions (`naming.md` + `project.yaml`) verified for all new identifiers
- [ ] No magic numbers or hardcoded strings that belong in constants or config
- [ ] Error handling style consistent with the rest of the module
- [ ] No mixed concerns (format + logic + persistence in one function)

### Scalability
- [ ] No DB query or expensive I/O inside a loop
- [ ] No unbounded scan on a collection that will grow
- [ ] New interfaces are extendable without requiring breaking changes in callers

### Dirty Code
- [ ] No function > 40 lines of logic
- [ ] No nesting depth > 3
- [ ] No duplicated block > 6 lines
- [ ] No dead or commented-out code
- [ ] No misleading names

### General
- [ ] YAGNI check done — unused code searched with grep before flagging as missing
- [ ] Diff scope checked — files outside expected scope identified
- [ ] Debug/console.log/TODO/FIXME markers checked
- [ ] Security entry points verified (auth, input validation, secrets)
- [ ] No performative language ("great implementation", "looks good") — findings only

## Before issuing GO

- [ ] All Critical items either fixed (with evidence) or formally waived by the user
- [ ] Important items addressed or deferred with documented justification
- [ ] Architecture & Code Health table is fully filled in (no blank Status cells)
- [ ] Re-diff run after fixes to confirm changes are actually there
- [ ] Report saved to story folder under `.evyasys/board/`
