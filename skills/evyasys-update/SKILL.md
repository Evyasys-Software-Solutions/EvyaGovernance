---
name: evyasys-update
description: Updates the Evyasys plugin to the latest version — shows current vs new version, displays changelog highlights, and shows the 3 built-in commands to complete the update. No files are deleted. Project config, credentials, docs, and board artefacts are never touched.
trigger: /evyasys:Update
---

# evyasys:Update

Updates the Evyasys plugin to the latest version using Claude Code's built-in plugin update mechanism.

## What it does

1. Asks for confirmation before touching anything.
2. Checks your current version against the latest on GitHub.
3. Shows the version change (e.g. v1.0.0 → v1.1.0) and what's new from the changelog.
4. Shows 3 commands to run inside Claude Code to complete the update.

Nothing is deleted. Project config (`.evyasys/project.yaml`), credentials (`~/.evyasys/credentials`), docs, and board artefacts are **never touched**.

> **For a broken install** (commands missing or not working after Update), run `/evyasys:Repair` — it does a full clean reinstall.

## When to run it

- To pull the latest plugin version from GitHub.
- After Evyasys announces a new release.

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
