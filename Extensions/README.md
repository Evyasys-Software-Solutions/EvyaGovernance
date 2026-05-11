# Evyasys

A delivery-pipeline plugin for AI agents: story → dev → QA → release, driven by
single-token slash commands that all start with **`Evya`**.

Built on plain markdown + Node.js + Python — no vendor lock-in.
Every prompt, rule, template, and checklist lives in Git and travels with your code.

---

## What your team gets

Six commands, every one starts with `Evya`:

| Command | Who runs it | What it does | Output written to your project |
|---|---|---|---|
| `/EvyaCreateStory` | BA / PO | Draft a complete business story from project context | `docs/stories/<id>_UserStory.md` |
| `/EvyaCreateSubtask <id>` | Tech Lead | Decompose a story into 3–8 developer tasks | `docs/stories/<id>_Subtasks.md` |
| `/EvyaStartDev <id>` | Eng Lead | **Technical brainstorm (3+ approaches) + branch/PR/DoR gates** → ADO **In Progress** | `docs/stories/<id>_TechBrainstorm.md` |
| `/EvyaFinishDev <id>` | Dev | AC coverage audit + diff check + Dev Summary → ADO **Ready for QA** | `docs/stories/<id>_DevSummary.md` |
| `/EvyaStartQa <id>` | QA | Comprehensive test plan (Gherkin) → ADO **In QA** | `docs/stories/<id>_TestPlan.md` |
| `/EvyaFinishQa <id>` | Release Mgr | Validate results + draft release notes → ADO **Done** | `docs/stories/<id>_ReleaseNotes.md` |

All artefacts land **inside the project repo** (in `docs/stories/`), so they
travel with the code through normal git PRs and reviews.

---

## How a teammate gets started (3 steps)

### Step 1 — Install the plugin (once per machine)

Clone this folder to a stable location on your machine:

```bash
git clone <evyasys-repo-url> C:\Tools\evyasys   # Windows
git clone <evyasys-repo-url> ~/tools/evyasys     # macOS / Linux
```

Then run the setup validator:

```bash
# macOS / Linux
bash ~/tools/evyasys/setup.sh

# Windows
powershell -ExecutionPolicy Bypass -File C:\Tools\evyasys\setup.ps1
```

Register the plugin in your AI agent:

```
/plugin marketplace add ~/tools/evyasys
/plugin install evyasys
```

### Step 2 — Save your personal access token (once per machine)

```bash
# macOS / Linux
bash ~/tools/evyasys/scripts/login.sh

# Windows
powershell -ExecutionPolicy Bypass -File C:\Tools\evyasys\scripts\login.ps1
```

Generate the PAT at `https://dev.azure.com/<org>/_usersSettings/tokens`,
scope **Work Items (Read & write)**. The token is stored at
`~/.evyasys/credentials` with `0600` permissions and is **never** written to
any project repo.

### Step 3 — Drop a `.evyasys/` folder into each project

```bash
# from the root of your project
cp -r ~/tools/evyasys/project-template/.evyasys ./.evyasys
# Edit .evyasys/project.yaml — fill in name, ADO org/project
git add .evyasys/project.yaml
git commit -m "Add Evyasys config"
git push
```

Other teammates just `git pull` and they're set.
The Teams webhook is stored in `project.yaml` too — Evyasys will prompt you on
first use and write it back so the team picks it up automatically.

---

## Where things live (and why)

| Where | Owned by | What | In git? |
|---|---|---|---|
| `<plugin>/.ai/` | Evyasys (shared) | Default rules, prompts, templates, checklists | ✅ plugin repo |
| `<project>/.evyasys/project.yaml` | per project | Project name, ADO org/project, Teams webhook | ✅ project repo |
| `<project>/.evyasys/rules/` etc. | per project | Optional overrides on top of plugin defaults | ✅ project repo |
| `<project>/docs/stories/` | per project | All generated artefacts | ✅ project repo |
| `~/.evyasys/credentials` | per user | Personal Access Token | ❌ never committed |

