#!/usr/bin/env bash
# Evyasys plugin setup (Linux / macOS).
# Run once on each developer's machine right after cloning this folder.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say()  { printf "\033[1;36m[evyasys]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[evyasys]\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m[evyasys]\033[0m ✓ %s\n" "$*"; }

say "Setting up Evyasys plugin in $ROOT"

# 1. Tooling
command -v node >/dev/null    || warn "node not found — JS hooks/integrations will not run."
command -v python3 >/dev/null || warn "python3 not found — Python helpers will not run."

# 2. Optional: Python 'requests' (only needed for live calls)
if command -v python3 >/dev/null; then
  if python3 -c "import requests" >/dev/null 2>&1; then
    ok "Python 'requests' is available."
  else
    warn "Python 'requests' missing. Run: python3 -m pip install requests --user"
  fi
fi

# 3. Validate critical files
for f in \
  .claude-plugin/plugin.json \
  commands/command.json \
  hooks/evyasys-load-context.js \
  .ai/manifest.yaml \
  .ai/memory/evyaflow.json \
  .ai/workflows/create-story/PROMPT.md \
  .ai/workflows/create-subtask/PROMPT.md \
  .ai/workflows/start-dev/PROMPT.md \
  .ai/workflows/finish-dev/PROMPT.md \
  .ai/workflows/start-qa/PROMPT.md \
  .ai/workflows/finish-qa/PROMPT.md \
  scripts/login.sh \
  project-template/.evyasys/project.yaml.example; do
  if [ ! -f "$f" ]; then
    warn "Missing $f"
  else
    ok "OK: $f"
  fi
done

ok "Plugin scaffold validated."

cat <<EOF

  Next steps:

  1) Register the plugin in Claude Code:
       /plugin marketplace add $ROOT
       /plugin install evyasys@EvyaGovernance
     Then fully quit and reopen Claude Code.

  2) For each project, open Claude Code from within that project folder and run:
       /evyasys:Setup

  3) Commands:
       /evyasys:TrainDocs                  — scan codebase, generate 20 quality-gate docs
       /evyasys:CreateStory                — draft a user story (handles epics)
       /evyasys:CreateSubtask <StoryID>    — decompose story into developer tasks
       /evyasys:StartDev <StoryID>         — technical brainstorm + kick off development
       /evyasys:ReviewDev <StoryID>        — independent code review
       /evyasys:FinishDev <StoryID>        — AC audit + hand off to QA
       /evyasys:StartQa <StoryID>          — generate comprehensive test plan
       /evyasys:FinishQa <StoryID>         — QA sign-off + release notes
       /evyasys:GenerateReleaseNote <IDs>  — compile branded PDF release notes
       /evyasys:Update                     — update plugin to latest version

EOF
