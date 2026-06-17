> Not applicable as a server infrastructure document — this project is a developer CLI plugin. There is no web server, no Nginx, no process supervisor, no Redis, and no database server.
>
> **Developer machine requirements** (minimum to run the plugin):
> - Node.js ≥ 16.0.0
> - Python 3.x (for `scripts/repo_scan.py`)
> - Git (for repo scanning and artefact commits)
> - Claude Code CLI (Anthropic)
> - Network access to configured PM tool (Azure DevOps / JIRA / GitHub) and notification channel (Teams / Slack)
>
> **External service dependencies** (not self-hosted):
> - Azure DevOps: `https://dev.azure.com/` (or on-premises ADO Server with URL override)
> - JIRA: `https://{org}.atlassian.net/` (Cloud) or self-hosted JIRA Server
> - GitHub: `https://api.github.com/`
> - Teams: Microsoft Teams incoming webhook endpoint
> - Slack: `https://hooks.slack.com/`
> - Twilio: `https://api.twilio.com/` (for WhatsApp)
>
> **Credential storage location**: `~/.evyasys/credentials` — encrypted, per-developer, per-machine.
