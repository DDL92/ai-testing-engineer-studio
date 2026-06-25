#!/bin/bash
set -euo pipefail

LABEL="com.aitestingengineer.studio.daily"
INSTALL_PATH="${HOME}/Library/LaunchAgents/${LABEL}.plist"

launchctl bootout "gui/${UID}/${LABEL}" 2>/dev/null || true
rm -f "${INSTALL_PATH}"

echo "Uninstalled ${LABEL}."
