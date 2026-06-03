---
name: evyasys-setup
description: One-time (or update) configuration wizard — confirms project folder, checks existing config, validates PM tool credentials live, collects notification credentials, and persists non-sensitive config to .evyasys/project.yaml with encrypted credentials to ~/.evyasys/credentials.
trigger: /evyasys:Setup
---

# evyasys:Setup

One-time (or update) configuration wizard for a project.

## Agent workflow

Read and follow these two files in order:

1. `.ai/workflows/setup/AGENT.md` — agent role, rules, and constraints
2. `.ai/workflows/setup/PROMPT.md` — exact question sequence, credential validation commands, and the EVYACONFIG block format to output at the end

**Do not skip loading these files.** The EVYACONFIG output block is what the post-agent hook uses to save credentials and project config — without it, nothing is persisted.

## What it does

1. Checks `.evyasys/project.yaml` for existing config — only asks for values that are missing. Shows existing config first.
2. Prompts you to choose a **Project Management Tool**: Local folder only / Azure DevOps / JIRA / GitHub Projects.
3. Collects the credentials and project identifiers for the chosen PM tool.
4. **Validates the PM credentials immediately** with a live API call — shows ✅/❌ and asks to re-enter if invalid.
5. Prompts you to choose a **Notification Tool**: None / Teams / Slack / WhatsApp / Email.
6. Collects the webhook URL or messaging credentials for the chosen notification tool.
7. **Validates the notification credentials immediately** (sends a test message to Teams/Slack channels, or verifies Twilio/SMTP connection).
8. Shows a confirmation summary before saving anything.
9. Outputs a `<!-- EVYACONFIG { ... } -->` block — the hook parses this and saves config to `.evyasys/project.yaml` and credentials (encrypted) to `~/.evyasys/credentials`.

## When to run it

- First time setting up Evyasys in a new project folder.
- When switching PM tools or notification channels.
- When credentials expire or change.

## Output

Configuration is persisted by the post-agent hook. The agent does **not** write files — it outputs the structured EVYACONFIG block and the hook saves everything.

## Usage

```
/evyasys:Setup
```

No arguments needed.
