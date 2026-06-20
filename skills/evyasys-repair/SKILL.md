---
name: evyasys-repair
description: Repairs a broken Evyasys plugin installation — clears the plugin cache and marketplace directories, removes the old plugin entry from settings, and shows the 4 commands for a full clean reinstall. Run this when /evyasys:Update doesn't fix missing or broken commands. Project config, credentials, docs, and board artefacts are never touched.
trigger: /evyasys:Repair
---

# evyasys:Repair

Full clean reinstall for a broken Evyasys plugin installation.

## What it does

1. Asks for confirmation before touching anything.
2. Clears `~/.claude/plugins/cache/EvyaGovernance`.
3. Clears `~/.claude/plugins/marketplaces/EvyaGovernance`.
4. Removes the evyasys plugin entry from all Claude Code settings files (user, project, local).
5. Shows 4 commands to do a complete fresh reinstall from scratch.

Project config (`.evyasys/project.yaml`), credentials (`~/.evyasys/credentials`), docs, board artefacts, and memory are **never touched** — only plugin code is removed.

## When to run it

- Commands are missing or broken after a Claude Code update.
- `/evyasys:Update` ran but commands still don't appear.
- Plugin appears installed but commands don't autocomplete.
- Any plugin-related problem that a normal update doesn't fix.

## What happens after

Run these commands inside Claude Code — in order:

| Step | Command |
|---|---|
| 1 | `/reload-plugins` |
| 2 | `/plugin marketplace add https://github.com/Evyasys-Software-Solutions/EvyaGovernance.git` |
| 3 | `/plugin install evyasys@EvyaGovernance` |

When prompted at step 3, choose **Install for you (user scope)**, then **fully quit Claude Code and reopen it**.

## Usage

```
/evyasys:Repair
```

No arguments needed.
