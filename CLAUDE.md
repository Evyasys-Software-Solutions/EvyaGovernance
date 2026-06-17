# EvyaGovernance — Claude Code Project Standards

This file is the authoritative reference for all code generation, review, and
modification in this repository. Read it completely before writing a single line.

---

## 1. Project Overview

EvyaGovernance is an AI-assisted SDLC delivery pipeline built by Evyasys Software Solutions.
It integrates Claude Code skills with Azure DevOps and Microsoft Teams to automate the full
story lifecycle: Create → Subtask → StartDev → ReviewDev → FinishDev → StartQA → FinishQA.

### Architecture layers (top to bottom)

```
Claude Agent (AI prompt + agent result)
        ↓
skills/evyasys-*/hooks.js          orchestration — save artefacts, confirm, call integrations
        ↓
scripts/lib/                        utilities — config, ado-map, dryrun, markdown-to-html
        ↓
scripts/integrations/               external service clients — azure_devops, teams_webhook
        ↓
.evyasys/                           per-project runtime state — board/, .ado-map.json, project.yaml
        ↓
Azure DevOps API  /  Teams webhook  external systems
```

**Never cross layers upward.** A lib utility must not import a hook. An integration
must not import another integration. State flows downward only.

---

## 2. Folder Structure

```
/
├── .ai/                        AI control plane (Git-backed, shared with team)
│   ├── core/                   Quality gates, output contract, human confirmation rules
│   ├── rules/                  Coding and naming standards applied by every workflow
│   ├── workflows/              Per-command: PROMPT.md, AGENT.md, CHECKLIST.md, templates
│   └── manifest.yaml           Plugin defaults (work-item types, dry-run flag)
├── .evyasys/                   Per-project runtime (generated, committed)
│   ├── board/                  Artefacts: epics/{id}/stories/{id}/ or stories/{id}/
│   ├── .ado-map.json           Evyasys ID → ADO numeric ID + directory mapping
│   └── project.yaml            Project config: org, ADO project, Teams webhook
├── commands/                   User-facing command definitions (PascalCase.md)
├── scripts/
│   ├── lib/                    Reusable utilities (kebab-case.js / snake_case.py)
│   └── integrations/           External API clients (azure_devops.js/.py, teams_webhook.js)
└── skills/
    └── evyasys-<command>/      One folder per skill: hooks.js + SKILL.md
```

**File naming rules:**
- JavaScript library/utility: `kebab-case.js` — e.g. `ado-map.js`, `markdown-to-html.js`
- JavaScript integration: `snake_case.js` — e.g. `azure_devops.js`, `teams_webhook.js`
- Python files: `snake_case.py` — mirrors the JS integration exactly
- Hook files: always `hooks.js` — never renamed, one per skill
- Skill folders: `evyasys-<kebab-command>` — matches the slash command name
- Workflow files: `UPPER_SNAKE_CASE.md` — e.g. `PROMPT.md`, `TASK_TEMPLATE.md`
- Commands: `PascalCase.md` — e.g. `CreateStory.md`, `StartDev.md`

---

## 3. JavaScript Standards

### Module system
CommonJS only. `require` / `module.exports`. No ESM (`import`/`export`).

```js
// ✅ correct
const path = require('path');
const { loadConfig, ensurePat } = require('../../scripts/lib/config');
const adoMap = require('../../scripts/lib/ado-map');

// ❌ never
import path from 'path';
```

### Variables
`const` by default. `let` only when the value is reassigned. Never `var`.

```js
// ✅
const storyId = ctx.args && ctx.args[0];
let epicAdoId = epicId;   // reassigned in the find-or-create block

// ❌
var storyId = ...;
let storyId = ...;        // no reassignment → use const
```

### Async
`async/await` throughout. No `.then()` chains, no callbacks.

```js
// ✅
const result = await runIntegration({ ... });

// ❌
runIntegration({ ... }).then(result => { ... });
```

### Guard clauses
Return early on invalid state. Never nest the happy path.

```js
// ✅
if (!storyId) { ctx.send('Missing StoryID.'); return; }
if (!story)   { ctx.send('No draft found — aborting.'); return; }

// ❌
if (storyId) {
  if (story) {
    // happy path buried in nesting
  }
}
```

### Strings
Single quotes. Template literals for interpolation.

