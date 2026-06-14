# Mac Lead Discovery Setup

Generated: 2026-06-14T00:33:21.760Z

This guide sets up a local Mac launchd job for 7:00 AM. It does not install anything automatically.

## Daily Commands
- npm run lead:daily-discovery
- npm run lead:daily-ranking
- npm run lead:daily-summary
- npm run dashboard:generate

## LaunchAgent Plist

Save this plist at `/Users/danieldeleon/Library/LaunchAgents/com.ai-testing-engineer-studio.lead-discovery.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ai-testing-engineer-studio.lead-discovery</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd /Users/danieldeleon/ai-testing-engineer-studio &amp;&amp; npm run lead:daily-discovery &amp;&amp; npm run lead:daily-ranking &amp;&amp; npm run lead:daily-summary &amp;&amp; npm run dashboard:generate</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>7</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/danieldeleon/ai-testing-engineer-studio/output/lead-discovery/daily-launchd.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/danieldeleon/ai-testing-engineer-studio/output/lead-discovery/daily-launchd.log</string>
</dict>
</plist>
```

## Manual Load Commands

```bash
launchctl unload /Users/danieldeleon/Library/LaunchAgents/com.ai-testing-engineer-studio.lead-discovery.plist 2>/dev/null || true
launchctl load /Users/danieldeleon/Library/LaunchAgents/com.ai-testing-engineer-studio.lead-discovery.plist
launchctl start com.ai-testing-engineer-studio.lead-discovery
```

## Safety Rules
- Local-first lead discovery only.
- No LinkedIn scraping.
- No login scraping.
- No paid APIs.
- No aggressive crawling.
- No outreach, emails, CRM updates, meetings, invoices, payments, or external actions are performed.
- No outcomes, replies, clients, meetings, proposals, wins, losses, revenue, or client interest are invented.
- Human approval is required before promoting, contacting, auditing, proposing, or sending anything.
