---
description: Scan the project and generate plain-language functional documentation for each business module into .evyasys/docs/functional/ — covering entities, access and permissions, validations, actions, business logic, workflows, error scenarios, and integration points. Structured for RAG retrieval so each section answers end-user queries independently. Use --all for all detected modules, a module name for a single module, or --update <ModuleName> to extend an existing doc without removing valid content.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, PowerShell
argument-hint: [ModuleName | --all | --update ModuleName]
skill: evyasys-create-functional-docs
---

You are running **/evyasys:CreateFunctionalDocs $ARGUMENTS**.

## Step 0 — Load workflow

**First — find the plugin's installed workflow directory** (do this before any file read):

macOS / Linux — run via **Bash**:
```bash
EVYA_AI=$(find "$HOME/.claude/plugins" -maxdepth 6 -type d -name ".ai" 2>/dev/null | grep -i "EvyaGovernance" | head -1); [ -z "$EVYA_AI" ] && EVYA_AI=".ai"; echo "$EVYA_AI"
```

Windows — run via **PowerShell**:
```powershell
$EVYA_AI = (Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter ".ai" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Select-Object -First 1 -ExpandProperty FullName); if (-not $EVYA_AI) { $EVYA_AI = ".ai" }; Write-Output $EVYA_AI
```

Use the printed path in place of `.ai` for every workflow file read below.
If a file is not found at the plugin path (older install), fall back to the same path under `.ai/`.

Load these three files from `<plugin-ai>/workflows/create-functional-docs/`:
1. `AGENT.md` — your role and principles
2. `PROMPT.md` — the full workflow
3. `MODULE_TEMPLATE.md` — the document template

Then follow the workflow in `PROMPT.md` exactly.