```js
// ✅
const msg = `Story ${storyId} is now In Progress (ADO #${idForAdo}).`;
const key = 'AZURE_PAT';

// ❌
const msg = "Story " + storyId + " is now In Progress";
```

### Formatting
- 2-space indentation
- Semicolons required
- Align related assignments with padding spaces when it aids readability:

```js
// ✅ — aligned for scan-readability in import blocks
const path   = require('path');
const fs     = require('fs');
const adoMap = require('../../scripts/lib/ado-map');

// ✅ — aligned in patch arrays
const patch = [
  { op: 'add', path: '/fields/System.Title',       value: title },
  { op: 'add', path: '/fields/System.Description', value: description },
];
```

### Section dividers
Use `// ── Section name ──────...` dividers inside longer functions to signal
logical phases. Keep dividers consistent with the existing style.

```js
// ── Azure DevOps ─────────────────────────────────────────────────────────────
await ensurePat(cfg, ctx);
// ...

// ── Teams ─────────────────────────────────────────────────────────────────────
await ensureTeamsWebhook(cfg, ctx);
```

### Comments
Write comments only when the **why** is non-obvious. Never describe what the code
does — the code itself does that. Never leave TODO, FIXME, or commented-out blocks.

```js
// ✅ — explains a non-obvious constraint
// Resolve ADO numeric ID from the local map.
// The Evyasys ID (e.g. EVYA-1042) must be converted to the ADO work item number
// (e.g. 5678) — setState requires the numeric ADO ID, not the Evyasys ID.

// ❌ — describes what is already obvious
// Get the story ID from the arguments
const storyId = ctx.args && ctx.args[0];
```

### File-level JSDoc
Every `scripts/` file starts with a block comment: purpose, config source, and CLI
usage if it is a runnable script. See `azure_devops.js` or `config.js` as the model.

---

## 4. Hook Pattern (skills/evyasys-*/hooks.js)

Every hook follows this exact sequence. Do not reorder phases.

```js
module.exports = async function (ctx) {
  // 1. Load config
  const cfg     = await loadConfig({ ctx });
  const storyId = ctx.args && ctx.args[0];

  // 2. Guard — validate required arguments (early return, no nesting)
  if (!storyId) { ctx.send('Missing StoryID. Usage: /evyasys:<Cmd> <StoryID>'); return; }

  // 3. Save artefact — write agent output to the board hierarchy
  const artefact = ctx.agentResult;
  if (artefact) {
    const storyDir = adoMap.lookupDir(cfg.repoRoot, storyId)
      || path.join(cfg.repoRoot, '.evyasys', 'board', 'stories', storyId);
    fs.mkdirSync(storyDir, { recursive: true });
    const out = path.join(storyDir, `${storyId}_<Artefact>.md`);
    fs.writeFileSync(out, artefact, 'utf8');
    ctx.send(`Saved <artefact> → ${out}`);
  }

  // 4. Human confirmation gate — MUST come before any ADO or Teams action
  if (!(await ctx.confirm(`Set ${storyId} to "<State>" and notify Teams?`))) {
    ctx.send('Cancelled.'); return;
  }

  // 5. Resolve ADO numeric ID — never pass Evyasys IDs to setState
  const adoStoryId = adoMap.lookup(cfg.repoRoot, storyId);
  if (!adoStoryId && !cfg.dryRun) {
    ctx.send(`Warning: ADO ID for ${storyId} not in map — run /evyasys:CreateStory first.`);
  }
  const idForAdo = adoStoryId || storyId;

  // 6. Azure DevOps integration
  await ensurePat(cfg, ctx);
  await runIntegration({
    name: `azure-devops:set-state(<State>) [ADO #${idForAdo}]`,
    cfg,
    args: { storyId: idForAdo, state: '<State>' },
    live: async () =>
      require('../../scripts/integrations/azure_devops').setState({ storyId: idForAdo, state: '<State>' }),
  });

  // 7. Teams notification
  await ensureTeamsWebhook(cfg, ctx);
  await runIntegration({
    name: 'teams:<event>',
    cfg,
    args: { storyId },
    live: async () =>
      require('../../scripts/integrations/teams_webhook').<event>({ storyId }),
  });

  // 8. Success message — always ends with ADO ID visible
  ctx.send(`${storyId} is now <State> (ADO #${idForAdo}). Card sent to Teams.`);
};
```

**Rules that must never be broken in hooks:**
- `ctx.confirm` must be called before every ADO or Teams action. No exceptions.
- `adoMap.lookup` must be used to get the ADO numeric ID before `setState`. Never
  pass the Evyasys ID (e.g. `EVYA-1042`) directly — it is not the ADO work item number.
- `adoMap.lookupDir` must be used to resolve the story folder. Never hardcode paths.
- `runIntegration` wraps every external call — it handles dry-run and error capture.
- Every hook ends with a `ctx.send` success message that includes the ADO ID.

---

## 5. Integration Scripts (scripts/integrations/)

### Structure pattern (azure_devops.js model)
1. File-level JSDoc block (purpose, config source, CLI usage)
2. `require` imports — stdlib first, then local lib
3. Private helper functions (`authHeader`, `adoUrl`, `adoFetch`)
4. Public API functions — each calls `loadConfig()` internally
5. CLI entry point guarded by `if (require.main === module)`
6. `module.exports` as the last line

### ADO patch array convention
```js
const patch = [
  { op: 'add', path: '/fields/System.Title',       value: title },
  { op: 'add', path: '/fields/System.Description', value: markdownToHtml(description) },
];
```
Padding-align the `value:` columns. Always convert descriptions with `markdownToHtml()`
before posting — ADO renders HTML, not Markdown.

### Descriptions sent to ADO
Always call `stripWorkflowMeta(md)` before `markdownToHtml()` for story files.
`stripWorkflowMeta` removes metadata header lines (Status, Epic, Priority, Module, Owner)
and the `## Confirmation` section — these are local workflow artefacts, not story content.

