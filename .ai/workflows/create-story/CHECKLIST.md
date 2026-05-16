# Create Story Checklist

## Architecture domain flags (Impacted Areas)
- [ ] Security flag set if story involves auth, permissions, PII, tokens, or sensitive data
- [ ] DB flag set if story involves schema changes, migrations, queries, or data model changes
- [ ] Frontend flag set if story involves UI, pages, forms, modals, or visual changes
- [ ] API flag set if story involves new or changed endpoints or request/response shapes
- [ ] Performance flag set if story involves hot paths, bulk operations, or response time SLAs
- [ ] Every flag decision is defensible — no flag omitted "for simplicity"

## Inputs
- [ ] Source inputs collected
- [ ] Local repo scanned for existing patterns relevant to this story
- [ ] Impacted areas identified and domain flags set (see above)
- [ ] Prerequisites validated

## Story content
- [ ] Roles identified
- [ ] Workflow steps written
- [ ] Scenarios written
- [ ] Acceptance criteria written — each AC is independently testable
- [ ] Dependencies listed
- [ ] Breaking changes listed (or explicitly "None")
- [ ] Out of scope listed
- [ ] Assumptions listed
- [ ] Open questions listed

## Quality bar
- [ ] No technical implementation details present (the "how" belongs in TechBrainstorm)
- [ ] No invented business rules (only what the user stated or what is derivable from context)
- [ ] Each AC uses the format: "Given ... When ... Then ..." or an unambiguous declarative form
- [ ] Story is actionable by Dev, QA, and DevOps independently — no hidden context required

## Process
- [ ] Self-review completed
- [ ] User confirmation requested before the story is pushed to the board
