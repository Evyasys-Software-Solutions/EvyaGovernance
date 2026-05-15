# Self-review checklist (subtasks)

Run every item before showing output. Fix silently if any fail.

## Structure

- [ ] Between 4 and 8 tasks total (3–7 implementation tasks + 1 mandatory QA task).
- [ ] Strategy A/B/C was presented and explicitly confirmed by the user before tasks were written.
- [ ] Each task has a unique title.
- [ ] Every AC from the parent story is referenced by at least one task.
- [ ] Dependencies between tasks are explicit (`Depends on: Task N` or `None`).
- [ ] The final task is titled "QA: Test Scenarios & Playwright Automation".

## Functional headlines

- [ ] Every implementation task headline is functional and outcome-focused.
- [ ] No headline contains a class name, method name, endpoint path, or file path.
- [ ] Headlines are readable by a non-developer.

## Technical Analysis (per implementation task)

- [ ] At least one specific file path named for every task (no "the service layer").
- [ ] Method or function signatures specified for key changes (name + params + return type if relevant).
- [ ] DB changes described: table, column, type, constraint, migration filename (if applicable).
- [ ] API contract described: verb + path + request shape + response shape + status codes (if applicable).
- [ ] Edge cases named explicitly — not "handle errors" but which field, which condition, which behaviour.
- [ ] Security / validation layer specified where user input is involved.
- [ ] Performance consideration noted for any data-reading or data-writing task.
- [ ] No task contains "update the service", "add logic", or other hand-waving without specifics.

## Test coverage (per implementation task)

- [ ] Test file path named (not just "add unit tests").
- [ ] At least one specific test case described with assertion (`should X when Y — assert Z`).

## QA task

- [ ] Test scenarios table has at minimum one row per category: Happy Path, Positive, Negative, Edge/Corner, Regression.
- [ ] Every UI-facing AC has at least one Playwright scenario marked "Yes".
- [ ] Playwright spec file path named (`tests/e2e/<storyId>.spec.ts`).
- [ ] Locator strategy stated (data-testid or ARIA role).

## No business language in tasks

- [ ] No task body contains business context that belongs in the story (roles, business rules, workflow descriptions).
- [ ] Tasks describe HOW to build, not WHY it is needed.
