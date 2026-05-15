# Questioning Strategy — CreateSubtask

Ask one question at a time. Wait for the answer before asking the next.
Only ask when a missing detail would produce a wrong or unmergeable task breakdown.

## When to ask (priority order)

1. **Scope ambiguity** — "The story mentions X and Y. Should both be in this breakdown,
   or is Y a separate story?" Ask before running the repo scan.

2. **Technical constraint** — "Is there a constraint I should know about (existing library,
   team convention, infra limit, deprecated pattern) that affects how I split tasks?"
   Ask once, broadly, before writing any tasks.

3. **Codebase gap** — "I cannot find the existing handler for X. Does it live in
   `<path>`, or is it new work?" Ask if the repo scan returned nothing for a key
   module the story clearly requires.

4. **Playwright scope** — "Are there non-UI ACs (background jobs, API-only endpoints)
   where Playwright automation is not applicable?" Ask only if the story has no UI
   and it is genuinely unclear. Determines which QA table rows get `Playwright? = No`.

5. **Dependency / ordering** — "Tasks A and B both touch `<file>`.
   Is there a preferred merge order, or are they truly independent?"
   Ask after drafting if the dependency is unclear.

## Strategy selection (Step 4 — not this step)

The three strategies (A / B / C) are presented in Step 4 after the repo scan,
not as a pre-scan clarifying question. Do not ask about strategy here.

## When NOT to ask

- Never ask more than one question per message.
- Never ask about things you can infer from the story, repo scan, or existing code.
- Never ask open-ended questions — always give 2–3 concrete options.
- Never ask unless the answer genuinely changes the decomposition or technical analysis.

## Preferred question format

```
Before I decompose the tasks, one quick question:
[question with 2–3 options]
```

## Hard gate

Do NOT show any tasks until all blocking questions are answered.
