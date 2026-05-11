# Evyasys — Quick-Start Guide

> **One-page reference for new team members.**
> Full details are in `README.md`. This card gets you running in under 10 minutes.

---

## Step 1 — Install the plugin (once per machine)

Clone the Evyasys plugin folder to a stable location, then register it:

```bash
# macOS / Linux
bash ~/tools/evyasys/setup.sh

# In your AI agent:
/plugin marketplace add ~/tools/evyasys
/plugin install evyasys
```

```powershell
# Windows
powershell -ExecutionPolicy Bypass -File C:\Tools\evyasys\setup.ps1

# In your AI agent:
/plugin marketplace add C:\Tools\evyasys
/plugin install evyasys
```

The setup script checks for Node.js, Python, and all required workflow files.
If anything is missing it tells you exactly what to fix.

---

## Step 2 — Save your Azure DevOps PAT (once per machine)

```bash
# macOS / Linux
bash ~/tools/evyasys/scripts/login.sh

# Windows
powershell -ExecutionPolicy Bypass -File C:\Tools\evyasys\scripts\login.ps1
```

Generate the PAT at `https://dev.azure.com/<org>/_usersSettings/tokens`
— scope: **Work Items (Read & write)**.

Stored at `~/.evyasys/credentials` (mode 0600) — never committed to any repo.

---

## Step 3 — Add Evyasys config to your project repo (once per project)

```bash
# from your project root
cp -r ~/tools/evyasys/project-template/.evyasys ./.evyasys
# Windows: Copy-Item -Recurse C:\Tools\evyasys\project-template\.evyasys .\.evyasys

# Open .evyasys/project.yaml and fill in:
#   name: "Your Project Name"
#   azure_devops.org: "YourAzureOrg"
#   azure_devops.project: "YourAzureProject"

git add .evyasys/project.yaml
git commit -m "Add Evyasys config"
git push
```

Other teammates `git pull` and they're set.
The Teams webhook is saved here too — Evyasys will prompt and write it on first use.

---

## The 6 commands — full delivery pipeline

Open your AI agent from **inside your project folder**, then:

| Command | Who runs it | What happens |
|---|---|---|
| `/EvyaCreateStory` | BA / PO | Drafts business story → saves to `docs/stories/` → creates ADO item → notifies Teams |
| `/EvyaCreateSubtask EVYA-1042` | Tech Lead | Decomposes story into 3–8 tasks → creates ADO child Tasks |
| `/EvyaStartDev EVYA-1042` | Eng Lead | **Brainstorm** (3+ approaches, team approval) → gates check → ADO **In Progress** → Teams kickoff |
| `/EvyaFinishDev EVYA-1042` | Dev | AC coverage audit → diff check → Dev Summary → ADO **Ready for QA** → Teams handoff |
| `/EvyaStartQa EVYA-1042` | QA | Test plan (Gherkin) → ADO **In QA** → Teams card |
| `/EvyaFinishQa EVYA-1042` | QA / Release | TC validation + release notes → ADO **Done** → Teams release card |

**Nothing touches ADO or Teams until you explicitly approve.** Every command
shows its output first.

---

## The start-dev brainstorm (what makes it different)

`/EvyaStartDev` doesn't just check boxes. It first runs a structured technical brainstorm:

1. Reads the story + subtasks + codebase scan
2. Generates **at least 3 distinct** implementation approaches — each with explicit pros, cons, and effort delta
3. Recommends one with a clear reason
4. **Waits for your team to agree** before running the process gates
5. Saves the agreed approach to `docs/stories/<id>_TechBrainstorm.md` — it travels with the PR

---

## Output files (all in your project repo)

```
docs/stories/
  EVYA-1042_UserStory.md       ← /EvyaCreateStory
  EVYA-1042_Subtasks.md        ← /EvyaCreateSubtask
  EVYA-1042_TechBrainstorm.md  ← /EvyaStartDev
  EVYA-1042_DevSummary.md      ← /EvyaFinishDev
  EVYA-1042_TestPlan.md        ← /EvyaStartQa
  EVYA-1042_ReleaseNotes.md    ← /EvyaFinishQa
```

All artefacts committed to git alongside the code.

---

## Dry-run mode — preview without side effects

```bash
# macOS / Linux
EVYASYS_DRY_RUN=1 /EvyaCreateStory

# Windows PowerShell
$env:EVYASYS_DRY_RUN = "1"
/EvyaCreateStory
```

Logs what _would_ be sent to ADO and Teams without actually doing it.
Use this when testing new project configs or custom overrides.

---

## Customising for your project

Override any plugin default by adding a same-named file in your project's `.evyasys/`:

| You want to change | Create this in your project |
|---|---|
| Story rules / naming | `.evyasys/rules/<same-name>.md` |
| A workflow prompt | `.evyasys/workflows/<workflow>/<same-name>.md` |
| Business glossary | `.evyasys/memory/glossary.json` |
| Known decisions | `.evyasys/memory/decisions.md` |
| Module knowledge | `.evyasys/memory/modules.md` |
| Input documents | `.evyasys/inputs/<any-file>` |

The session hook merges all layers automatically — project overrides win.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No PAT provided` | Run `scripts/login.sh` (or `login.ps1`) |
| `No Teams webhook configured` | Run any `/Evya*` command — it prompts and saves to `project.yaml` |
| ADO calls return 401 | PAT expired — re-run `scripts/login.sh` |
| `Missing AZURE_ORG / AZURE_PROJECT` | Edit `.evyasys/project.yaml` in your project root |
| Wrong project config loaded | Make sure you're running from inside the project root |
| Dry-run but want live | Remove `EVYASYS_DRY_RUN` from your shell environment |

---

## Where things live (summary)

| Location | What | In git? |
|---|---|---|
| `~/tools/evyasys/` | Plugin source (commands, skills, workflows) | ✅ Evyasys repo |
| `<project>/.evyasys/project.yaml` | ADO org/project, Teams webhook, project name | ✅ project repo |
| `<project>/.evyasys/rules/` etc. | Per-project overrides | ✅ project repo |
| `<project>/docs/stories/` | All generated artefacts | ✅ project repo |
| `~/.evyasys/credentials` | Your Azure DevOps PAT | ❌ never committed |
