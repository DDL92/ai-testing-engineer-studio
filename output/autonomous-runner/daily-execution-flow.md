# Daily Execution Flow

The autonomous runner executes these commands sequentially. It does not send outreach, install launchd, or create client activity.

```bash
npm run web:lead-discovery
npm run web:pain-mining
npm run web:lead-normalize
npm run web:lead-classify
npm run web:lead-qualify
npm run web:qualified-ranking
npm run revenue:focus
npm run day:plan
npm run dashboard:generate
npm run mobile:summary
```
