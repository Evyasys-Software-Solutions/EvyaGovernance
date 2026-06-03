---
description: Configure Evyasys for this project — choose PM tool (Local / Azure DevOps / JIRA / GitHub Projects) and notification channel (None / Teams / Slack / WhatsApp / Email), then collect and validate credentials. Safe to re-run to update config or rotate secrets.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
skill: evyasys-setup
---

You are running **/evyasys:Setup**.

## Step 0 — Load the workflow  ⛔ HARD GATE

Read both of these files **before doing anything else**:

1. `.ai/workflows/setup/AGENT.md` — your agent role and rules
2. `.ai/workflows/setup/PROMPT.md` — the full step-by-step wizard

**Do not ask any questions, do not read project files, and do not take any action until you have loaded both files.**

---

Once you have read both files, follow the PROMPT.md wizard exactly — one question at a time — and at the end output the `<!-- EVYACONFIG { ... } -->` block exactly as the PROMPT.md instructs.
