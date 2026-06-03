---
description: Configure Evyasys for this project — choose PM tool (Local / Azure DevOps / JIRA / GitHub Projects) and notification channel (None / Teams / Slack / WhatsApp / Email), then collect and validate credentials. Safe to re-run to update config or rotate secrets.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
skill: evyasys-setup
---

# /evyasys:Setup

Configure Evyasys for a project — choose your Project Management tool and notification channel.

## What it does

- **First run:** walks you through selecting a PM tool (Local / Azure DevOps / JIRA / GitHub Projects) and a notification channel (None / Teams / Slack / WhatsApp / Email), then collects the required credentials.
- **Validates each credential live** before saving — shows ✅ on success or ❌ with a fix link on failure. You can re-enter or skip.
- **Re-run:** shows the current config and only asks for values that are missing or that you want to change.
- Saves non-sensitive settings (tool selection, org names, webhook URLs) to `.evyasys/project.yaml` — safe to commit so teammates inherit the config.
- Saves sensitive credentials (PAT, API tokens, Twilio auth token) **encrypted** to `~/.evyasys/credentials` — never committed.

## Usage

```
/evyasys:Setup
```

No arguments. The agent walks through the configuration step by step.

## When to run

| Situation | Action |
|---|---|
| First time in a new project folder | Run Setup before any other command |
| Switching from Azure DevOps to JIRA | Re-run Setup, choose JIRA |
| Teams webhook changed | Re-run Setup, update Teams webhook |
| PAT expired | Re-run Setup, enter new PAT |
| New team member on same project | They `git pull` and run Step 2 of QUICKSTART (PAT only — project config is already committed) |

## What gets saved where

| Value | Location | In git? |
|---|---|---|
| pm_tool, notification_tool | `.evyasys/project.yaml` | ✅ Yes |
| Azure DevOps org, project | `.evyasys/project.yaml` | ✅ Yes |
| JIRA domain, project key | `.evyasys/project.yaml` | ✅ Yes |
| GitHub owner, repo, project number | `.evyasys/project.yaml` | ✅ Yes |
| Teams/Slack webhook URL | `.evyasys/project.yaml` | ✅ Yes |
| WhatsApp from/to numbers | `.evyasys/project.yaml` | ✅ Yes |
| Azure DevOps PAT | `~/.evyasys/credentials` (encrypted) | ❌ Never |
| JIRA API token | `~/.evyasys/credentials` (encrypted) | ❌ Never |
| GitHub token | `~/.evyasys/credentials` (encrypted) | ❌ Never |
| Twilio Account SID + Auth Token | `~/.evyasys/credentials` (encrypted) | ❌ Never |
| Email SMTP host, port, from, to | `.evyasys/project.yaml` | ✅ Yes |
| Email SMTP username + password | `~/.evyasys/credentials` (encrypted) | ❌ Never |

## Supported PM Tools

| Tool | What syncs |
|---|---|
| Local folder only | Nothing external — epics, stories, tasks saved in `.evyasys/board/` only |
| Azure DevOps | Epics, User Stories, Tasks with hierarchy links + state transitions |
| JIRA | Epics, Stories, Sub-tasks with parent links + issue transitions |
| GitHub Projects | GitHub Issues with labels + Projects v2 board cards + state via labels |

## Supported Notification Tools

| Tool | How |
|---|---|
| Not needed | No notifications sent — team tracks progress in the PM tool or `.evyasys/board/` directly |
| Teams | Incoming webhook card to a Teams channel |
| Slack | Incoming webhook message to a Slack channel |
| WhatsApp | Twilio API message to a WhatsApp number |
| Email | HTML email via SMTP — works with Gmail, Outlook, SendGrid, or any SMTP server |
