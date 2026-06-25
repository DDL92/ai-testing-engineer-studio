# macOS Automation for AI Lead Discovery Studio

This document describes how to run the local daily lead workflow with `launchd`. It is documentation only. This sprint does not install a `.plist`.

## Schedule

- Days: Monday-Friday.
- Time: 7:30am Costa Rica time.
- Command: `npm run leads:daily`.
- Expected review time: outputs should be ready before the 8:00am manual review window, assuming the Mac is awake.

## Output Location

Daily files are generated in:

```text
output/lead-discovery/daily/
```

Expected files:

- `lead-pack-summary.md`
- `lead-pack-summary.csv`
- `top-leads.md`
- `review-needed.md`
- `delivery-ready-pack.md`

No outreach, email, DM, scraping, paid API, or form submission is performed.

## Example launchd plist

Create a local plist such as:

```text
~/Library/LaunchAgents/com.ai-testing-engineer-studio.leads.daily.plist
```

Example contents:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.ai-testing-engineer-studio.leads.daily</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd /Users/danieldeleon/ai-testing-engineer-studio && npm run leads:daily</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/danieldeleon/ai-testing-engineer-studio</string>

  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>30</integer></dict>
  </array>

  <key>StandardOutPath</key>
  <string>/tmp/ai-lead-discovery-daily.out.log</string>

  <key>StandardErrorPath</key>
  <string>/tmp/ai-lead-discovery-daily.err.log</string>
</dict>
</plist>
```

`launchd` uses the Mac’s local timezone. On Daniel’s Mac, keep the timezone set to Costa Rica if the 7:30am Costa Rica schedule matters.

## Load and unload

Validate the plist:

```bash
plutil -lint ~/Library/LaunchAgents/com.ai-testing-engineer-studio.leads.daily.plist
```

Load it:

```bash
launchctl load ~/Library/LaunchAgents/com.ai-testing-engineer-studio.leads.daily.plist
```

Unload it:

```bash
launchctl unload ~/Library/LaunchAgents/com.ai-testing-engineer-studio.leads.daily.plist
```

Run manually:

```bash
cd /Users/danieldeleon/ai-testing-engineer-studio
npm run leads:daily
```

## Requirements

- The Mac must be awake.
- `npm install` must have been run.
- The repository path in the plist must match the actual local path.
- No private credentials are required for the Sprint 3 local workflow.

## Troubleshooting

Check logs:

```bash
tail -100 /tmp/ai-lead-discovery-daily.out.log
tail -100 /tmp/ai-lead-discovery-daily.err.log
```

Check whether the job is loaded:

```bash
launchctl list | grep ai-testing-engineer-studio
```

Run the command directly:

```bash
cd /Users/danieldeleon/ai-testing-engineer-studio
npm run leads:daily
```

Confirm outputs:

```bash
ls -la output/lead-discovery/daily/
```