### Error handling in integrations
```js
// ✅ — warn and degrade gracefully on non-critical failure
try {
  await linkToParent(cfg, created.id, epicId);
} catch (e) {
  console.warn(`[evyasys] Epic link failed (story still created): ${e.message}`);
}

// ✅ — throw on configuration errors (hard failure, show to user)
if (!cfg.azure.pat) throw new Error('No PAT available. Run setup.ps1 once.');
```

---

## 6. Python Standards (scripts/integrations/*.py)

Python files are exact mirrors of the corresponding JS integration. Apply:

```python
from __future__ import annotations

import re
import sys
import urllib.parse
from pathlib import Path
from typing import Any

# Private helpers: leading underscore prefix
def _ado_url(cfg: dict, suffix: str) -> str: ...
def _strip_workflow_meta(md: str) -> str: ...

# Public API: no underscore prefix, keyword-only args
def create_stories(*, story_id: str | None, file: str, epic_id: str | None = None) -> Any: ...
```

- snake_case for all names
- Type hints on every function signature
- `from __future__ import annotations` at the top
- Private functions prefixed with `_`
- `re` imported at the top — never use string manipulation as a regex substitute

---

## 7. Library Utilities (scripts/lib/)

### config.js
`loadConfig({ ctx })` — always the first call in every hook and integration.
Returns the full config object. Never call it more than once per execution path.
`ensurePat(cfg, ctx)` and `ensureTeamsWebhook(cfg, ctx)` prompt-and-persist if needed.

### ado-map.js
Maps Evyasys IDs to ADO numeric IDs and local directory paths.

| Function | Purpose |
|---|---|
| `lookup(repoRoot, evyasysId)` | Returns ADO numeric ID (number) or null |
| `lookupDir(repoRoot, evyasysId)` | Returns absolute story folder path or null |
| `save(repoRoot, entries)` | Persists one or more entries atomically |

Map value format:
- **Epics**: plain number — `{ "EP-001": 5678 }`
- **Stories**: object — `{ "EVYA-1042": { adoId: 5679, dir: "/abs/path" } }`

### dryrun.js
`runIntegration({ name, cfg, args, live })` — wraps every external call.
In dry-run mode prints a preview. In live mode calls `live()`, catches errors,
returns a result object. Never throws — callers must check `.error` if needed.

### markdown-to-html.js
`markdownToHtml(md)` — converts Markdown to HTML for ADO descriptions.
ADO does not render Markdown; it renders HTML. Always use this before posting
any description to ADO.

---

## 8. ADO ID Lifecycle

```
CreateStory hook
  → ADO creates Epic (#5678)  → adoMap.save({ 'EP-001': 5678 })
  → ADO creates Story (#5679) → adoMap.save({ 'EVYA-1042': { adoId: 5679, dir: '...' } })
  → Back-write 'Epic: EP-001 · ADO #5678' into story .md
  → Back-write '> **ADO Work Item:** [#5679](url)' into story .md

CreateSubtask hook
  → ADO creates Task (#5680, 5681, ...) → back-write '· ADO #5680' into ## Task N header

StartDev / FinishDev / StartQa / FinishQa hooks
  → adoMap.lookup(repoRoot, storyId) → 5679
  → setState({ storyId: 5679, state: 'In Progress' })
```

