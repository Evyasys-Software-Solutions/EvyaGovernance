---
description: Update the Evyasys plugin to the latest version — shows current vs new version, changelog highlights, and the 3 commands to complete the update. Project config, credentials, docs, and board artefacts are never touched.
allowed-tools: Read
skill: evyasys-update
---

You are running **/evyasys:Update**.

1. Tell the user clearly what will happen:
   - The command will check your current version against the latest on GitHub
   - It will show the version change (e.g. v1.0.0 → v1.1.0) and what's new from the changelog
   - After confirming, you will be shown 3 commands to run inside Claude Code to complete the update
   - `.evyasys/` docs, board artefacts, `project.yaml`, and `~/.evyasys/credentials` are **never touched**
   - If commands are still missing or broken after updating, run `/evyasys:Repair` for a full clean reinstall

2. Ask the user to confirm before proceeding.

3. On confirmation, output **exactly** this block and nothing else after it:

<!-- EVYAUPDATE confirmed -->
