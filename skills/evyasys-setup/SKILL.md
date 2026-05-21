# evyasys:Setup

One-time (or update) configuration wizard for a project.

## What it does

1. Checks `.evyasys/project.yaml` for existing config — only asks for missing values.
2. Prompts you to choose a **Project Management Tool**: Local folder only / Azure DevOps / JIRA / GitHub Projects.
3. Collects the credentials and project identifiers for the chosen PM tool.
4. Prompts you to choose a **Notification Tool**: None / Teams / Slack / WhatsApp.
5. Collects the webhook URL or messaging credentials for the chosen notification tool.
6. Shows a confirmation summary before saving anything.
7. Writes non-sensitive config to `.evyasys/project.yaml` (safe to commit).
8. Writes sensitive credentials (PAT, API tokens, auth tokens) encrypted to `~/.evyasys/credentials` (never committed).

## When to run it

- First time setting up Evyasys in a new project folder.
- When switching PM tools or notification channels.
- When credentials expire or change.

## Output

Configuration is persisted by the hook. The agent does not write files — it outputs a structured config block that the hook parses and saves.

## Usage

```
/evyasys:Setup
```

No arguments needed.
