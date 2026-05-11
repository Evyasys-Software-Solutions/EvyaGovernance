# Evyasys

Evyasys is a complete AI-assisted delivery pipeline for software teams — story creation, technical brainstorming, development gates, QA planning, and release sign-off — all driven by six slash commands that work inside your AI coding agent.

## Quickstart

Install Evyasys for [Claude Code](#claude-code).

## How it works

From the moment a BA types `/EvyaCreateStory`, Evyasys takes over the delivery workflow. It doesn't just draft a story — it asks clarifying questions one at a time, scans your repository for context, drafts a board-ready business story, self-reviews it against a Definition-of-Ready checklist, and only then asks for approval before pushing to Azure DevOps and notifying Teams.

When a developer starts work with `/EvyaStartDev`, the agent runs a full **technical brainstorm** — generates at least three meaningfully different implementation approaches, states pros, cons, and effort delta for each, recommends one with a clear reason, and waits for the team to agree before running any process gates. The agreed approach is saved to the repo so the architectural decision travels with the PR.

At every stage, nothing touches Azure DevOps or Teams until a human explicitly approves.

---

## Installation

### Claude Code

Register the Evyasys marketplace and install the plugin — two commands:

```bash
/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git
```

```bash
/plugin install evyasys@EvyaGovernance
```

The plugin loads automatically at every session start for any project that has a `.evyasys/project.yaml` file.

### Per-project setup (once per repo)

Drop the Evyasys config into your project and commit it:

```bash
# macOS / Linux
cp -r ~/.claude/plugins/evyasys/project-template/.evyasys ./.evyasys

# Windows
Copy-Item -Recurse "$env:USERPROFILE\.claude\plugins\evyasys\project-template\.evyasys" ".\.evyasys"
```

Edit `.evyasys/project.yaml` — fill in your project name and Azure DevOps org/project — then:

```bash
git add .evyasys/project.yaml && git commit -m "Add Evyasys config" && git push
```

Teammates `git pull` and they're set. The Teams webhook is stored here too — Evyasys prompts for it automatically on first use and writes it back so the whole team picks it up.

### Azure DevOps PAT (once per machine)

Generate a token at `https://dev.azure.com/<your-org>/_usersSettings/tokens` — scope: **Work Items (Read & write)** — then save it:

```bash
# macOS / Linux
bash ~/.claude/plugins/evyasys/scripts/login.sh

# Windows
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\plugins\evyasys\scripts\login.ps1"
```

Stored at `~/.evyasys/credentials` (mode 0600). Never committed.

---

## The Six Commands

| Command | Who | What it does |
|---|---|---|
| `/EvyaCreateStory` | BA / PO | Asks clarifying questions one at a time → drafts business story → saves to your chosen folder → pushes to ADO → notifies Teams. If an Epic is set, files a reference copy under `docs/epics/<id>/` and links the ADO item to the parent Epic. |
| `/EvyaCreateSubtask EVYA-id` | Tech Lead | Presents 2–3 decomposition strategies (vertical slices / horizontal layers / spike-first), waits for team approval, then writes 3–8 developer tasks — each linked to story ACs and ≤ 1 day of work. |
| `/EvyaStartDev EVYA-id` | Eng Lead | Full **technical brainstorm**: 3+ distinct approaches with pros, cons, effort delta, recommendation. Team agrees on approach. Then runs branch / PR / DoR / dependency gates. ADO → **In Progress**. |
| `/EvyaFinishDev EVYA-id` | Dev | Audits AC coverage (asks one question at a time for any uncovered AC), runs DoD checklist, scans diff for scope anomalies. Produces Dev Summary as QA's starting document. ADO → **Ready for QA**. |
| `/EvyaStartQa EVYA-id` | QA | Confirms test environment and data before writing anything. Generates AC-driven positive/negative/edge/regression/non-functional test plan. Gherkin where useful. ADO → **In QA**. |
| `/EvyaFinishQa EVYA-id` | QA / Release | Verifies every TC has a recorded outcome, confirms no P0/P1 defects open, drafts user-facing release notes. ADO → **Done**. |

**Nothing touches ADO or Teams until you explicitly approve.**

---

## Artefacts (all saved in your project repo)

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

All artefacts committed to git alongside code — they travel with PRs.

---

## Dry-run mode

Preview any command without touching ADO or Teams:

```bash
# macOS / Linux
EVYASYS_DRY_RUN=1 /EvyaCreateStory

# Windows PowerShell
$env:EVYASYS_DRY_RUN = "1"
/EvyaStartDev EVYA-1042
```

---

## Customising for your project

Override any plugin default by placing a same-named file under `.evyasys/` in your project repo:

| To change | File in your project |
|---|---|
| Naming conventions | `.evyasys/rules/naming.md` |
| Definition of Ready | `.evyasys/rules/definition-of-ready.md` |
| Any workflow prompt | `.evyasys/workflows/<name>/PROMPT.md` |
| Business glossary | `.evyasys/memory/glossary.json` |
| Past decisions | `.evyasys/memory/decisions.md` |
| Module knowledge | `.evyasys/memory/modules.md` |
| Input documents | `.evyasys/inputs/<any-file>` |

Project overrides always win over plugin defaults.

---

## Philosophy

- **Humans confirm, AI drafts** — no ADO or Teams action without explicit approval
- **Business stories stay business** — no class names, endpoints, or implementation detail in stories
- **One question at a time** — never overwhelms with question lists
- **Evidence before claims** — every gate requires proof, not assertions
- **Decisions travel with code** — brainstorms, dev summaries, and test plans are committed to git

---

## License

MIT License — see [LICENSE](LICENSE) for details.
