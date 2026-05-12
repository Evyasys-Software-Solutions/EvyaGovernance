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

### First-time install (once per machine)

**Step 1 — Add the Evyasys marketplace:**
```
/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git
```

**Step 2 — Install the plugin:**
```
/plugin install evyasys@EvyaGovernance
```

**Step 3 — Activate:**
```
/reload-plugins
```

**Step 4 — Save your Azure DevOps PAT** (required for ADO integration):

Generate a token at `https://dev.azure.com/<your-org>/_usersSettings/tokens`  
Scope needed: **Work Items (Read & write)**

```bash
# macOS / Linux
bash ~/.claude/plugins/evyasys/scripts/login.sh

# Windows
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\plugins\evyasys\scripts\login.ps1"
```

Stored securely at `~/.evyasys/credentials` — never committed to any repo.

---

### Updating to the latest version

When a new version is pushed to GitHub, run these commands to get the update:

```powershell
# Windows — clear cache and reinstall fresh
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\marketplaces" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\evyasys" -ErrorAction SilentlyContinue
```

```bash
# macOS / Linux
rm -rf ~/.claude/plugins/marketplaces
rm -rf ~/.claude/plugins/evyasys
```

Then reinstall:
```
/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git
/plugin install evyasys@EvyaGovernance
/reload-plugins
```

---

### Troubleshooting a broken install

If the plugin shows errors, fails to load, or commands don't appear:

```powershell
# Windows — full reset
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\marketplaces" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\plugins\evyasys" -ErrorAction SilentlyContinue
```

Close and **reopen** Claude Code completely, then run the install steps above again.

---

### Per-project setup (once per repo)

Drop the Evyasys config into your project and commit it:

```bash
# macOS / Linux
cp -r ~/.claude/plugins/evyasys/project-template/.evyasys ./.evyasys

# Windows
Copy-Item -Recurse "$env:USERPROFILE\.claude\plugins\evyasys\project-template\.evyasys" ".\.evyasys"
```

Edit `.evyasys/project.yaml`:
```yaml
name: "Your Project Name"
azure_devops:
  org: "YourAzureOrg"
  project: "YourAzureProject"
```

Commit it:
```bash
git add .evyasys/project.yaml && git commit -m "Add Evyasys config" && git push
```

Teammates just `git pull` — they're set. The Teams webhook is saved here too and gets
configured automatically on first use.

---

## The 7 Commands

Type `/evya` in Claude Code to see all commands in autocomplete. Every command is
in the `/evyasys:` namespace.

**Full delivery flow:**
```
CreateStory → CreateSubtask → StartDev → ReviewDev → FinishDev → StartQa → FinishQa
```

Nothing touches Azure DevOps or Teams until you **explicitly approve**.

---

### `/evyasys:CreateStory`
**Who:** BA / Product Owner — **When:** Start of every story

**What it does:**
Scans your repository for context, then asks clarifying questions **one at a time**
(scope ambiguity, role clarity, AC ambiguity — never an overwhelming list) before
drafting anything. Produces a board-ready business story in pure business language —
zero class names, endpoints, or implementation detail.

After drafting it runs a self-review against the Definition-of-Ready checklist and
rewrites automatically if anything fails. Then presents the draft with a clear
statement of where the file will be saved and what ADO + Teams actions will happen.

If the story belongs to an Epic, it files a reference copy under `docs/epics/<epic-id>/`
and links the ADO work item to the parent Epic in Azure DevOps.

**Produces:**
- `docs/stories/<id>_UserStory.md`
- `docs/epics/<epic-id>/<id>_UserStory.md` (reference copy, if Epic set)
- Azure DevOps User Story (linked to Epic if applicable)
- Teams channel notification

---

### `/evyasys:CreateSubtask EVYA-1042`
**Who:** Tech Lead — **When:** After story is approved, before any development

**What it does:**
Reads the story in full and maps every Acceptance Criterion. Runs a repo scan to
identify which modules will be touched. Asks one clarifying question at a time
(scope, technical constraints, test strategy, merge ordering) if anything is unclear.

Before writing a single task, presents **2–3 decomposition strategies** with trade-offs:
- *Vertical slices* — each task delivers one end-to-end AC
- *Horizontal layers* — data layer first, then service, then UI
- *Spike-first* — one investigation task to de-risk unknowns, then implementation

Waits for the team to choose a strategy, then writes 3–8 developer tasks — each
≤ 1 day of work, linked to specific ACs, naming exact modules/files, independently
mergeable (or with merge order documented), and with a clear acceptance statement
a reviewer can verify without asking the author.

**Produces:**
- `docs/stories/<id>_Subtasks.md`
- Azure DevOps child Tasks

