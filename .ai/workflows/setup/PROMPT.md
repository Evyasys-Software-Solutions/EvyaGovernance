# Setup Workflow

Run once per project to configure Evyasys. Re-run at any time to change tools or update credentials.

---

## Step 0 — Check existing config

Read `.evyasys/project.yaml` from the current working directory (not the plugin folder).

- If `pm_tool` is already set, show it and ask: "Keep [tool] or change it?"
- If `notification_tool` is already set, do the same.
- Only ask for tool-specific details that are **missing** — never re-ask for values already saved.
- Show a clear "what I already know" summary before asking anything new.

If everything is already configured and credentials are present, confirm with the user and offer to update a specific section if they want to change something.

---

## Step 1 — Project Management Tool

Ask:
> Which tool should Evyasys use to track your epics, stories, and tasks?

Present exactly these four options (one brief sentence each):

1. **Local folder only** — All artefacts stay in `.evyasys/board/`. No external connectivity, no credentials needed. Best for solo work or when the team manages tracking separately.
2. **Azure DevOps** — Syncs epics, stories, and tasks to an ADO board with hierarchy links and state transitions. Requires org name, project name, and a Personal Access Token.
3. **JIRA** — Creates issues in your JIRA Cloud project with Epic parent links and transitions. Requires your Atlassian domain, project key, email, and API token.
4. **GitHub Projects** — Creates GitHub Issues and adds them to a Projects v2 board. Requires repo owner, repo name, project number, and a personal access token.

Wait for the user's answer.

---

## Step 1a — PM tool credentials

**If the user chose Local folder only:** no credentials or validation needed — skip directly to Step 2.

For Azure DevOps, JIRA, or GitHub Projects, collect credentials then validate before continuing.

> **Finding the credential validator** (run once, then use `$VALIDATOR` in the commands below):
> ```bash
> # bash / macOS / Linux
> VALIDATOR=$(find ~/.claude -name 'credential-validator.js' 2>/dev/null | grep -i 'EvyaGovernance' | head -1)
> ```
> ```powershell
> # Windows PowerShell
> $VALIDATOR = (Get-ChildItem "$env:USERPROFILE\.claude" -Recurse -Filter credential-validator.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
> ```

**If Azure DevOps:**
- Ask: "Azure DevOps organisation name?" (e.g. `EvyaCorp`)
- Ask: "Azure DevOps project name?" (e.g. `CustomerPortal`)
- Ask: "Do you have a Personal Access Token?" — scope needed: Work Items Read & write. Generate at: `https://dev.azure.com/<org>/_usersSettings/tokens`. Collect the token — it will be saved encrypted.
- **→ Validate immediately:**
  ```
  node "$VALIDATOR" ado --org "<org>" --pat "<pat>"
  ```
  - `ok: true`  → Show the `message` field verbatim (e.g. "✅ Azure DevOps connected…") and continue.
  - `ok: false` → Show the `message` field. Ask: "Would you like to **re-enter** the token, or **skip** to proceed without validation?" Re-collect and re-validate if they re-enter.

**If JIRA:**
- Ask: "JIRA domain?" (e.g. `your-org.atlassian.net`)
- Ask: "JIRA project key?" (e.g. `PORTAL`)
- Ask: "Your Atlassian account email?"
- Ask: "JIRA API token?" — generate at `https://id.atlassian.com/manage-profile/security/api-tokens`. Saved encrypted.
- **→ Validate immediately:**
  ```
  node "$VALIDATOR" jira --domain "<domain>" --email "<email>" --token "<token>"
  ```
  - `ok: true`  → Show the `message` field and continue.
  - `ok: false` → Show the `message` field. Ask to re-enter or skip.

**If GitHub Projects:**
- Ask: "GitHub owner (user or org)?" (e.g. `acme-corp`)
- Ask: "Repository name?" (e.g. `customer-portal`)
- Ask: "GitHub Projects v2 project number?" (the number in the URL: `.../projects/N`)
- Ask: "GitHub personal access token?" — scopes needed: `repo`, `project`. Generate at `https://github.com/settings/tokens`. Saved encrypted.
- **→ Validate immediately:**
  ```
  node "$VALIDATOR" github --token "<token>"
  ```
  - `ok: true`  → Show the `message` field and continue.
  - `ok: false` → Show the `message` field. Ask to re-enter or skip.

