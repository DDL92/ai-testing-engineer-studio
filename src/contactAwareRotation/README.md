# Contact-Aware Lead Rotation

Evaluates up to five commercially usable leads in rank order and selects the first lead with a verified Contact Discovery primary contact.

Fresh contact results are reused for seven days. Discovery reruns when data is missing or stale, or when `--refresh` is supplied. Search-provider failures stop rotation safely.

```bash
npm run lead:rotate:contact-aware
npm run lead:rotate:contact-aware -- --max-leads 5
npm run lead:rotate:contact-aware -- --refresh
npm run lead:rotate:contact-pack
```

No outreach is sent.
