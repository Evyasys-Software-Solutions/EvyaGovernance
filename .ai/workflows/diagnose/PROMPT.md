# Prompt: /evyasys:Diagnose

You are the **Plugin Diagnostician** described in `AGENT.md`.

Run the 20 checks below in **parallel where possible** and produce a single compact
report. Total target time: under 15 seconds. Read-only — never modifies state.

---

## The checks

### Plugin install (5)

1. **Plugin dir resolves** — run the locator that all delivery commands use:
   - macOS/Linux: `find ~/.claude/plugins -maxdepth 6 -type d -name .ai 2>/dev/null | grep -i EvyaGovernance | head -1`
   - Windows: `Get-ChildItem "$env:USERPROFILE\.claude\plugins" -Recurse -Directory -Filter .ai -EA SilentlyContinue | Where FullName -like '*EvyaGovernance*' | Select -First 1 -Expand FullName`
   - PASS if a path prints; FAIL with fix "run `/evyasys:Repair`" otherwise.
2. **All 14 command files present** in `<plugin-root>/commands/*.md`.
   - Expected: `Setup, TrainDocs, CreateFunctionalDocs, CreateStory, CreateSubtask, StartDev, ReviewDev, FinishDev, StartQa, FinishQa, Deliver, GenerateReleaseNote, Update, Repair, Diagnose`.
   - FAIL if any missing.
3. **All 14 skill directories** present in `<plugin-root>/skills/evyasys-*/`.
4. **All required workflow directories** present in `<plugin-root>/.ai/workflows/` — one per delivery workflow.
5. **Compression engine (headroom)** — run `headroom --version` and check `~/.evyasys/settings.json` `compress.enabled`.
   - PASS if enabled and on PATH; WARN otherwise with fix "run `/evyasys:Update` to enable" or "compression is off by user preference (fine)".

### Project config (4)

6. **`.evyasys/project.yaml` valid** — file exists and parses.
7. **Credentials decrypt** — run: `node -e "const c = require('<plugin-root>/scripts/lib/config').loadConfig({}); console.log('ok')"` — PASS if it doesn't throw.
8. **PM tool configured** — `cfg.pmTool` is one of `local, devops, jira, github` and required fields are non-empty.
9. **Notification tool configured** — `cfg.notificationTool` and required fields present (or `none`, which is fine).

### Integrations reachability (3)

10. **PM tool reachable** — invoke `credential-validator.js` for the configured PM tool.
    - PASS on `ok: true`, FAIL with the returned message and "run `/evyasys:Setup`".
    - SKIP if `pmTool === 'local'` (no credentials to check).
11. **Notification tool reachable** — invoke `credential-validator.js` for the configured channel.
    - Teams/Slack: dry-check the webhook URL host resolves (DNS only — no test message posted).
    - SKIP if `notificationTool === 'none'`.
12. **Compression MCP registered** — check `~/.claude/settings.json` `mcpServers` for a `headroom`
    entry. PASS if present, WARN otherwise with fix "run `/evyasys:Update`".

### Docs & memory (4)

13. **Universal quality-gate docs present** — check `.evyasys/docs/` has ARCHITECTURE.md, RULES.md,
    STANDARDS.md, PATTERNS.md, ERROR_HANDLING.md, DTO_STANDARDS.md, RBAC.md.
    - FAIL if missing with fix "run `/evyasys:TrainDocs`".
14. **Docs freshness** — check the mtime of the most-recently-updated doc in `.evyasys/docs/`.
    - PASS if within 90 days.
    - WARN if 90–180 days with fix "run `/evyasys:TrainDocs --retrain`".
    - FAIL if older than 180 days with same fix.
15. **CONTEXT.md present** — check `.evyasys/CONTEXT.md` exists.
    - WARN if missing with fix "will be created on next TrainDocs / Deliver run".
16. **Functional docs (optional)** — check `.evyasys/docs/functional/` for at least one file.
    - PASS if present; SKIP if absent (they are optional).

### Board consistency (2)

17. **Every board story has `_UserStory.md`** — Glob `.evyasys/board/**/EVYA-*/` and check each has the file.
    - Report any orphaned story folders (no user story file).
18. **Every synced story has an ado-map entry** — check `.evyasys/.ado-map.json` covers every
    story folder present. Any missing entries → WARN with the specific story IDs.

### Git state (2)

19. **In a git repository** — `git rev-parse --is-inside-work-tree`. FAIL if not.
20. **Default branch detected** — `git symbolic-ref refs/remotes/origin/HEAD` OR `main` OR `master` exists.
    - Report the detected default branch.

---

## Output format

Print one line per check, then a summary. Use these prefixes exactly:

```
🩺  Evyasys Diagnostics — <ISO datetime>
    Plugin: v<X.Y.Z> · project: <name> · pm: <tool> · notify: <tool>

Plugin install
  ✅ 1  Plugin dir resolves — <path>
  ✅ 2  14/14 commands present
  ✅ 3  14/14 skills present
  ✅ 4  9/9 workflow dirs present
  ⚠️  5  Compression engine not installed — run /evyasys:Update to enable

Project config
  ✅ 6  project.yaml valid
  ✅ 7  Credentials decrypt (AES-256-GCM v2)
  ✅ 8  PM tool: devops (org=<org>, project=<project>)
  ✅ 9  Notification tool: teams (webhook stored in project.yaml)

Integrations reachability
  ✅ 10 Azure DevOps API reachable (org verified via /_apis/projects)
  ✅ 11 Teams webhook DNS resolves
  ⚠️  12 Compression MCP not registered — run /evyasys:Update

Docs & memory
  ✅ 13 7/7 universal quality-gate docs present
  ⚠️  14 Docs last updated 2026-05-14 (90d ago) — run /evyasys:TrainDocs --retrain
  ✅ 15 CONTEXT.md present (last regenerated 2026-08-12)
  ✅ 16 Functional docs: 4 modules documented

Board consistency
  ✅ 17 12/12 board stories have _UserStory.md
  ✅ 18 ado-map covers all board stories

Git state
  ✅ 19 Inside a git repository (branch: feature/EVYA-1042-invoice)
  ✅ 20 Default branch detected: main (via origin/HEAD)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: 18/20 PASS · 2 WARN · 0 FAIL · 0 SKIP

Issues to address:
  1. [WARN] Compression not installed — run `/evyasys:Update` (optional; delivery still works)
  2. [WARN] Docs are 90 days old — run `/evyasys:TrainDocs --retrain` to refresh
```

Use these symbols consistently:
- ✅ PASS — check passed
- ⚠️  WARN — check passed with a caveat, or is optional and inactive
- ❌ FAIL — check failed; the fix is REQUIRED before delivery commands will work
- ➖ SKIP — check not applicable (e.g. pmTool=local skips API reachability)

Emit no artefacts — just the report. The hook only prints a single confirmation line
that the diagnostics ran.

---

## Structured tail (for the hook)

After the human-readable report, append one structured block:

```
<!-- EVYADIAGNOSE
{
  "ranAt": "2026-08-12T10:30:00.000Z",
  "pluginVersion": "1.5.0",
  "checks": {
    "pass": 18, "warn": 2, "fail": 0, "skip": 0
  },
  "issues": [
    { "id": 5,  "level": "WARN", "summary": "Compression not installed", "fix": "/evyasys:Update" },
    { "id": 14, "level": "WARN", "summary": "Docs 90 days old", "fix": "/evyasys:TrainDocs --retrain" }
  ]
}
-->
```

The hook uses this to print a one-liner tally to the user and (in future versions)
to update `.evyasys/diagnostics.json` for trend tracking. Not written today.
