# Evyasys — Quick-Start Guide

> **One-page reference for new team members.**
> Full details are in `README.md`. This card gets you running in under 10 minutes.

---

## Step 0 — Install Claude Code (if not already installed)

Evyasys is a plugin for **Claude Code** — Anthropic's AI coding agent. You need it first.

```bash
npm install -g @anthropic-ai/claude-code
```

Verify:
```bash
claude --version
```

Launch from inside your project folder:
```bash
cd your-project
claude
```

> Requires Node.js 18+. Get it at [nodejs.org](https://nodejs.org/)  
> Claude Code docs: [docs.anthropic.com/claude-code](https://docs.anthropic.com/en/docs/claude-code/getting-started)

---

## Step 1 — Install the Evyasys plugin (once per machine)

**Inside Claude Code**, run:

```
/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git
```

```
/plugin install evyasys@EvyaGovernance
```

```
/reload-plugins
```

Type `/evya` — you should see 8 commands in autocomplete.

---

## Step 2 — Save your Azure DevOps PAT (once per machine)

Generate at `https://dev.azure.com/<your-org>/_usersSettings/tokens` — scope: **Work Items (Read & write)**

```bash
# macOS / Linux
evyasys=$(ls -td ~/.claude/plugins/cache/EvyaGovernance/evyasys/*/ | head -1)
bash "${evyasys}scripts/login.sh"
```

```powershell
# Windows
$evyasys = (Get-Item "$env:USERPROFILE\.claude\plugins\cache\EvyaGovernance\evyasys\*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
powershell -ExecutionPolicy Bypass -File "$evyasys\scripts\setup.ps1"
```

Stored at `~/.evyasys/credentials` — never committed to any repo.

---

## Step 3 — Add Evyasys config to your project repo (once per project)

```bash
# macOS / Linux
evyasys=$(ls -td ~/.claude/plugins/cache/EvyaGovernance/evyasys/*/ | head -1)
cp -r "${evyasys}project-template/.evyasys" ./.evyasys
```

```powershell
# Windows
$evyasys = (Get-Item "$env:USERPROFILE\.claude\plugins\cache\EvyaGovernance\evyasys\*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
Copy-Item -Recurse "$evyasys\project-template\.evyasys" ".\.evyasys"
```

Edit `.evyasys/project.yaml` with all three settings:

```yaml
name: "Your Project Name"

azure_devops:
  org: "YourAzureOrg"
  project: "YourAzureProject"

teams:
  webhook: "https://your-org.webhook.office.com/webhookb2/..."
```

> **Teams webhook:** Teams channel → ··· → Connectors → Incoming Webhook → copy URL.  
> Leave blank — Evyasys will prompt and save it automatically on first use.

Commit so the whole team shares the config:

```bash
git add .evyasys/project.yaml
git commit -m "Add Evyasys config"
git push
```

Teammates just `git pull` — no additional setup needed.

---

## Step 4 — Generate project quality-gate docs (once per project)

```
/evyasys:CreateDocs
```

Scans your codebase and writes 19 quality-gate documents to `.evyasys/docs/`.
Every downstream command loads these docs before forming any technical opinion.
Re-run with `--retrain` after major architecture changes.

---

## The 8 commands — full delivery pipeline

Open Claude Code from **inside your project folder**, then:

| Command | Who | What happens |
|---|---|---|
| `/evyasys:CreateDocs` | Tech Lead | Scan codebase → 19 quality-gate docs → `.evyasys/docs/` |
| `/evyasys:CreateStory` | BA / PO | Questions one at a time → business story → ADO User Story → 📋 Teams |
| `/evyasys:CreateSubtask EVYA-1042` | Tech Lead | 3 strategies (A/B/C, team approval) → dev tasks + QA task → ADO child Tasks → 🗂️ Teams |
| `/evyasys:StartDev EVYA-1042` | Eng Lead | Load quality-gate docs → **Brainstorm** (3+ approaches, approval) → gates → ADO **In Progress** → 🚀 Teams |
| `/evyasys:ReviewDev EVYA-1042` | Senior Dev | Independent review (AC coverage, arch, security, standards) → report saved on GO + NO-GO → ✅/❌ Teams |
| `/evyasys:FinishDev EVYA-1042` | Dev | AC audit → diff check → Dev Summary + architect gate → ADO **Ready for QA** → 🔀 Teams |
| `/evyasys:StartQa EVYA-1042` | QA | Environment questions → test plan with domain gates → ADO **In QA** → 🧪 Teams |
| `/evyasys:FinishQa EVYA-1042` | QA / Release | TC outcomes + domain gates + release notes → ADO **Done** → 🚢 Teams |

**Nothing touches ADO or Teams until you explicitly approve.**

---

## Output files (all in your project repo)

```
.evyasys/
├── docs/                                    ← CreateDocs (quality-gate documents)
│   ├── INDEX.md
│   ├── ARCHITECTURE.md
│   └── ... (19 documents)
└── board/
    └── epics/
        └── EP-001/
            └── stories/
                └── EVYA-1042/
                    ├── EVYA-1042_UserStory.md        ← CreateStory
                    ├── EVYA-1042_TechBrainstorm.md   ← StartDev
                    ├── EVYA-1042_CodeReview.md       ← ReviewDev (GO + NO-GO)
                    ├── EVYA-1042_DevSummary.md       ← FinishDev
                    ├── EVYA-1042_TestPlan.md         ← StartQa
                    ├── EVYA-1042_ReleaseNotes.md     ← FinishQa
                    └── subtasks/
                        └── EVYA-1042_Subtasks.md     ← CreateSubtask
```

Stories without an Epic are saved at `.evyasys/board/stories/<id>/`.

---

## Dry-run mode — preview without side effects

```bash
# macOS / Linux
EVYASYS_DRY_RUN=1 /evyasys:CreateStory
```

```powershell
# Windows PowerShell
$env:EVYASYS_DRY_RUN = "1"
/evyasys:StartDev EVYA-1042
```

---

## Update or fix the plugin

```powershell
# Windows — clear cache and reinstall
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\marketplaces" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\evyasys" -ErrorAction SilentlyContinue
```

```bash
# macOS / Linux
rm -rf ~/.claude/plugins/marketplaces ~/.claude/plugins/evyasys
```

Then repeat Step 1 (install the plugin again).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `claude` command not found | Install Node.js 18+ then `npm install -g @anthropic-ai/claude-code` |
| Commands don't appear after `/reload-plugins` | Clear cache (see Update section above) and reinstall |
| PAT not found | Re-run Step 2 (`setup.ps1` on Windows, `login.sh` on macOS/Linux) |
| Teams webhook missing | Run any command — it prompts and saves to `project.yaml` automatically |
| ADO 401 error | PAT expired — re-run Step 2 |
| Missing ADO org/project | Edit `.evyasys/project.yaml` in your project root |
| Wrong project loaded | Open Claude Code from inside the correct project folder |

---

## Where things live

| Location | What | In git? |
|---|---|---|
| `~/.claude/plugins/cache/EvyaGovernance/` | Plugin (auto-installed) | ✅ EvyaGovernance repo |
| `<project>/.evyasys/project.yaml` | ADO config + Teams webhook | ✅ project repo |
| `<project>/.evyasys/docs/` | Quality-gate documents (19 files) | ✅ project repo |
| `<project>/.evyasys/board/` | All story artefacts | ✅ project repo |
| `~/.evyasys/credentials` | Your Azure DevOps PAT | ❌ never committed |