---

## Modes

**Live (default)** — every approved command creates/updates the ADO work item
and posts the Teams card.

**Dry-run preview** — set `EVYASYS_DRY_RUN=1` to log payloads without
touching ADO or Teams. Use this when iterating on prompts.

```bash
EVYASYS_DRY_RUN=1 /EvyaCreateStory     # preview only
/EvyaCreateStory                        # live (default)
```

---

## The start-dev brainstorm

`/EvyaStartDev` runs a full technical brainstorm before any gate check:

1. Reads the story + subtasks + repo scan in full.
2. Generates **at least 3 distinct** implementation approaches — each with explicit pros, cons, and effort delta.
3. Recommends one with a clear deciding reason and top risk.
4. **Waits for team approval** before proceeding to process gates.
5. Saves the agreed approach to `docs/stories/<id>_TechBrainstorm.md` so the decision travels with the PR.

Only after the brainstorm is agreed does it check branch naming, draft PR,
Definition of Ready, and dependency clearance.

---

## Why "starts with Evya" matters

Single-token commands like `/EvyaCreateStory` work in any agent runtime that
supports slash commands — no namespace required. The markdown prompts, rules,
checklists, and integration scripts are portable: if your team changes AI
tools, only the thin runtime adapter needs updating.

---

## Customising for your project

Override any plugin default by placing a same-named file under your project's
`.evyasys/` folder. The session-start hook merges all layers — project wins:

| To change | Add this file in your project |
|---|---|
| Naming conventions | `.evyasys/rules/naming.md` |
| Definition of Ready | `.evyasys/rules/definition-of-ready.md` |
| A workflow's prompt | `.evyasys/workflows/<name>/PROMPT.md` |
| Business glossary | `.evyasys/memory/glossary.json` |
| Module knowledge | `.evyasys/memory/modules.md` |
| Input documents | `.evyasys/inputs/<any-file>` |

---

## File structure

```
evyasys/                                    ← install location
├── README.md
├── QUICKSTART.md                           ← one-page team reference card
├── setup.sh / setup.ps1                    ← one-time machine validation
├── .env.example                            ← optional CI overrides
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── commands/
│   ├── command.json
│   ├── EvyaCreateStory.md
│   ├── EvyaCreateSubtask.md
│   ├── EvyaStartDev.md                     ← brainstorm + gates
│   ├── EvyaFinishDev.md
│   ├── EvyaStartQa.md
│   └── EvyaFinishQa.md
├── skills/
│   ├── evyasys-create-story/   {SKILL.md, hooks.js}
│   ├── evyasys-create-subtask/ {SKILL.md, hooks.js}
│   ├── evyasys-start-dev/      {SKILL.md, hooks.js}   ← saves TechBrainstorm.md
│   ├── evyasys-finish-dev/     {SKILL.md, hooks.js}
│   ├── evyasys-start-qa/       {SKILL.md, hooks.js}
│   └── evyasys-finish-qa/      {SKILL.md, hooks.js}
├── hooks/
│   └── evyasys-load-context.js             ← merges plugin + project + user layers
├── scripts/
│   ├── login.sh / login.ps1               ← one-time PAT capture (per user)
│   ├── repo_scan.py
│   ├── lib/{config.js, dryrun.js, evyasys_config.py}
│   └── integrations/
│       ├── azure_devops.{js,py}
│       └── teams_webhook.{js,py}
├── .ai/                                    ← plugin defaults (all versioned)
│   ├── manifest.yaml
│   ├── commands.yaml
│   ├── memory/evyaflow.json
│   ├── rules/
│   ├── workflows/{create-story, create-subtask, start-dev, finish-dev, start-qa, finish-qa}/
│   └── ...
└── project-template/
    └── .evyasys/
        ├── project.yaml.example
        └── README.md
```
