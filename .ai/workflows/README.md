# Workflow Registry

Each sub-folder here is one workflow pack — a self-contained set of files that drives
a single `/Evya*` command. Adding a new workflow never requires touching the shared core.

## Active packs

| Folder | Trigger | Stage |
|---|---|---|
| `create-story/` | `/EvyaCreateStory` | BA drafts user story |
| `create-subtask/` | `/EvyaCreateSubtask <id>` | Tech Lead decomposes into tasks |
| `start-dev/` | `/EvyaStartDev <id>` | Engineering gate — start development |
| `finish-dev/` | `/EvyaFinishDev <id>` | Dev sign-off — hand to QA |
| `start-qa/` | `/EvyaStartQa <id>` | QA writes test plan |
| `finish-qa/` | `/EvyaFinishQa <id>` | Release sign-off + release notes |

## Standard files inside each pack

| File | Purpose |
|---|---|
| `AGENT.md` | Role definition — what persona the AI adopts |
| `PROMPT.md` | Main task prompt — step-by-step instructions |
| `CHECKLIST.md` | Self-review gate — AI validates output before showing user |
| `*_TEMPLATE.md` | Output template (story / task / test plan / release notes) |
| `WORKFLOW.md` | Stage-by-stage workflow map (create-story only) |
| `VALIDATION.md` | Pre-show validation rules (create-story only) |
| `QUESTIONING.md` | Question priority order (create-story only) |
| `INTEGRATION.md` | Post-confirmation integration contract (create-story only) |
| `EXAMPLES.md` | Worked examples for calibration (create-story only) |

## Adding a new workflow

1. Create `workflows/<name>/` with at minimum `AGENT.md`, `PROMPT.md`, `CHECKLIST.md`.
2. Add a `skills/evyasys-<name>/` folder with `SKILL.md` and `hooks.js`.
3. Add a `commands/Evya<Name>.md` slash-command file.
4. Register the command in `commands/command.json` and `.ai/commands.yaml`.
5. Add `workflows/<name>` to `workflow_packages` in `.ai/manifest.yaml`.
6. Project teams can override any file by placing a same-named file under `.evyasys/workflows/<name>/`.
