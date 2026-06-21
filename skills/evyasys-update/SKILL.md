---
name: evyasys-update
description: Updates the Evyasys plugin — shows version diff, changelog highlights, always asks about compression state (update / enable / disable / keep), then shows the 3 commands to complete the plugin update. Compression preference is saved to ~/.evyasys/settings.json and never reset by plugin updates.
trigger: /evyasys:Update
---

# evyasys:Update

Updates the Evyasys plugin and manages context compression with explicit user consent.

## What it does

1. Shows current plugin version vs latest on GitHub + changelog highlights.
2. **Always checks compression state** — reads `~/.evyasys/settings.json` and asks:
   - If enabled: Update / Keep / Disable
   - If disabled: Enable / Keep disabled
   - If not configured: Enable / Skip
3. Acts on user's compression choice (update engine, enable, disable, or leave unchanged).
4. Shows 3 commands to complete the plugin update.

Nothing about the plugin directories is touched — `/plugin update` owns that cleanly.
Project config, credentials, docs, board artefacts, and `~/.evyasys/settings.json` are
only written when the user explicitly chooses a compression action.

> **For a broken install** (commands missing after Update), run `/evyasys:Repair`.

## Compression persistence

Compression preference is stored in `~/.evyasys/settings.json`:
```json
{
  "compress": {
    "enabled": true,
    "version": "1.2.3",
    "updated_at": "2026-06-21"
  }
}
```
Plugin updates **never modify this file**. It is owned entirely by the user.

## What happens after

Run these commands inside Claude Code — in order:

| Step | Command |
|---|---|
| 1 | `/plugin marketplace update EvyaGovernance` |
| 2 | `/plugin update evyasys@EvyaGovernance` |
| 3 | `/reload-plugins` |

Then **fully quit Claude Code and reopen it**.

## Usage

```
/evyasys:Update
```

No arguments needed.
