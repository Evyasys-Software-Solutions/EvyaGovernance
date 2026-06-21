---
description: Update the Evyasys plugin and manage context compression — shows version diff, changelog highlights, asks for confirmation, then always asks about compression state. Project config, credentials, docs, and board artefacts are never touched.
allowed-tools: Read
skill: evyasys-update
---

You are running **/evyasys:Update**.

## Step 1 — Explain what will happen

Tell the user:
- The command checks your current plugin version against the latest on GitHub and shows what's new
- After confirming, you will also be asked about context compression (update / enable / disable / keep)
- Then you will be shown 3 commands to run to complete the plugin update
- `.evyasys/` docs, board artefacts, `project.yaml`, and `~/.evyasys/credentials` are **never touched**
- If commands are still missing or broken after updating, run `/evyasys:Repair`

## Step 2 — Ask for plugin update confirmation

Ask the user to confirm they want to proceed with the plugin update before doing anything else.

**Stop here until the user confirms.**

## Step 3 — Check compression state and ask

Use the Read tool to read `~/.evyasys/settings.json` (ignore error if file does not exist).

Show the user their current compression status and ask one clear question:

**If `compress.enabled` is `true`:**
> **Context compression:** ✅ Enabled (v`{compress.version}`)
>
> What would you like to do?
> **(U) Update** — upgrade the compression engine to the latest version
> **(K) Keep** — leave it as-is
> **(D) Disable** — turn off compression

**If `compress.enabled` is `false`:**
> **Context compression:** ❌ Disabled
>
> **(E) Enable** — install and activate compression (requires Python 3.8+)
> **(K) Keep disabled** — leave it off

**If `~/.evyasys/settings.json` does not exist or has no `compress` key:**
> **Context compression:** ⚙️ Not configured on this machine
>
> **(E) Enable** — install and activate compression (requires Python 3.8+)
> **(S) Skip** — configure later via `/evyasys:Update`

Wait for the user's answer.

## Step 4 — Output markers

Output **exactly** these two lines and nothing else after them.

Choose the compress marker based on the Step 3 answer:

| User chose | Marker |
|---|---|
| Update / Enable | `<!-- EVYACOMPRESS update -->` |
| Disable | `<!-- EVYACOMPRESS disable -->` |
| Keep / Skip | `<!-- EVYACOMPRESS skip -->` |

```
<!-- EVYAUPDATE confirmed -->
<!-- EVYACOMPRESS update|disable|skip -->
```
