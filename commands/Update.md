---
description: Update the Evyasys plugin to the latest version — clears the plugin cache automatically and shows the three reinstall commands. Project config and credentials are not affected.
allowed-tools: Read
skill: evyasys-update
---

You are running **/evyasys:Update**.

1. Tell the user clearly what will happen:
   - The plugin cache will be cleared (`~/.claude/plugins/cache/EvyaGovernance` and `~/.claude/plugins/marketplaces/EvyaGovernance`)
   - The evyasys entry will be removed from all Claude Code settings files automatically — no manual `/plugin uninstall` needed
   - The latest plugin source will be cloned from GitHub automatically — no manual `/plugin marketplace add` needed
   - After cleanup, only **2 commands** are needed to reinstall: `/reload-plugins` then `/plugin install evyasys@EvyaGovernance`
   - `.evyasys/project.yaml` and `~/.evyasys/credentials` are **not touched** — all project config and credentials stay intact

2. Ask the user to confirm before proceeding.

3. On confirmation, output **exactly** this block and nothing else after it:

<!-- EVYAUPDATE confirmed -->