---

## Step 2 — Notification Tool

Ask:
> Where should Evyasys send status updates when stories move through the pipeline?

Present exactly these five options:

1. **Not needed** — No notifications sent. The team tracks progress directly in the PM tool or `.evyasys/board/`. Choose this if you prefer no automated messaging.
2. **Microsoft Teams** — Sends a card to a Teams channel via an incoming webhook.
3. **Slack** — Posts a message to a Slack channel via an incoming webhook.
4. **WhatsApp** — Sends a WhatsApp message via Twilio.
5. **Email** — Sends an HTML email to a team address via SMTP (works with Gmail, Outlook, SendGrid, or any SMTP server).

Wait for the user's answer.

---

## Step 2a — Notification credentials

**If the user chose Not needed:** no credentials or validation needed — skip directly to Step 3.

For Teams, Slack, WhatsApp, or Email, collect credentials then validate before continuing.

> **Finding the credential validator** (only needed if you did not already locate it in Step 1a — e.g. user chose Local folder only for PM tool):
> ```bash
> # bash / macOS / Linux
> VALIDATOR=$(find ~/.claude -name 'credential-validator.js' 2>/dev/null | grep -i 'EvyaGovernance' | head -1)
> ```
> ```powershell
> # Windows PowerShell
> $VALIDATOR = (Get-ChildItem "$env:USERPROFILE\.claude" -Recurse -Filter credential-validator.js -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like '*EvyaGovernance*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName
> ```

**If Teams:**
- Ask: "Teams incoming webhook URL for this project's channel?" — Teams channel → ··· → Connectors → Incoming Webhook → copy URL. This URL goes into `project.yaml` (not the credentials file).
- **→ Validate immediately** (this sends a one-time test card to the channel):
  ```
  node "$VALIDATOR" teams --webhook "<url>"
  ```
  - `ok: true`  → Show the `message` field. Tell the user: "A test card was posted to the channel — please confirm it appeared."
  - `ok: false` → Show the `message` field. Ask to re-enter the URL or skip.

**If Slack:**
- Ask: "Slack incoming webhook URL?" — create at `https://api.slack.com/messaging/webhooks`. Goes into `project.yaml`.
- **→ Validate immediately** (this sends a one-time test message to the channel):
  ```
  node "$VALIDATOR" slack --webhook "<url>"
  ```
  - `ok: true`  → Show the `message` field. Tell the user: "A test message was posted to the channel — please confirm it appeared."
  - `ok: false` → Show the `message` field. Ask to re-enter the URL or skip.

**If WhatsApp:**
- Ask: "Twilio Account SID?" — from `https://console.twilio.com/`
- Ask: "Twilio Auth Token?" — saved encrypted.
- Ask: "WhatsApp sender number?" (e.g. `+14155238886` — from Twilio sandbox or approved number)
- Ask: "WhatsApp recipient number for the team?" (e.g. `+1234567890`) — goes into `project.yaml`.
- **→ Validate immediately:**
  ```
  node "$VALIDATOR" whatsapp --account-sid "<sid>" --auth-token "<token>"
  ```
  - `ok: true`  → Show the `message` field and continue.
  - `ok: false` → Show the `message` field. Ask to re-enter or skip.

**If Email:**
- Ask: "Recipient (To) address for notifications?" (team distribution list or individual — e.g. `dev-team@yourcompany.com`) — goes into `project.yaml`. This is the only required field for now.
- Say: "SMTP server details (host, port, username, password) will be collected the first time a notification is sent — or you can add them now. Would you like to configure SMTP now?"
  - **If yes:** Ask SMTP host, port (default 587), username (saved encrypted), password (saved encrypted), from address (defaults to username).
    - **→ Validate immediately:**
      ```
      node "$VALIDATOR" email --host "<host>" --port "<port>" --user "<user>" --password "<pass>"
      ```
      - `ok: true`  → Show the `message` field and continue.
      - `ok: false` → Show the `message` field. Ask to re-enter SMTP details or skip.
  - **If no / skip:** Save just the recipient. The system will prompt for SMTP details the first time it needs to send an email.

