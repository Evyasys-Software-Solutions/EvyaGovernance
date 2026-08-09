# Setup Checklist

## Pre-flight
- [ ] Existing `.evyasys/project.yaml` read (if present) — user shown "what I already know" summary
- [ ] Credential validator located (`credential-validator.js`) — abort with clear error if not found

## PM tool selection (Step 1)
- [ ] User asked exactly once which of the 4 tools to use
- [ ] Only tool-specific fields required for the chosen tool are collected
- [ ] No re-asking for values already saved to `project.yaml`

## PM credentials (Step 1a) — skip if Local folder only
- [ ] All required fields for the chosen tool collected (Azure: org+project+PAT / JIRA: domain+key+email+token / GitHub: owner+repo+project#+token)
- [ ] Validator called immediately with the collected credentials
- [ ] Validator success message shown verbatim to user
- [ ] On failure: user offered re-enter OR skip — with explicit confirmation phrase required for skip
- [ ] Skip path only saves credentials after user typed the exact confirmation phrase

## Notification tool (Step 2)
- [ ] User asked exactly once which of the 5 channels to use
- [ ] Only channel-specific fields required for the chosen channel are collected

## Notification credentials (Step 2a) — skip if Not needed
- [ ] Validator called immediately with the collected credentials/webhook
- [ ] Test message actually sent to the channel (for Teams/Slack) — user asked to confirm it appeared
- [ ] Skip path: explicit confirmation phrase required before saving unverified credentials

## Release/PDF branding (Step 3) — optional
- [ ] User offered clear skip path
- [ ] Sensible defaults for brand colour (`#0078d4`) and output dir (`.evyasys/releases/`)

## Context compression (Step 3a)
- [ ] `~/.evyasys/settings.json` read first
- [ ] If `compress` key already set: no question asked; `compress_preference = "keep"`
- [ ] If not set: one-time Y/N question asked; preference saved to `~/.evyasys/settings.json`
- [ ] Compression choice never asked twice on the same machine

## Confirmation (Step 4)
- [ ] Summary table shown before any file is written
- [ ] Sensitive values (tokens, passwords) shown as `•••••••` — never printed in plain text
- [ ] User asked explicit "save this configuration?" question
- [ ] Nothing written to disk without a yes

## Output (Step 5)
- [ ] Exactly one `<!-- EVYACONFIG ... -->` block emitted
- [ ] All 30 config fields present in the JSON (empty strings for unused)
- [ ] Closing message references `/evyasys:TrainDocs` as the next step
- [ ] Closing message mentions `/evyasys:CreateFunctionalDocs` as the optional follow-up
