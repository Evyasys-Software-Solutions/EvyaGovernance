# Evyasys — Quick-Start Guide

> **One-page reference for new team members.**
> Full details are in `README.md`. This card gets you running in under 5 minutes.

---

## Step 1 — Install the plugin (once per machine)

Open your AI agent and run these two commands:

```
/plugin marketplace add https://github.com/dhaval-patel/EvyaGovernance
```

```
/plugin install evyasys@EvyaGovernance
```

That's it — no cloning, no scripts. The plugin installs directly from GitHub.

---

## Step 2 — Save your Azure DevOps PAT (once per machine)

Evyasys needs a token to create and update work items in Azure DevOps.

Generate one at `https://dev.azure.com/<your-org>/_usersSettings/tokens`
— scope: **Work Items (Read & write)**.

Then save it:

```bash
# macOS / Linux
bash ~/.claude/plugins/evyasys/scripts/login.sh

# Windows
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\plugins\evyasys\scripts\login.ps1"
```

Stored at `~/.evyasys/credentials` — never committed to any repo.

---

## Step 3 — Add Evyasys config to your project repo (once per project)

```bash
# macOS / Linux
cp -r ~/.claude/plugins/evyasys/project-template/.evyasys ./.evyasys

# Windows
Copy-Item -Recurse "$env:USERPROFILE\.claude\plugins\evyasys\project-template\.evyasys" ".\.evyasys"
```

Edit `.evyasys/project.yaml` — fill in your project name, ADO org, ADO project — then commit:

```bash
git add .evyasys/project.yaml
git commit -m "Add Evyasys config"
git push
```

Teammates just `git pull` — they're set. The Teams webhook is stored here too and gets set automatically on first use.

---

## The 6 commands — full delivery pipeline

Open your AI agent from inside your project folder, then:

| Command | Who | What happens |
|---|---|---|
| `/EvyaCreateStory` | BA / PO | Asks questions one at a time → drafts business story → saves to chosen folder → ADO item → Teams |
| `/EvyaCreateSubtask EVYA-1042` | Tech Lead | 2–3 decomposition strategies → team approval → 3–8 dev tasks → ADO child Tasks |
| `/EvyaStartDev EVYA-1042` | Eng Lead | **Technical brainstorm** (3+ approaches, team approval) → gates → ADO **In Progress** → Teams |
| `/EvyaFinishDev EVYA-1042` | Dev | AC audit → diff check → Dev Summary → ADO **Ready for QA** → Teams |
| `/EvyaStartQa EVYA-1042` | QA | Confirms environment + data → test plan → ADO **In QA** → Teams |
| `/EvyaFinishQa EVYA-1042` | QA / Release | TC validation + release notes → ADO **Done** → Teams |

**Nothing touches ADO or Teams until you explicitly approve.**

---

## Output files (all in your project repo)

```
docs/
  stories/
    EVYA-1042_UserStory.md        ← /EvyaCreateStory
    EVYA-1042_Subtasks.md         ← /EvyaCreateSubtask
    EVYA-1042_TechBrainstorm.md   ← /EvyaStartDev
    EVYA-1042_DevSummary.md       ← /EvyaFinishDev
    EVYA-1042_TestPlan.md         ← /EvyaStartQa
    EVYA-1042_ReleaseNotes.md     ← /EvyaFinishQa
  epics/
    EP-001/
      EVYA-1042_UserStory.md      ← reference copy when Epic is set
```

---

## Dry-run mode

Preview any command without touching ADO or Teams:

```bash
# macOS / Linux
EVYASYS_DRY_RUN=1 /EvyaCreateStory

# Windows PowerShell
$env:EVYASYS_DRY_RUN = "1"; /EvyaStartDev EVYA-1042
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| PAT not found | Run `scripts/login.sh` (or `login.ps1`) |
| Teams webhook missing | Run any `/Evya*` command — it prompts and saves automatically |
| ADO 401 error | PAT expired — re-run `login.sh` |
| Missing ADO org/project | Edit `.evyasys/project.yaml` in your project root |
| Wrong project loaded | Make sure your AI agent is open from inside the project folder |

---

## Where things live

| Location | What | In git? |
|---|---|---|
| `~/.claude/plugins/evyasys/` | Plugin (auto-installed) | ✅ EvyaGovernance repo |
| `<project>/.evyasys/project.yaml` | ADO org/project, Teams webhook | ✅ project repo |
| `<project>/docs/stories/` | All generated artefacts | ✅ project repo |
| `~/.evyasys/credentials` | Your Azure DevOps PAT | ❌ never committed |
