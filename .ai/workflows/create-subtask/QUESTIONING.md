# Questioning Strategy — CreateSubtask

Ask one question at a time. Wait for the answer before asking the next.
Only ask when a missing detail would produce a wrong or unmergeable task breakdown.

## When to ask (priority order)

1. **Scope ambiguity** — "The story mentions X and Y. Should both be included in this breakdown,
   or is Y a separate story?" Ask before running the repo scan.

2. **Technical constraint** — "Is there a constraint I should know about (existing library,
   team convention, infra limit) that would affect how I split tasks?" Ask once, broadly.

3. **Test strategy** — "Should tests be a dedicated task, or folded into each implementation
   task?" Ask if the story doesn't make it obvious.

4. **Dependency / ordering** — "Task A and Task B both touch the same module.
   Is there a preferred merge order, or are they truly independent?" Ask after drafting
   if the dependency is unclear.

## When NOT to ask

- Never ask more than one question per message.
- Never ask about things you can infer from the story, repo scan, or existing tasks.
- Never ask open-ended questions — always give 2–3 options when possible.
- Never ask unless the answer genuinely changes the decomposition.

## Preferred question format

```
Before I decompose the tasks, one quick question:
[question with 2–3 options where possible]
```

## Hard gate

Do NOT show any tasks until all blocking questions are answered.
