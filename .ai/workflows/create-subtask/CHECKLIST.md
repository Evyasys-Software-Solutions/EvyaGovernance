# Self-review checklist (subtasks)

Run every item before showing output. Fix silently if any fail.

## Project standards compliance (check first)

- [ ] `.evyasys/docs/` loaded before decomposition began (if directory exists)
- [ ] No task's Technical Guidance proposes code in the wrong architectural layer (ARCHITECTURE.md)
- [ ] Every task uses the approved pattern from PATTERNS.md where one exists for this feature type
- [ ] No task violates a hard "never do" rule from RULES.md
- [ ] File paths and identifiers in Technical Guidance follow naming conventions from STANDARDS.md

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

## No-code rule (check before anything else)

- [ ] No code blocks (back-tick fences of any language) appear anywhere in any task body.
- [ ] No SQL DDL/DML syntax written — DB schema described as plain specifications (table / column / type / constraint) only.
- [ ] No inline implementation logic — no `if/else`, loops, throw statements, or any code-like construct.
- [ ] No pseudo-code that mimics implementation.
- [ ] Function and method references are behaviour contracts, not implementations: "`processX(input)` — validates and persists, returns created ID" not "`processX(x) { return db.save(x); }`".

## Technical Guidance (per implementation task)

- [ ] At least one specific file path named for every task (no "the service layer").
- [ ] Function or method reference includes expected behaviour (what it does, what it returns, when it throws) — not implementation code.
- [ ] DB schema changes described: table, column name, type, constraint, migration filename — no SQL syntax.
- [ ] API contract described: verb + path + request shape + response shape + status codes (if applicable).
- [ ] Business rules and workflow explicitly stated for every rule the developer must honour.
- [ ] Edge cases named explicitly — which field, which condition, which expected behaviour.
- [ ] Security / validation layer specified where user input is involved.
- [ ] Performance consideration noted for any data-reading or data-writing task.
- [ ] No task contains "update the service", "add logic", or other hand-waving without specifics.

## Test coverage (per implementation task)

- [ ] Test file path named (not just "add unit tests").
- [ ] At least one specific test case described with expected result — plain language, no code assertions.

## QA task

- [ ] Test scenarios table has at minimum one row per category: Happy Path, Positive, Negative, Edge/Corner, Regression.
- [ ] Every UI-facing AC has at least one Playwright scenario marked "Yes".
- [ ] Playwright spec file path named (`tests/e2e/<storyId>.spec.ts`).
- [ ] Locator strategy stated (data-testid or ARIA role).

## EVYASUBTASKBATCH manifest

- [ ] `inputMode` is `"story"` or `"epic"` — not missing or null.
- [ ] When `inputMode` is `"epic"`, `epicGroups` is a non-empty array and every story ID in `stories` appears in exactly one epic group (use `"_standalone"` for standalone story IDs in a mixed invocation).
- [ ] When `inputMode` is `"story"`, `epicGroups` is an empty array `[]`.
- [ ] Every story object has `storyId`, `title`, `epicId`, `taskCount`, and `keyAreas` (2–4 items, short identifiers only).
- [ ] `taskCount` in each story matches the number of `## Task N` headers emitted in the corresponding `EVYA_SUBTASKS` block.

## Guidance quality

- [ ] Tasks describe WHAT the system must do and the expected behaviour — not how to implement it in code.
- [ ] Business rules and workflow descriptions are included where they constrain the implementation (these belong in tasks, not just in the story).
- [ ] No task duplicates user-story-level rationale ("as a user I want…") — that belongs in the story file, not the task body.
