# Workflow Registry

Each sub-folder here is one workflow pack — a self-contained set of files that drives
a single `/evyasys:*` command. Adding a new workflow never requires touching the shared core.

## Active packs

| Folder | Command | Stage |
|---|---|---|
| `create-story/` | `/evyasys:CreateStory` | BA drafts user story |
| `create-subtask/` | `/evyasys:CreateSubtask <id>` | Tech Lead decomposes into tasks |
| `start-dev/` | `/evyasys:StartDev <id>` | Engineering gate — brainstorm + start development |
| `review-dev/` | `/evyasys:ReviewDev <id>` | Independent code review — Critical issues block FinishDev |
| `finish-dev/` | `/evyasys:FinishDev <id>` | Dev sign-off — AC audit → hand to QA |
| `start-qa/` | `/evyasys:StartQa <id>` | QA writes test plan |
| `finish-qa/` | `/evyasys:FinishQa <id>` | Release sign-off + release notes |

## Standard files inside each pack

| File | Purpose |
|---|---|
| `AGENT.md` | Role definition — what persona the AI adopts |
| `PROMPT.md` | Main task prompt — step-by-step instructions |
| `CHECKLIST.md` | Self-review gate before showing output to user |
| `*_TEMPLATE.md` | Output template (story / task / review / test plan / release notes) |
| `QUESTIONING.md` | When and how to ask clarifying questions (one at a time) |
| `WORKFLOW.md` | Stage-by-stage workflow map (create-story only) |
| `VALIDATION.md` | Pre-show validation rules (create-story only) |
| `INTEGRATION.md` | Post-confirmation integration contract (create-story only) |
| `BRAINSTORM_TEMPLATE.md` | Technical brainstorm output template (start-dev only) |
| `REVIEW_TEMPLATE.md` | Code review report template (review-dev only) |

## Adding a new workflow

1. Create `workflows/<name>/` with `AGENT.md`, `PROMPT.md`, `CHECKLIST.md` minimum.
2. Add `skills/evyasys-<name>/` with `SKILL.md` (trigger: `/evyasys:<Name>`) and `hooks.js`.
3. Add `commands/<Name>.md` with frontmatter `skill: evyasys-<name>`.
4. Add `{"name": "<Name>", "description": "..."}` entry to `commands/command.json`.
5. Add `workflows/<name>` to `workflow_packages` in `.ai/manifest.yaml`.
6. Projects can override any file by placing a same-named file under `.evyasys/workflows/<name>/`.
