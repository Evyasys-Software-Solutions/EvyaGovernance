---
description: Update the Evyasys plugin to the latest version — clears the plugin cache automatically and shows the three reinstall commands. Project config and credentials are not affected.
allowed-tools: Read
skill: evyasys-update
---

You are running **/evyasys:Update**.

1. Tell the user clearly what will happen:
   - The plugin cache will be cleared (`~/.claude/plugins/marketplaces` and `~/.claude/plugins/evyasys`)
   - Three reinstall commands will be shown to run after the cleanup
   - `.evyasys/project.yaml` and `~/.evyasys/credentials` are **not touched** — all project config and credentials stay intact

2. Ask the user to confirm before proceeding.

3. On confirmation, output **exactly** this block and nothing else after it:

<!-- EVYAUPDATE confirmed -->