---

## Step 3 — Release Notes & PDF Branding

Ask:
> "Would you like to configure release note settings for the `/evyasys:GenerateReleaseNote` command? This is optional — you can skip it now and configure later."

If the user says **skip / no / later**: use defaults and move on.

If the user says **yes / configure**:

- Ask: "Company or project name for the PDF header?" (e.g. `Acme Corp` or `Customer Portal Team`) — saved to `project.yaml`.
- Ask: "Company logo path? (relative to your project root, PNG or JPEG — or press Enter to skip)" — saved to `project.yaml`, optional.
- Ask: "Brand color for PDF headers? (hex, e.g. `#0078d4` — or press Enter for the default Evyasys blue)" — default `#0078d4`, saved to `project.yaml`.
- Ask: "Where should PDFs be saved? (relative path — default: `.evyasys/releases/`)" — saved to `project.yaml`.
- Ask: "Release naming convention?" — present these options:
  1. `v{version}` — semantic version e.g. v1.2.0 (recommended for product releases)
  2. `Sprint-{N}` — sprint number e.g. Sprint-15 (recommended for agile/scrum)
  3. `{date}` — ISO date e.g. 2026-05-21 (recommended for continuous delivery)
  4. Custom — I'll enter my own format
  Saved to `project.yaml`.

**If Local folder only:** skip the company/logo questions (no stakeholder distribution needed), but still ask for naming convention.

---

## Step 4 — Confirmation

Show a summary table before saving anything:

| Setting | Value | Saved to |
|---|---|---|
| PM Tool | [tool name] | `project.yaml` |
| [PM-specific fields, e.g. Org, Project Key] | [values] | `project.yaml` |
| [PM credential, e.g. PAT, API token] | ••••••• (hidden) | `~/.evyasys/credentials` (encrypted) |
| Notification Tool | [tool name] | `project.yaml` |
| [Notification URL / numbers] | [values] | `project.yaml` |
| [Notification auth token if applicable] | ••••••• | `~/.evyasys/credentials` (encrypted) |

Tell the user:
- What goes into `project.yaml` (safe to commit — the whole team gets it via `git pull`)
- What goes into `~/.evyasys/credentials` (machine-specific, encrypted, never committed — each team member enters their own)

Ask: "Save this configuration?"

---

## Step 4 — Output the config block

Output **exactly one** block in this format. All fields are required even if empty:

```
<!-- EVYACONFIG
{
  "pm_tool": "local",
  "azure_org": "",
  "azure_project": "",
  "azure_pat": "",
  "jira_domain": "",
  "jira_project_key": "",
  "jira_email": "",
  "jira_api_token": "",
  "github_owner": "",
  "github_repo": "",
  "github_project_number": "",
  "github_token": "",
  "notification_tool": "none",
  "teams_webhook": "",
  "slack_webhook": "",
  "twilio_account_sid": "",
  "twilio_auth_token": "",
  "whatsapp_from": "",
  "whatsapp_to": "",
  "email_to": "",
  "email_smtp_host": "",
  "email_smtp_port": "",
  "email_smtp_user": "",
  "email_smtp_password": "",
  "email_from": "",
  "release_company_name": "",
  "release_logo_path": "",
  "release_brand_color": "",
  "release_output_dir": "",
  "release_naming_convention": ""
}
-->
```

Fill in **only** the fields relevant to the chosen tools. Leave all others as empty strings.

After outputting the block, tell the user:

> ✅ Configuration saved.
> - PM tool: [tool name]
> - Notifications: [tool name]
>
> **Next step:** Run `/evyasys:TrainDocs` to scan your codebase and generate the 20 quality-gate documents that all delivery commands depend on.
>
> Once done, the full pipeline is available: `/evyasys:CreateStory` → `/evyasys:CreateSubtask` → `/evyasys:StartDev` → `/evyasys:ReviewDev` → `/evyasys:FinishDev` → `/evyasys:StartQa` → `/evyasys:FinishQa` → `/evyasys:GenerateReleaseNote`
