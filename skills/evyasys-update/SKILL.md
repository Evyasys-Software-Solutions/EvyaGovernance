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
4. **Automatically git-clones the latest plugin source** from GitHub to `~/.claude/plugins/marketplaces/EvyaGovernance` — so no manual `/plugin marketplace add` is needed.
5. Shows the reinstall commands (2 if the auto-clone succeeded, 3 if git was unavailable).

Project config (`.evyasys/project.yaml`) and credentials (`~/.evyasys/credentials`) are **never touched**.

## When to run it

- To pull the latest plugin version from GitHub.
- When commands are missing or broken after a Claude Code update.
- As the first step in any troubleshooting — a clean reinstall fixes most issues.

## What happens after (normal — git available)

Run these two commands inside Claude Code — in order:

| Step | Command |
|---|---|
| 1 | `/reload-plugins` |
| 2 | `/plugin install evyasys@EvyaGovernance` |

When prompted choose **Install for you (user scope)**, then **fully quit Claude Code and reopen it**.

## What happens after (fallback — git clone failed)

If the auto-clone failed (git not in PATH or no network), run three commands:

| Step | Command |
|---|---|
| 1 | `/reload-plugins` |
| 2 | `/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git` |
| 3 | `/plugin install evyasys@EvyaGovernance` |

## Usage

```
/evyasys:Update
```

No arguments needed.
