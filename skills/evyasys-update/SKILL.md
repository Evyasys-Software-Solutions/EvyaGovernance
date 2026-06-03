---
name: evyasys-update
description: Updates or repairs the Evyasys plugin — clears the plugin cache directories and shows the three reinstall commands. Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials) are never touched.
trigger: /evyasys:Update
---

# evyasys:Update

Updates or repairs the Evyasys plugin installation.

## What it does

1. Asks for confirmation before touching anything.
2. Clears plugin cache directories: `~/.claude/plugins/cache/EvyaGovernance` and `~/.claude/plugins/marketplaces/EvyaGovernance`.
3. Removes the evyasys plugin entry from all Claude Code settings files (user, project, local) — so no manual `/plugin uninstall` is needed.
4. Shows the three reinstall commands.

Project config (`.evyasys/project.yaml`) and credentials (`~/.evyasys/credentials`) are **never touched**.

## When to run it

- To pull the latest plugin version from GitHub.
- When commands are missing or broken after a Claude Code update.
- As the first step in any troubleshooting — a clean reinstall fixes most issues.

## What happens after

Run these three commands inside Claude Code — in order:

| Step | Command |
|---|---|
| 1 | `/reload-plugins` |
| 2 | `/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git` |
| 3 | `/plugin install evyasys@EvyaGovernance` |

When prompted choose **Install for you (user scope)**, then **fully quit Claude Code and reopen it**.

## Usage

```
/evyasys:Update
```

No arguments needed.
