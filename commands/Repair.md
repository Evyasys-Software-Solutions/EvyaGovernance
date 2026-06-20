---
description: Repair a broken Evyasys plugin installation — clears the plugin cache and shows the full reinstall commands. Run this when commands are missing or broken and /evyasys:Update did not fix it. Project config, credentials, docs, and board artefacts are never touched.
allowed-tools: Read
skill: evyasys-repair
---

You are running **/evyasys:Repair**.

1. Tell the user clearly what will happen:
   - Plugin cache (`~/.claude/plugins/cache/EvyaGovernance`) will be cleared
   - Marketplace source (`~/.claude/plugins/marketplaces/EvyaGovernance`) will be cleared
   - The evyasys plugin entry will be removed from Claude Code settings files so reinstall works cleanly
   - After cleanup, you will be shown 4 commands for a complete fresh reinstall
   - `.evyasys/` docs, board artefacts, `project.yaml`, `~/.evyasys/credentials`, and memory are **never touched** — only plugin code is removed

2. Ask the user to confirm before proceeding.

3. On confirmation, output **exactly** this block and nothing else after it:

<!-- EVYAREPAIR confirmed -->
