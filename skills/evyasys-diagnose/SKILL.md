---
name: evyasys-diagnose
description: Use this skill to run a comprehensive read-only health check of the Evyasys plugin install and project state. Covers 20 checks across 6 areas — plugin install (dir resolution, all commands/skills/workflows present, compression engine status), project config (project.yaml validity, credentials decrypt, PM tool and notification config completeness), integrations reachability (PM tool API, notification webhook DNS, compression MCP), docs & memory (universal quality-gate docs presence, docs freshness, CONTEXT.md, functional docs), board consistency (every board story has _UserStory.md, ado-map coverage), and git state (in git repo, default branch detected). Reports each check as PASS/WARN/FAIL/SKIP with an actionable fix. Target under 15 seconds end-to-end. Never modifies state. Triggered by `/evyasys:Diagnose`.
trigger: /evyasys:Diagnose
---

# Skill: evyasys-diagnose

## Purpose

Detect drift, misconfiguration, credential expiry, or corrupted state **before** a delivery
command hits them. Report actionable fixes. Never modify state.

## What it checks (20 checks across 6 areas)

| Area | Checks | Notes |
|---|---|---|
| Plugin install (1–5) | Plugin dir resolves · commands present · skills present · workflows present · compression engine | Uses the same locator every delivery command uses |
| Project config (6–9) | `project.yaml` valid · credentials decrypt · PM tool configured · notification tool configured | Verifies AES-256-GCM v2 decryption round-trip |
| Integrations reachability (10–12) | PM API reachable · notification webhook DNS · compression MCP registered | Fast-fail on unreachable — no long retries in a diagnostic run |
| Docs & memory (13–16) | Universal docs present · docs freshness (90d / 180d thresholds) · CONTEXT.md present · functional docs | Age thresholds surface stale docs before they cause bad brainstorms |
| Board consistency (17–18) | Every story has `_UserStory.md` · ado-map covers every synced story | Detects orphaned board entries |
| Git state (19–20) | In git repo · default branch detected | Same detection Deliver uses (`origin/HEAD` → `main` → `master`) |

## Output

Human-readable report with per-check PASS/WARN/FAIL/SKIP + summary tally + issues-to-address list.

Also emits a structured `<!-- EVYADIAGNOSE { ... } -->` tail block that the hook uses for a
one-liner tally.

## What it does NOT do

- Never writes to `.evyasys/`
- Never edits `project.yaml`
- Never rotates credentials
- Never posts a test notification
- Never runs a PM state transition
- Never fixes anything automatically — reports what needs fixing, tells you the command to run

## Usage

```
/evyasys:Diagnose
```

Run before demos, after a plugin update, when a delivery command is behaving unexpectedly,
or on a periodic health-check cadence.
