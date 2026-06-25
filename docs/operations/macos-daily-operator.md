# macOS Daily Revenue Operator

The local operator prepares a manual revenue plan at 7:30 AM. It does not send outreach.

## Install

```bash
bash scripts/macos/install-daily-operator.sh
```

The installer resolves the repository and npm paths, validates the generated plist, replaces an older job with the same label, and writes logs under `runtime/daily-operator/`.

## Manual test

```bash
bash scripts/macos/run-daily-operator.sh
```

## Uninstall

```bash
bash scripts/macos/uninstall-daily-operator.sh
```

## Optional auto-open

Set `STUDIO_AUTO_OPEN_DAILY_PLAN=true` in the local `.env` or `.env.local` file to open the Markdown plan after a successful run. The default is false.

The plist contains paths and scheduling configuration only. Credentials remain in ignored local environment files and are loaded by the runner.
