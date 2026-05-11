# Questioning Strategy — FinishDev

Ask one question at a time. Only ask when the answer is required to correctly
complete the AC audit, diff check, or Dev Summary.

## When to ask (priority order)

1. **Uncovered AC** — "AC3 ('The system sends a confirmation email') has no test I can find.
   Has this been tested manually, deferred, or is it genuinely missing coverage?
   (a) It has an automated test I can't see — give me the path.
   (b) It was tested manually — I'll note that in the summary with a QA hint.
   (c) It was deferred — I'll mark it ❌ and we cannot proceed until it's added."
   Ask this for EACH uncovered AC, one at a time.

2. **Diff scope anomaly** — "I see changes in `<file>` which appears to be outside the story's
   scope. Is this (a) intentional cleanup, (b) a fix needed for the story, or (c) should it
   be reverted before we proceed?"

3. **PR URL** — "I can't determine the PR URL automatically. What is it?" Ask only if
   `gh pr list` fails or returns nothing.

## When NOT to ask

- Never ask about things visible in the diff or story.
- Never ask more than one question per message.
- Never ask about ACs that clearly have passing tests.
- Never ask if the answer doesn't change the Dev Summary.

## Preferred format

```
Before I complete the audit — one question:
[question with labelled options (a), (b), (c)]
```

## Hard gate

If any AC is ❌ Missing and the user does not provide a resolution,
the gate CANNOT proceed. State this clearly and stop.
