#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE="${REPO_ROOT}/config/macos/com.aitestingengineer.studio.daily.plist.template"
RUNNER="${REPO_ROOT}/scripts/macos/run-daily-operator.sh"
NPM_BIN="$(command -v npm)"
LABEL="com.aitestingengineer.studio.daily"
INSTALL_PATH="${HOME}/Library/LaunchAgents/${LABEL}.plist"
LOG_DIR="${REPO_ROOT}/runtime/daily-operator"

mkdir -p "${HOME}/Library/LaunchAgents" "${LOG_DIR}"
chmod +x "${RUNNER}"

sed \
  -e "s|__RUNNER_PATH__|${RUNNER//&/\\&}|g" \
  -e "s|__WORKING_DIRECTORY__|${REPO_ROOT//&/\\&}|g" \
  -e "s|__NPM_PATH__|${NPM_BIN//&/\\&}|g" \
  -e "s|__STDOUT_PATH__|${LOG_DIR//&/\\&}/stdout.log|g" \
  -e "s|__STDERR_PATH__|${LOG_DIR//&/\\&}/stderr.log|g" \
  "${TEMPLATE}" > "${INSTALL_PATH}"

plutil -lint "${INSTALL_PATH}"
launchctl bootout "gui/${UID}/${LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/${UID}" "${INSTALL_PATH}"
launchctl enable "gui/${UID}/${LABEL}"

echo "Installed ${LABEL} at ${INSTALL_PATH}"
echo "Scheduled daily at 07:30 local time."
echo "Manual test: bash ${RUNNER}"
