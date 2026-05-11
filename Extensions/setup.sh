#!/usr/bin/env bash
# Evyasys plugin setup (Linux / macOS).
# Run once on each developer's machine right after cloning this folder.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say()  { printf "\033[1;36m[evyasys]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[evyasys]\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m[evyasys]\033[0m %s\n" "$*"; }

say "Setting up Evyasys plugin in $ROOT"

# 1. Tooling
command -v node >/dev/null    || warn "node not found — JS hooks/integrations will not run."
command -v python3 >/dev/null || warn "python3 not found — Python helpers will not run."

# 2. Optional: Python `requests` (only needed for live calls)
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

# 4. PAT
CRED="${HOME}/.evyasys/credentials"
if [ -f "$CRED" ] && grep -q '^AZURE_PAT=' "$CRED"; then
  ok "PAT already saved at $CRED"
else
  say "PAT not yet saved. Run: bash $ROOT/scripts/login.sh"
fi

cat <<EOF

$(ok "Plugin scaffold validated.")

Next steps:

  1) Register the plugin in your AI agent:
       /plugin marketplace add $ROOT
       /plugin install evyasys

  2) Save your PAT once per machine:
       bash $ROOT/scripts/login.sh

  3) For each project you want to use Evyasys in, drop a .evyasys/ folder:
       cp -r $ROOT/project-template/.evyasys <your-project>/.evyasys
       # Edit <your-project>/.evyasys/project.yaml
       git add .evyasys/project.yaml && git commit -m "Add Evyasys config"

  4) From inside that project, run any command:
       /EvyaCreateStory            — draft a user story
       /EvyaCreateSubtask EVYA-id  — decompose into dev tasks
       /EvyaStartDev EVYA-id       — kick off development
       /EvyaFinishDev EVYA-id      — hand off to QA
       /EvyaStartQa EVYA-id        — generate test plan
       /EvyaFinishQa EVYA-id       — release sign-off + notes

  TIP: add EVYASYS_DRY_RUN=1 to your shell to preview without touching ADO or Teams.
EOF
