# Evyasys

Evyasys is a complete AI-assisted delivery pipeline for software teams — business
story, task breakdown, technical brainstorm, code review, dev sign-off, QA, and
release — driven by seven slash commands inside your AI coding agent.

Built on the same methodology as [SuperPower](https://github.com/obra/superpowers):
structured brainstorming before any code is written, independent evidence-based code
review, hard confirmation gates at every stage, and humans approving before anything
touches Azure DevOps or Teams.

---

## Installation

Three levels of setup: **Claude Code** (the AI agent), **machine-level** (once per
developer), and **project-level** (once per repo — teammates get it via `git pull`).

---

### Step 0 — Install Claude Code (prerequisite)

Evyasys runs as a plugin inside **Claude Code** — Anthropic's AI coding agent.
Install it first if you haven't already.

**macOS / Linux**
```bash
npm install -g @anthropic-ai/claude-code
```

**Windows (PowerShell)**
```powershell
npm install -g @anthropic-ai/claude-code
```

Verify:
```bash
claude --version
```

Launch from inside your project:
```bash
# macOS / Linux
cd your-project && claude

# Windows
cd your-project; claude
```

> Requires **Node.js 18+** — download from [nodejs.org](https://nodejs.org/) if needed.  
> Full Claude Code docs: [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code/getting-started)

---

### Step 1 — Install Evyasys plugin (once per machine)

**Inside Claude Code**, run these three commands:

```
/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git
/plugin install evyasys@EvyaGovernance
/reload-plugins
```

Type `/evya` — you should see 7 commands in autocomplete.

---

### Step 2 — Machine setup (once per machine)

**macOS / Linux** — saves PAT only:
```bash
evyasys=$(ls -td ~/.claude/plugins/cache/EvyaGovernance/evyasys/*/ | head -1)
bash "${evyasys}scripts/login.sh"
```

**Windows (PowerShell)** — saves PAT, ADO organisation, ADO project, and optional Teams webhook:
```powershell
$evyasys = (Get-Item "$env:USERPROFILE\.claude\plugins\cache\EvyaGovernance\evyasys\*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
powershell -ExecutionPolicy Bypass -File "$evyasys\scripts\setup.ps1"
```

The script walks you through four steps in order:

1. **PAT** — Paste your Azure DevOps Personal Access Token (input is hidden).  
   The script validates it immediately against Azure DevOps and confirms your account name.  
   If the token is invalid or expired it aborts — nothing else is asked.
2. **Organisation** — Your Azure DevOps organisation name (e.g. `contoso`).
3. **Project** — Your Azure DevOps project name (e.g. `MyApp`).
4. **Teams webhook** — Optional. Press Enter to skip; Evyasys will prompt on first command use if you skip here.

All values are saved to `~/.evyasys/credentials` — never committed to any repo.

Generate a PAT at `https://dev.azure.com/<your-org>/_usersSettings/tokens`  
Scope needed: **Work Items (Read & write)**

You can also pass any or all values as parameters — only the missing ones will be prompted interactively:
```powershell
$evyasys = (Get-Item "$env:USERPROFILE\.claude\plugins\cache\EvyaGovernance\evyasys\*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
powershell -ExecutionPolicy Bypass -File "$evyasys\scripts\setup.ps1" `
    -Pat "your-pat" `
    -Org "your-ado-org" `
    -Project "your-ado-project" `
    -TeamsWebhook "https://your-org.webhook.office.com/webhookb2/..."
```

---

### Step 3 — Configure your project (once per repo)

> **Run these commands from your project's root folder.** The template is copied
> to wherever your terminal is currently open. Confirm your location first, then copy.

**macOS / Linux**
```bash
# Confirm you are in your project root
pwd

# Copy the template (only proceed if the path above is correct)
evyasys=$(ls -td ~/.claude/plugins/cache/EvyaGovernance/evyasys/*/ | head -1)
cp -r "${evyasys}project-template/.evyasys" ./.evyasys
```

**Windows (PowerShell)**
```powershell
# Confirm you are in your project root
Get-Location

# Copy the template (only proceed if the path above is correct)
$evyasys = (Get-Item "$env:USERPROFILE\.claude\plugins\cache\EvyaGovernance\evyasys\*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Copy-Item -Recurse "$evyasys\project-template\.evyasys" ".\.evyasys"
```

Edit `.evyasys/project.yaml` with your project settings:

```yaml
# Display name shown in Teams cards — required
name: "Customer Portal"

# Azure DevOps — shared with teammates via git
# Windows users who ran setup.ps1 already have these saved at machine level.
# Set them here so the whole team picks them up via git pull.
azure_devops:
  org: "YourAzureOrg"
  project: "YourAzureProject"

# Microsoft Teams — channel that receives pipeline notifications
# Get webhook from: Teams channel → ··· → Connectors → Incoming Webhook → copy URL
teams:
  webhook: "https://your-org.webhook.office.com/webhookb2/..."
```

> **Teams webhook:** leave blank and Evyasys will prompt for it on first use and
> save it automatically. Either way it ends up in `project.yaml` for the whole team.

> **Windows users:** `setup.ps1` already saved your ADO org and project to
> `~/.evyasys/credentials`. The `azure_devops` block above is still recommended
> so teammates get those settings automatically via `git pull`.

Commit so every teammate gets the same config:

```bash
git add .evyasys/project.yaml
git commit -m "Add Evyasys config (ADO + Teams)"
git push
```

Teammates just `git pull` — no individual config needed beyond each person running `setup.ps1` (Windows) or `login.sh` (macOS/Linux) once for their own PAT.

**Teams notifications your channel receives:**

| Event | Card |
|---|---|
| Story pushed to board | 📋 New Story Ready |
| Subtasks created in ADO | 🗂️ Subtasks Ready |
| Dev started | 🚀 Dev Started |
| Code review passed | ✅ Code Review Passed |
| Dev handed to QA | 🔀 Ready for QA |
| QA test plan ready | 🧪 QA Started |
| Story released | 🚢 Released |

All notifications fire **after your approval**. A `ReviewDev` NO-GO posts nothing.

---

### Updating to the latest version

**macOS / Linux**
```bash
rm -rf ~/.claude/plugins/marketplaces
rm -rf ~/.claude/plugins/evyasys
```

**Windows (PowerShell)**
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\marketplaces" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\evyasys" -ErrorAction SilentlyContinue
```

Then **inside Claude Code**, run:
```
/plugin marketplace remove EvyaGovernance
```

Then reinstall (Step 1 above).

---

### Troubleshooting a broken install

Run the same cache-clear steps above, **fully close and reopen** Claude Code, then
run Step 1 again.

| Symptom | Fix |
|---|---|
| `claude` command not found | Install Node.js 18+ then `npm install -g @anthropic-ai/claude-code` |
| Commands don't appear | Clear cache (see above) and reinstall |
| PAT not found | Re-run Step 2 above (Windows: `setup.ps1`, macOS/Linux: `login.sh`) |
| Teams webhook missing | Run any command — it will prompt and save automatically |
| ADO 401 error | PAT expired — re-run Step 2 above |
| Missing ADO org/project | Re-run Step 2 above (Windows) or edit `.evyasys/project.yaml` |
| Wrong project loaded | Open Claude Code from inside the correct project folder |

---

## The 7 Commands

Type `/evya` in Claude Code to see all commands in autocomplete.

```
CreateStory → CreateSubtask → StartDev → ReviewDev → FinishDev → StartQa → FinishQa
```

Nothing touches Azure DevOps or Teams until you **explicitly approve**.

---

### `/evyasys:CreateStory`
**Who:** BA / Product Owner — **When:** Start of every story

Scans the repository for context, asks clarifying questions **one at a time** (never
an overwhelming list), and drafts a board-ready business story in pure business
language — zero class names, endpoints, or implementation detail. Self-reviews against
the Definition-of-Ready checklist and rewrites automatically if anything fails.

If the story belongs to an Epic, files a reference copy under `docs/epics/<epic-id>/`
and links the ADO work item to the parent Epic.

**Produces:** `<id>_UserStory.md` · ADO User Story (linked to Epic if set) · 📋 Teams

---

### `/evyasys:CreateSubtask EVYA-1042`
**Who:** Tech Lead — **When:** After story approved, before any development

Reads the full story and maps every AC. Presents **2–3 decomposition strategies**
(vertical slices / horizontal layers / spike-first) with trade-offs and waits for
team approval before writing a single task. Each task is ≤ 1 day, linked to specific
ACs, names exact modules/files, and has a clear acceptance statement a reviewer can
verify without asking the author.

**Produces:** `<id>_Subtasks.md` · ADO child Tasks · 🗂️ Teams

---

### `/evyasys:StartDev EVYA-1042`
**Who:** Engineering Lead — **When:** Sprint start, before any code is written

**Phase 1 — Brainstorm:** Generates minimum 3 meaningfully distinct implementation
approaches with specific pros, cons, and effort delta (S/M/L). Recommends one with
a clear deciding reason and top risk. Waits for team agreement before proceeding —
the agreed approach is saved to the repo so the architectural decision travels with the PR.

**Phase 2 — Gates:** Branch naming, draft PR, Definition of Ready line-by-line,
dependencies. Produces a GO / NO-GO gate table.

**Produces:** `<id>_TechBrainstorm.md` · ADO → **In Progress** · 🚀 Teams

---

### `/evyasys:ReviewDev EVYA-1042`
**Who:** Senior Developer (acting as independent reviewer) — **When:** Implementation complete

Acts as an **independent reviewer** — reads the full diff AND complete content of
every changed file. Checks every AC has a passing test (no test = **Critical**).
Reviews for correctness, security, YAGNI (runs `grep` before flagging unused code),
test quality, and diff scope. Every finding cites file path + line number. No
performative language — findings only.

The developer can push back with technical evidence. The reviewer updates the
assessment if the argument is correct.

| Severity | Meaning | Effect |
|---|---|---|
| **Critical** | Untested AC, broken logic, security hole | Blocks FinishDev |
| **Important** | Test gap, performance risk, unclear code | Should fix before QA |
| **Minor** | Style, naming | Note for later |

**Produces:** `<id>_CodeReview.md` (on GO) · ✅ Teams (GO only — silent on NO-GO)

---

### `/evyasys:FinishDev EVYA-1042`
**Who:** Developer — **When:** After ReviewDev passes

Developer sign-off gate. Finds the specific test for every AC. Asks one clarifying
question at a time for any uncovered AC — will not proceed with any unresolved ❌.
Runs the Definition-of-Done checklist, scans the diff for scope anomalies, and
produces a Dev Summary that becomes the QA team's starting document.

**Produces:** `<id>_DevSummary.md` · ADO → **Ready for QA** · 🔀 Teams

---

### `/evyasys:StartQa EVYA-1042`
**Who:** QA Engineer — **When:** Story is Ready for QA

Asks clarifying questions first (environment required, test data if stateful, flaky
areas, browser matrix for UI) before writing a single test case. Writes AC-driven
positive/negative/edge/regression/non-functional cases. Uses Gherkin for multi-step
scenarios.

**Produces:** `<id>_TestPlan.md` · ADO → **In QA** · 🧪 Teams

---

### `/evyasys:FinishQa EVYA-1042`
**Who:** QA / Release Manager — **When:** All test cases executed

Checks every TC has a recorded outcome. Stops if any P0/P1 defects remain open.
Drafts plain-language release notes — one paragraph, no jargon, bullet changelog,
known limitations, rollback plan.

**Produces:** `<id>_ReleaseNotes.md` · ADO → **Done** · 🚢 Teams

---

## Complete artefact map

```
docs/
  stories/
    EVYA-1042_UserStory.md        ← CreateStory
    EVYA-1042_Subtasks.md         ← CreateSubtask
    EVYA-1042_TechBrainstorm.md   ← StartDev
    EVYA-1042_CodeReview.md       ← ReviewDev  (GO only)
    EVYA-1042_DevSummary.md       ← FinishDev
    EVYA-1042_TestPlan.md         ← StartQa
    EVYA-1042_ReleaseNotes.md     ← FinishQa
  epics/
    EP-001/
      EVYA-1042_UserStory.md      ← reference copy when Epic is set
```

All artefacts committed to git — they travel with the code through PRs.

---

## Dry-run mode — preview without side effects

**macOS / Linux**
```bash
EVYASYS_DRY_RUN=1 /evyasys:CreateStory
```

**Windows (PowerShell)**
```powershell
$env:EVYASYS_DRY_RUN = "1"
/evyasys:StartDev EVYA-1042
```

Logs exactly what would be sent to ADO and Teams without executing anything.

---

## Per-project customisation

Override any plugin default by placing a same-named file under `.evyasys/` in your
project repo. Project files always win over plugin defaults.

| To customise | File in your project |
|---|---|
| Story naming rules | `.evyasys/rules/naming.md` |
| Definition of Ready | `.evyasys/rules/definition-of-ready.md` |
| Any workflow prompt | `.evyasys/workflows/<name>/PROMPT.md` |
| BA role definition | `.evyasys/workflows/create-story/AGENT.md` |
| Dev Lead role | `.evyasys/workflows/start-dev/AGENT.md` |
| Code Review standards | `.evyasys/workflows/review-dev/AGENT.md` |
| Business glossary | `.evyasys/memory/glossary.json` |
| Past decisions log | `.evyasys/memory/decisions.md` |
| Module knowledge | `.evyasys/memory/modules.md` |
| Input documents | `.evyasys/inputs/<any-file>` |

---

## About the two command forms

Typing `/evya` shows two forms for each command:

| Form | Example | Use |
|---|---|---|
| `/evyasys:StartDev` | namespaced command | ✅ Manual invocation |
| `/evyasys-start-dev` | skill trigger | Auto-invokes in agentic context |

Both run the same workflow. Use `/evyasys:*` when triggering explicitly.

---

## License

MIT — see [LICENSE](LICENSE) for details.
