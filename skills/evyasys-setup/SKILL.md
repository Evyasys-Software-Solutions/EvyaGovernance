# evyasys:Setup

One-time (or update) configuration wizard for a project.

## What it does

1. Checks `.evyasys/project.yaml` for existing config — only asks for missing values.
2. Prompts you to choose a **Project Management Tool**: Local folder only / Azure DevOps / JIRA / GitHub Projects.
3. Collects the credentials and project identifiers for the chosen PM tool.
4. **Validates the PM credentials immediately** with a live API call — shows ✅/❌ and asks to re-enter if invalid.
5. Prompts you to choose a **Notification Tool**: None / Teams / Slack / WhatsApp / Email.
6. Collects the webhook URL or messaging credentials for the chosen notification tool.
7. **Validates the notification credentials immediately** (sends a test message to Teams/Slack channels, or verifies Twilio/SMTP connection).
8. Shows a confirmation summary before saving anything.
9. Writes non-sensitive config to `.evyasys/project.yaml` (safe to commit).
10. Writes sensitive credentials (PAT, API tokens, auth tokens) encrypted to `~/.evyasys/credentials` (never committed).

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
