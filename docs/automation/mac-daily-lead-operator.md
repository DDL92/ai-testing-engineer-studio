# Mac Daily Lead Operator Automation

Use either `launchd` or cron to run the lead operator automatically. The command does not send messages.

## launchd Example

Create `~/Library/LaunchAgents/com.daniel.ai-testing-lead-operator.plist` and adjust paths if needed:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.daniel.ai-testing-lead-operator</string>
    <key>WorkingDirectory</key>
    <string>/Users/danieldeleon/ai-testing-engineer-studio</string>
    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/bin/npm</string>
      <string>run</string>
      <string>lead:auto</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
      <key>Hour</key>
      <integer>8</integer>
      <key>Minute</key>
      <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/ai-testing-lead-operator.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ai-testing-lead-operator.err</string>
  </dict>
</plist>
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.daniel.ai-testing-lead-operator.plist
```

## Cron Example

Edit cron:

```bash
crontab -e
```

Add:

```cron
0 8 * * * cd /Users/danieldeleon/ai-testing-engineer-studio && npm run lead:auto >> /tmp/ai-testing-lead-operator.log 2>&1
```

## Daily Review

Review `sales-marketing-engine/operator/generated/daily-lead-summary.md` and every proposal draft before sending anything.