---

### `/evyasys:StartDev EVYA-1042`
**Who:** Engineering Lead — **When:** Sprint start, before a developer writes a line of code

**What it does — Phase 1, Brainstorm:**
Reads the story, subtasks, and repo scan completely before forming any opinion.
Generates **minimum 3 meaningfully distinct implementation approaches** — not
variations of the same idea, but fundamentally different architectural strategies
(e.g. event-driven vs direct call, feature-flag incremental vs big-bang, cache-first
vs DB-first). Each approach gets specific pros, specific cons, and an effort delta
(S/M/L). Then recommends one with a clear deciding reason and names the top risk.

Waits for the team to agree on an approach (or choose a different one) before
doing anything else. The agreed approach is saved to the repo so the architectural
decision travels with the PR.

**What it does — Phase 2, Gates:**
Only after brainstorm is agreed: checks branch naming convention, confirms a draft
PR exists, re-runs Definition of Ready line by line against the current story, and
confirms dependencies are cleared. Produces a GO / NO-GO gate table.

**Produces:**
- `docs/stories/<id>_TechBrainstorm.md`
- Azure DevOps state → **In Progress**
- Teams kickoff notification

---

### `/evyasys:ReviewDev EVYA-1042`
**Who:** Senior Developer (independent reviewer role) — **When:** Implementation complete, before FinishDev

**What it does:**
Acts as an **independent code reviewer** — a different perspective from the developer
who wrote the code. Reads the full diff against main AND the complete content of every
changed file (not just the diff chunks) to understand full context.

Checks every AC has a passing test. Identifies the test file and test name for each.
Any AC without a test is immediately flagged **Critical**.

Reviews each changed file for:
- **Correctness** — logic errors, null dereferences, race conditions, error handling
- **Security** — input validation, auth/authz at every entry point, no secrets in code
- **YAGNI** — runs `grep` before flagging anything as unused; only flags code confirmed
  to be called nowhere in the codebase
- **Test quality** — tests verify real behaviour, not mock implementations; edge cases covered
- **Diff scope** — files changed outside story scope flagged and clarified

Every finding cites a specific file path and line number. No "great implementation!"
or performative language — findings only.

The developer can **push back with technical evidence**. If the argument is valid,
the reviewer updates the assessment: *"Verified — your point stands."* If not:
*"Here's why the original finding holds: [evidence]."*

**Severity model:**
| Level | Meaning | Effect |
|---|---|---|
| **Critical** | Untested AC, broken logic, security hole, data loss | Blocks `/evyasys:FinishDev` |
| **Important** | Test gap, performance risk, unclear code | Should fix before QA |
| **Minor** | Style, naming, small improvement | Note for later |

**Produces:**
- `docs/stories/<id>_CodeReview.md` (saved on GO verdict)
- No ADO state change — FinishDev handles that after review passes

---

### `/evyasys:FinishDev EVYA-1042`
**Who:** Developer — **When:** After ReviewDev passes

**What it does:**
This is the developer sign-off gate before QA. Reads the story, subtasks, brainstorm,
and code review. Runs the actual diff and repo scan.

For every AC, identifies the specific test (file + test name, unit/integration/E2E,
added or pre-existing). For any AC without a verified test, asks **one clarifying
question at a time** (automated test that can't be found? manual-only? deliberately
deferred?) and will not proceed with any unresolved ❌.

Runs the Definition-of-Done checklist: linters, code review approved, no open
TODOs for this story, documentation updated, feature flag state confirmed, rollback
plan present.

Scans the diff for files outside expected scope, debug statements, missing migrations,
and accidentally committed secrets — asking one question at a time for any anomaly.

Produces a Dev Summary that becomes the QA team's starting document: files touched,
tests added with AC mapping, diff scope risks, and explicit hints for what QA should
probe first.

**Produces:**
- `docs/stories/<id>_DevSummary.md`
- Azure DevOps state → **Ready for QA**
- Teams handoff notification

---

### `/evyasys:StartQa EVYA-1042`
**Who:** QA Engineer — **When:** Story is Ready for QA

