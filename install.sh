#!/usr/bin/env bash
# Evyasys — one-command team install.
# Usage: bash install.sh [/path/to/install/location]
# Default install location: ~/tools/evyasys
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${1:-${HOME}/tools/evyasys}"

say()  { printf "\033[1;36m[evyasys]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[evyasys]\033[0m %s\n" "$*"; }
ok()   { printf "\033[1;32m[evyasys]\033[0m ✓ %s\n" "$*"; }
err()  { printf "\033[1;31m[evyasys]\033[0m ✗ %s\n" "$*"; }
hr()   { printf "\033[0;37m%s\033[0m\n" "────────────────────────────────────────"; }

hr
say "Evyasys Installer"
hr

# ── 1. Copy plugin to install location ──────────────────────────────────────
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
  say "Copying plugin to $INSTALL_DIR ..."
  mkdir -p "$INSTALL_DIR"
  cp -r "$SCRIPT_DIR/." "$INSTALL_DIR/"
  ok "Plugin copied to $INSTALL_DIR"
else
  ok "Running from install location: $INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# ── 2. Tooling checks ────────────────────────────────────────────────────────
say "Checking required tools ..."
MISSING_TOOLS=0

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node --version)
  ok "Node.js $NODE_VER"
else
  err "Node.js not found — JS hooks and integrations will not run."
  warn "Install from: https://nodejs.org/"
  MISSING_TOOLS=1
fi

if command -v python3 >/dev/null 2>&1; then
  PY_VER=$(python3 --version)
  ok "$PY_VER"
else
  err "Python 3 not found — repo scan will not run."
  warn "Install from: https://www.python.org/"
  MISSING_TOOLS=1
fi

if command -v python3 >/dev/null 2>&1; then
  if python3 -c "import requests" >/dev/null 2>&1; then
    ok "Python 'requests' available"
  else
    warn "Python 'requests' not installed — live ADO/Teams calls need it."
    warn "Run: python3 -m pip install requests --user"
  fi
fi

if command -v git >/dev/null 2>&1; then
  ok "git $(git --version | awk '{print $3}')"
else
  err "git not found — branch checks will not work."
  MISSING_TOOLS=1
fi

# ── 3. npm install (for node-fetch on older Node) ────────────────────────────
if command -v node >/dev/null 2>&1 && [ -f "$INSTALL_DIR/package.json" ]; then
  say "Installing Node dependencies ..."
  npm install --prefix "$INSTALL_DIR" --silent && ok "npm install done"
fi

# ── 4. Validate critical plugin files ────────────────────────────────────────
say "Validating plugin files ..."
ALL_OK=1
for f in \
  .claude-plugin/plugin.json \
  commands/command.json \
  hooks/evyasys-load-context.js \
  .ai/manifest.yaml \
  .ai/memory/evyaflow.json \
  .ai/workflows/create-story/PROMPT.md \
  .ai/workflows/create-subtask/PROMPT.md \
  .ai/workflows/start-dev/PROMPT.md \
  .ai/workflows/start-dev/BRAINSTORM_TEMPLATE.md \
  .ai/workflows/finish-dev/PROMPT.md \
  .ai/workflows/start-qa/PROMPT.md \
  .ai/workflows/finish-qa/PROMPT.md \
  scripts/integrations/azure_devops.js \
  scripts/integrations/teams_webhook.js \
  project-template/.evyasys/project.yaml.example; do
  if [ -f "$f" ]; then
    ok "$f"
  else
    err "Missing: $f"
    ALL_OK=0
  fi
done

[ "$ALL_OK" -eq 0 ] && warn "Some files are missing — the plugin may not work correctly."

# ── 5. Register plugin ────────────────────────────────────────────────────────
hr
say "Registering Evyasys plugin ..."
if command -v claude >/dev/null 2>&1; then
  claude --plugin marketplace add "$INSTALL_DIR" 2>/dev/null && \
  claude --plugin install evyasys@EvyaGovernance 2>/dev/null && \
  ok "Plugin registered via CLI" || \
  warn "Auto-registration failed — see Step 1 in the summary below."
else
  warn "AI agent CLI not found — register manually (see Step 1 below)."
fi

# ── 6. Done ───────────────────────────────────────────────────────────────────
hr
ok "Evyasys installed at: $INSTALL_DIR"
hr
cat << EOF

  Next steps:

  1) If plugin auto-registration above failed, open Claude Code and run:
       /plugin marketplace add $INSTALL_DIR
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
