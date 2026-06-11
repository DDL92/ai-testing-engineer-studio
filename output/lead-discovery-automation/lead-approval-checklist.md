# Lead Approval Checklist

Generated: 2026-06-11T21:26:59.178Z

Use this checklist before turning a manually discovered candidate into a local lead record.

- [ ] Company exists.
- [ ] Website works.
- [ ] Public product/service visible.
- [ ] Likely SaaS or service business.
- [ ] Relevant workflows exist.
- [ ] QA pain likely.
- [ ] No private data used.
- [ ] No scraping used.
- [ ] No contact automation.
- [ ] Daniel approves before adding.

## Approval Output

If every relevant box is checked and Daniel approves the lead, add it locally with:

```sh
npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "Industry" --source "Manual research" --notes "Reason this lead fits."
```

If any required box is unclear, keep the company out of `data/leads.json` until manual review is complete.