**Rule**: Never pass an Evyasys-style ID (`EVYA-1042`, `EP-001`) to `setState` or any
ADO API call that expects a work item number. Always resolve through `adoMap.lookup` first.

---

## 9. Board Artefact Hierarchy

```
.evyasys/board/
├── epics/
│   └── EP-001/
│       └── stories/
│           └── EVYA-1042/
│               ├── EVYA-1042_UserStory.md
│               ├── EVYA-1042_TechBrainstorm.md
│               ├── EVYA-1042_DevSummary.md
│               ├── EVYA-1042_CodeReview.md
│               ├── EVYA-1042_ReleaseNotes.md
│               └── subtasks/
│                   └── EVYA-1042_Subtasks.md
└── stories/
    └── EVYA-1043/         ← stories with no epic
        └── ...
```

File naming: `<StoryID>_<Artefact>.md` — no exceptions. Artefact names:
`UserStory`, `TechBrainstorm`, `DevSummary`, `CodeReview`, `TestPlan`, `ReleaseNotes`, `Subtasks`.

---

## 10. Workflow & Prompt Files (.ai/workflows/)

Each workflow folder contains:

| File | Purpose |
|---|---|
| `PROMPT.md` | Step-by-step agent instructions |
| `AGENT.md` | Role definition and behaviour constraints |
| `CHECKLIST.md` | Self-review gate before output |
| `*_TEMPLATE.md` | Output template the agent fills in |
| `QUESTIONING.md` | When and how to ask clarifying questions |

**Layered loading order** (project overrides always win):
1. `.ai/workflows/<cmd>/*.md` — plugin defaults
2. `.evyasys/workflows/<cmd>/*.md` — project overrides

Every PROMPT.md must:
- Open with a `<HARD-GATE>` block naming the blocker
- Follow numbered steps
- End with an explicit `## Output` section listing every artefact produced
- Require `ctx.confirm` before any ADO or Teams action

---

## 11. Non-Negotiable Quality Rules

These apply to every file in this project — new or modified.

### No dirty code
- No dead code. No commented-out blocks. No `console.log` left in production paths.
- No TODO/FIXME in committed code — fix it or raise a story.
- No debug `console.log` in hooks or integrations (use `console.warn` for non-fatal,
  `console.error` for errors, with `[evyasys:...]` prefix).

### No magic values
```js
// ❌
return path.join(repoRoot, '.evyasys', '.ado-map.json');  // fine — this IS the spec
// ✅ — but if a value appears in more than one place, extract it
const ADO_MAP_FILE = '.ado-map.json';
```

### No hardcoded config
Work-item type names (`Epic`, `User Story`, `Task`) come from `cfg.workItemTypes`.
ADO org, project, and PAT come from `cfg.azure`. Never hardcode them.

### Separation of concerns
- Hooks orchestrate. They do not contain business logic.
- Lib utilities are stateless and reusable. They do not call ctx or log to console.
- Integration scripts communicate with one external system each. They do not
  call other integrations.

### Scalability
- Adding a new command must not require changes to existing commands.
- Adding a new work-item type must require only a `project.yaml` change.
- Adding a new integration must not require changes to hooks beyond a new
  `runIntegration` call.

### Dry-run parity
Every external call (ADO, Teams) must be wrapped in `runIntegration`. Every new
integration function must check `cfg.dryRun` at its entry point and return
`{ dryRun: true }` without making any HTTP call.

---

## 12. Adding a New Command — Checklist

1. Create `skills/evyasys-<cmd>/hooks.js` following the hook pattern in §4.
2. Create `skills/evyasys-<cmd>/SKILL.md` with `name`, `description`, `trigger`.
3. Create `commands/<CmdName>.md` referencing the skill.
4. Create `.ai/workflows/<cmd>/` with PROMPT.md, AGENT.md, CHECKLIST.md, and template.
5. Add the Teams notification function to `scripts/integrations/teams_webhook.js`
   and `teams_webhook.py` (Python mirror).
6. Verify dry-run: `EVYASYS_DRY_RUN=1 node skills/evyasys-<cmd>/hooks.js` logs
   what would happen without making any HTTP call.
7. Verify the new hook does not import from another hook — only from `scripts/`.
