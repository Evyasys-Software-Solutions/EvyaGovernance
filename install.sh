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

# ── 5. Register plugin in AI agent (before asking for credentials) ────────────
hr
say "Registering Evyasys plugin ..."
if command -v claude >/dev/null 2>&1; then
  claude --plugin marketplace add "$INSTALL_DIR" 2>/dev/null && \
  claude --plugin install evyasys 2>/dev/null && \
  ok "Plugin registered via CLI" || \
  warn "Auto-registration failed — see Step 1 in the summary below."
else
  warn "AI agent CLI not found — register manually (see Step 1 below)."
fi

# ── 6. Azure DevOps PAT ───────────────────────────────────────────────────────
hr
say "Azure DevOps Personal Access Token"
CRED="${HOME}/.evyasys/credentials"
if [ -f "$CRED" ] && grep -q '^AZURE_PAT=' "$CRED" 2>/dev/null; then
  ok "PAT already saved at $CRED"
else
  say "The PAT lets Evyasys create and update work items in your Azure DevOps project."
  say "Generate one at: https://dev.azure.com/<your-org>/_usersSettings/tokens"
  say "Scope needed: Work Items (Read & write)"
  echo ""
  read -r -s -p "  Paste your PAT (hidden) — or press Enter to skip: " PAT
  echo ""
  if [ -n "${PAT:-}" ]; then
    mkdir -p "${HOME}/.evyasys"
    chmod 700 "${HOME}/.evyasys"
    # Preserve any existing entries, replace or append AZURE_PAT
    if [ -f "$CRED" ]; then
      TMP="${CRED}.tmp.$$"
      grep -v '^AZURE_PAT=' "$CRED" > "$TMP" 2>/dev/null || true
      echo "AZURE_PAT=${PAT}" >> "$TMP"
      mv "$TMP" "$CRED"
    else
      echo "AZURE_PAT=${PAT}" > "$CRED"
    fi
    chmod 600 "$CRED"
    ok "PAT saved to $CRED (mode 600)"
  else
    warn "Skipped — run 'bash $INSTALL_DIR/scripts/login.sh' before using live commands."
  fi
fi

# ── 7. Microsoft Teams webhook ───────────────────────────────────────────────
hr
say "Microsoft Teams Webhook (optional default)"
if [ -f "$CRED" ] && grep -q '^TEAMS_WEBHOOK=' "$CRED" 2>/dev/null; then
  ok "Teams webhook already saved in $CRED"
else
  say "Evyasys can post cards to a Teams channel when stories are created or status changes."
  say "To get a webhook: open your Teams channel → Connectors → Incoming Webhook → copy the URL."
  say "(You can also set this per-project in .evyasys/project.yaml — press Enter to skip for now.)"
  echo ""
  read -r -p "  Paste your Teams webhook URL (or press Enter to skip): " WEBHOOK
  if [ -n "${WEBHOOK:-}" ]; then
    mkdir -p "${HOME}/.evyasys"
    chmod 700 "${HOME}/.evyasys"
    if [ -f "$CRED" ]; then
      TMP="${CRED}.tmp.$$"
      grep -v '^TEAMS_WEBHOOK=' "$CRED" > "$TMP" 2>/dev/null || true
      echo "TEAMS_WEBHOOK=${WEBHOOK}" >> "$TMP"
      mv "$TMP" "$CRED"
    else
      echo "TEAMS_WEBHOOK=${WEBHOOK}" > "$CRED"
    fi
    chmod 600 "$CRED"
    ok "Teams webhook saved to $CRED"
  else
    warn "Skipped — Evyasys will prompt for the webhook the first time a command needs it."
  fi
fi

# ── 8. Done ──────────────────────────────────────────────────────────────────
hr
ok "Evyasys installed at: $INSTALL_DIR"
hr
cat << EOF

  Next steps:

  1) If plugin auto-registration above failed, open your AI agent and run:
       /plugin marketplace add $INSTALL_DIR
       /plugin install evyasys

  2) For each project repo, drop the config folder:
       cp -r $INSTALL_DIR/project-template/.evyasys <your-project>/.evyasys
       # Edit .evyasys/project.yaml — fill in name, ADO org/project
       git add .evyasys/project.yaml && git commit -m "Add Evyasys config"

  3) From inside the project, run your first command:
       /EvyaCreateStory

  Commands:
    /EvyaCreateStory            — draft a user story (asks save folder, handles epics)
    /EvyaCreateSubtask EVYA-id  — decompose into dev tasks
    /EvyaStartDev EVYA-id       — brainstorm + kick off development
    /EvyaFinishDev EVYA-id      — AC audit + hand off to QA
    /EvyaStartQa EVYA-id        — generate test plan
    /EvyaFinishQa EVYA-id       — release sign-off + notes

  Dry-run (preview — no ADO/Teams changes):
    EVYASYS_DRY_RUN=1 /EvyaCreateStory

EOF
