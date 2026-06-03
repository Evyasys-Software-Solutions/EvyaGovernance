---
name: evyasys-update
description: Updates or repairs the Evyasys plugin — clears the plugin cache directories and shows the three reinstall commands. Project config (.evyasys/project.yaml) and credentials (~/.evyasys/credentials) are never touched.
trigger: /evyasys:Update
---

# evyasys:Update

Updates or repairs the Evyasys plugin installation.

## What it does

1. Asks for confirmation before touching anything.
2. Clears the two plugin cache directories: `~/.claude/plugins/marketplaces` and `~/.claude/plugins/evyasys`.
3. Shows the three reinstall commands to run inside Claude Code.

Project config (`.evyasys/project.yaml`) and credentials (`~/.evyasys/credentials`) are **never touched**.

## When to run it

- To pull the latest plugin version from GitHub.
- When commands are missing or broken after a Claude Code update.
- As the first step in any troubleshooting — a clean reinstall fixes most issues.

## What happens after

Run the three reinstall commands shown in the output:

| Step | Command |
|---|---|
| 1 | `/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git` |
| 2 | `/plugin install evyasys@EvyaGovernance` |
| 3 | `/reload-plugins` |

## Usage

```
/evyasys:Update
```

No arguments needed.
