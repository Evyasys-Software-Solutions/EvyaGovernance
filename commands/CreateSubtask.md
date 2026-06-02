---
description: Batch-decompose stories and epics into developer-ready tasks — load shared context once, analyse code across all stories, single consolidated plan approval, then generate 3–7 implementation tasks + mandatory QA task per story with cross-story dependency analysis and a single combined notification.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: <StoryID|EpicID>...  e.g. EVYA-1042 EVYA-1043  or  EP-001
skill: evyasys-create-subtask
---

You are running **/evyasys:CreateSubtask $ARGUMENTS**.

Story or epic IDs are **mandatory**. Load and follow `.ai/workflows/create-subtask/PROMPT.md` exactly — Step 0 handles the input gate, session context check, and confirmation before any analysis begins.