**What it does:**
Before writing a single test case, asks clarifying questions one at a time:
- **Test environment** (required — can't write a test plan without knowing where it runs)
- **Test data** (required if the story involves stateful or user-specific data)
- **Known flaky areas** in the affected modules
- **Browser/device matrix** (only if the story affects UI)

Only after environment and data are confirmed does it write the test plan. The plan
covers every AC with at minimum one positive case (happy path) and one negative case
(boundary, invalid input, unauthorised access). Adds edge cases, regression checks
for every file listed in the Dev Summary's "files touched", and a non-functional
section covering performance, security, and accessibility (or marks items N/A with
a specific reason).

Uses Gherkin (Given / When / Then) for any multi-step workflow scenario.
Self-reviews the plan against a checklist before showing it.

**Produces:**
- `docs/stories/<id>_TestPlan.md`
- Azure DevOps state → **In QA**
- Teams notification

---

### `/evyasys:FinishQa EVYA-1042`
**Who:** QA / Release Manager — **When:** All test cases executed and outcomes recorded

**What it does:**
First checks that every test case in the plan has a recorded outcome (pass / fail /
blocked). If any TC has no outcome, it stops and asks the QA team to fill it in
first — it will not proceed until all TCs are accounted for.

Verifies no P0 or P1 defects remain open against this story. If any are open, lists
them and stops — the gate cannot proceed until they are resolved or formally accepted
with documented justification.

Drafts release notes in plain user-facing language: one short paragraph explaining
what changed (no jargon, no class names, as if writing for a non-technical
stakeholder), a bullet changelog of what shipped, known limitations, and a rollback
plan (or "N/A — feature flag off by default").

**Produces:**
- `docs/stories/<id>_ReleaseNotes.md`
- Azure DevOps state → **Done**
- Teams release notification

---

## Microsoft Teams notifications

Every command posts a card to your Teams channel at the moment it completes — after
your approval, never before. The webhook is stored in `.evyasys/project.yaml` so
the whole team shares the same channel. Evyasys prompts for it automatically the
first time and writes it back so teammates pick it up via `git pull`.

| Command | Teams card sent |
|---|---|
| `CreateStory` | 📋 **New Story Ready** — story ID, preview of business context |
| `CreateSubtask` | 🗂️ **Subtasks Ready** — story ID, number of tasks created |
| `StartDev` | 🚀 **Dev Started** — story ID, confirms technical approach agreed |
| `ReviewDev` | ✅ **Code Review Passed** — story ID, confirms no Critical issues |
| `FinishDev` | 🔀 **Ready for QA** — story ID, Dev Summary committed to repo |
| `StartQa` | 🧪 **QA Started** — story ID, test plan committed to repo |
| `FinishQa` | 🚢 **Released** — story ID, release notes committed to repo |

> **Note:** `ReviewDev` only sends the notification on a **GO verdict**. A NO-GO stops
> the workflow silently (no Teams noise) and returns the developer to fix Critical issues.

To configure the webhook, add it to your project's `.evyasys/project.yaml`:
```yaml
teams:
  webhook: "https://your-org.webhook.office.com/webhookb2/..."
```

Or set it via environment variable (useful for CI):
```bash
export TEAMS_WEBHOOK="https://your-org.webhook.office.com/webhookb2/..."
```

---

## Complete artefact map

Every artefact is committed to git and travels with the code through PRs.

```
docs/
  stories/
    EVYA-1042_UserStory.md        ← CreateStory
    EVYA-1042_Subtasks.md         ← CreateSubtask
    EVYA-1042_TechBrainstorm.md   ← StartDev   (agreed technical approach)
    EVYA-1042_CodeReview.md       ← ReviewDev  (saved on GO verdict)
    EVYA-1042_DevSummary.md       ← FinishDev  (QA starting document)
    EVYA-1042_TestPlan.md         ← StartQa
    EVYA-1042_ReleaseNotes.md     ← FinishQa
  epics/
    EP-001/
      EVYA-1042_UserStory.md      ← reference copy when Epic is set
```

---

## Dry-run mode — preview without side effects

Test any command without touching Azure DevOps or Teams:

```bash
# macOS / Linux
EVYASYS_DRY_RUN=1 /evyasys:CreateStory

# Windows PowerShell
$env:EVYASYS_DRY_RUN = "1"
/evyasys:StartDev EVYA-1042
```

Logs exactly what would be sent to ADO and Teams without executing anything.

---

## Per-project customisation

Override any plugin default by placing a same-named file under `.evyasys/` in your
project repo. Project files always win over plugin defaults.

| To customise | Add this file in your project |
|---|---|
| Story naming rules | `.evyasys/rules/naming.md` |
| Definition of Ready | `.evyasys/rules/definition-of-ready.md` |
| No-tech-in-story rule | `.evyasys/rules/no-tech-in-story.md` |
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

Typing `/evya` shows both:

| Form | Example | When to use |
|---|---|---|
| `/evyasys:StartDev` | namespaced command | ✅ Use this for manual invocation |
| `/evyasys-start-dev` | skill trigger | Auto-invokes in agentic context |

Both run the same workflow. Use `/evyasys:*` when you want to trigger a command
explicitly.

---

## License

MIT — see [LICENSE](LICENSE) for details.
