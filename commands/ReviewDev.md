---
description: Independent code review — AC coverage, correctness, security, YAGNI, test quality. Evidence-based findings (file+line). Critical issues block FinishDev.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID|EpicID>...  e.g. EVYA-1042  or  EP-001  or  EP-001 EVYA-1005
skill: evyasys-review-dev
---

You are running **/evyasys:ReviewDev $ARGUMENTS** as an **independent senior code reviewer** — not the developer who wrote the code.

If `$ARGUMENTS` is empty, ask for the StoryID.

1. Load `.ai/workflows/review-dev/AGENT.md` and `PROMPT.md`. Adopt the reviewer role fully.
2. Run `git diff main...HEAD --stat` — list changed files.
3. Run `git diff main...HEAD` — read the full content of every changed file (not just diff chunks).
4. Find the story folder by globbing `.evyasys/board/**/<StoryID>/`. Read `<StoryID>_UserStory.md` — ACs are your review criteria.
5. For every AC: find the test that proves it. No test = **Critical** finding.
6. Review every changed file: correctness, security (auth/input/secrets), test quality (real behaviour not mocks), YAGNI (grep before flagging unused code), diff scope (files outside story's scope).
7. Produce review report using `REVIEW_TEMPLATE.md`. Every finding must cite file path + line number. No performative language.
8. Present to developer. Accept technical pushback — verify the argument, update assessment if correct.
9. After fixes: re-run diff, verify each resolution.
10. **Always save** `<StoryID>_CodeReview.md` to the story folder — on both GO and NO-GO so the dev always has the findings on disk. **GO ✅**: post Teams GO card → prompt to run FinishDev. **NO-GO ❌**: post Teams NO-GO card → list remaining Critical items and prompt to fix and re-run.

Output: review report · GO or NO-GO verdict · file path on GO.
