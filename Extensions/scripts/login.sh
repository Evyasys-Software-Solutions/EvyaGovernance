#!/usr/bin/env bash
# Capture this user's Azure DevOps PAT and store it at ~/.evyasys/credentials (0600).
# Run once per machine. Safe to re-run to update the PAT.
set -euo pipefail

CRED_DIR="${HOME}/.evyasys"
CRED_FILE="${CRED_DIR}/credentials"

echo "[evyasys] Azure DevOps PAT setup"
echo "Generate one at https://dev.azure.com/<org>/_usersSettings/tokens"
echo "Scope needed: Work Items (Read & write)."
echo ""
read -r -s -p "Paste your PAT (input hidden): " PAT
echo ""
if [ -z "${PAT}" ]; then
  echo "[evyasys] no PAT provided — aborting."
  exit 1
fi

mkdir -p "${CRED_DIR}"
chmod 700 "${CRED_DIR}"

# Replace existing AZURE_PAT line if present, else append.
if [ -f "${CRED_FILE}" ] && grep -q '^AZURE_PAT=' "${CRED_FILE}"; then
  tmp="${CRED_FILE}.tmp.$$"
  awk -v pat="$PAT" 'BEGIN{done=0}
    /^AZURE_PAT=/ { print "AZURE_PAT=" pat; done=1; next }
    { print }
    END { if (!done) print "AZURE_PAT=" pat }
  ' "${CRED_FILE}" > "${tmp}"
  mv "${tmp}" "${CRED_FILE}"
else
  echo "AZURE_PAT=${PAT}" >> "${CRED_FILE}"
fi
chmod 600 "${CRED_FILE}"

echo "[evyasys] saved AZURE_PAT to ${CRED_FILE} (mode 600)"
