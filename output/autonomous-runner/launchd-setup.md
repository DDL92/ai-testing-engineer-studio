# Launchd Setup

Target schedule: Monday-Friday at 07:00 AM America/Costa_Rica.

This file is instructions only. The runner does not install launchd automatically.

## Manual Install Steps
1. Review `output/autonomous-runner/launchd-plist.xml`.
2. Copy it manually to `~/Library/LaunchAgents/com.danieldeleon.ai-testing-engineer-studio.runner.plist`.
3. Load it manually with `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.danieldeleon.ai-testing-engineer-studio.runner.plist`.
4. Confirm with `launchctl print gui/$(id -u)/com.danieldeleon.ai-testing-engineer-studio.runner`.

## Test Command
```bash
npm run runner:test
```

Generated plist source: /Users/danieldeleon/ai-testing-engineer-studio/output/autonomous-runner/launchd-plist.xml

## Safety Rules
- No outreach is sent.
- No emails or LinkedIn messages are sent.
- No CRM records, meetings, invoices, payments, revenue, or client activity are created.
- Only existing local Studio commands are executed.
- Human approval is required before any external business action.
