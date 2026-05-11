# Questioning Strategy — StartQa

Ask one question at a time. Wait for the answer before asking the next.
Only ask when a missing detail would produce a wrong, untestable, or unexecutable test plan.

## When to ask (priority order)

1. **Test environment** — "Which environment will QA run against?
   (a) Local dev  (b) Staging  (c) Both  (d) Other — describe"
   Ask if not stated in the story or dev summary. The test plan's Environment section
   depends on this.

2. **Test data** — "Is test data already available, or does QA need to create it?
   (a) Existing seed data is sufficient  (b) New fixtures are needed — I'll note what's required
   (c) A sandbox account is needed — I'll flag this"
   Ask if the story involves user-specific, permission-specific, or stateful data.

3. **Known flaky areas** — "The diff touches `<module>`. Are there any known flaky tests
   or fragile integrations in that area I should flag as watch-outs?"
   Ask once, broadly, after reading the dev summary.

4. **Browser / device matrix** — "Should the test plan cover mobile, specific browsers,
   or accessibility tools? (a) Desktop browser only  (b) Mobile too  (c) Full matrix — list them"
   Ask only if the story affects UI.

5. **Regression scope** — "The dev summary flags `<file>` as high-risk. Should I add
   full regression coverage for the surrounding module, or limit to the changed paths?"
   Ask if regression scope is genuinely ambiguous.

## When NOT to ask

- Never ask more than one question per message.
- Never ask about things stated in the story, dev summary, or brainstorm.
- Never ask about non-functional areas clearly marked N/A in the story.
- Never ask open-ended questions — always provide labelled options.

## Preferred format

```
Before I write the test plan, one quick question:
[question with labelled options (a), (b), (c)]
```

## Hard gate

Do NOT write any test cases until environment and test data are confirmed.
A test plan without an executable environment is not a test plan.
