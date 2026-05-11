# `.evyasys/` — project-local Evyasys config

This folder lives **inside your project's git repo** (alongside `src/`, `docs/`,
etc). It holds project-specific settings, secrets, and overlays for the
Evyasys plugin.

## What goes here

```
.evyasys/
├── project.yaml         # project name, ADO target, story id prefix (non-secret)
├── .env                 # project secrets — Teams webhook lives here
├── .env.example         # template to share with the team
├── rules/               # (optional) per-project overrides over plugin .ai/rules/
├── memory/              # (optional) project-specific memory
├── workflows/           # (optional) override any AGENT.md / PROMPT.md / TEMPLATE.md
└── inputs/              # (optional) docs, transcripts, screenshots to seed createstory
```

## Where to put the Teams webhook (the most common question)

1. Open Microsoft Teams → your project's channel → ⋯ → **Connectors** →
   **Incoming Webhook** → **Add** → copy the URL.
2. In your project repo, run:
   ```bash
   cp .evyasys/.env.example .evyasys/.env
   ```
3. Edit `.evyasys/.env` and paste your URL on one line:
   ```env
   TEAMS_WEBHOOK=https://outlook.office.com/webhook/abcd...
   ```
4. Decide whether to commit:
   - Webhook URLs are *channel-level* (anyone in the channel can post), so most
     teams commit `.evyasys/.env` so every developer hits the same channel.
   - If your security policy treats them as secrets, keep `.env` in
     `.gitignore` and commit only `.env.example`.

The first `/Evya*` command that needs the webhook will use the value here —
no further configuration needed.

## What does NOT go here

- **Personal Access Tokens.** PATs are user-specific and live at
  `~/.evyasys/credentials` (mode 0600). The `/Evya*` commands prompt for one
  the first time you need it and save it there.

## Quickstart for a new project

```bash
cd <your-project>
cp -r <plugin>/project-template/.evyasys ./.evyasys
# Edit project.yaml — fill in name, ADO org/project.
# Edit .env       — paste your Teams webhook.
git add .evyasys/project.yaml .evyasys/.env.example
# Optional, depending on your policy:
git add .evyasys/.env   # OR  echo '.evyasys/.env' >> .gitignore
git commit -m "Add Evyasys config"
```
