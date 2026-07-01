# Validation Mode Guide

AI Lead Discovery Studio is now in validation mode. Build mode is mostly complete; the priority is to prove that the system can produce better, cheaper, reviewable opportunities.

## What To Do Now

1. Run live discovery only on scheduled Tavily days.
2. Do not run repeated `leads:morning`.
3. Review outputs after every live run.
4. Track lead-like percentage, delivery count, false positives, and cost.
5. Tune only based on real data.
6. Prioritize Flora pilot validation.
7. Stop adding features unless they improve the key validation questions.

## Daily Default Workflow

Use safe offline commands first:

```sh
npm run leads:operator
npm run leads:tavily-budget
npm run leads:tavily-allocation
npm run leads:live-readiness
npm run leads:dashboard
npm run repo:check
```

If live readiness is not ready, stay offline. Do not force live search outside the scheduler.

## After Every Approved Live Run

Review these outputs before changing queries or scoring:

- Search candidates.
- Search quality report.
- Delivery candidates.
- Verification review queue.
- Dashboard.
- Source Quality v2.
- Review decisions.
- Tavily credit usage.

Track:

- Lead-like percentage.
- Delivery candidate count.
- False positives.
- Cost per approved opportunity.
- Provider failures.
- Query failures.
- Review time.

## Key Validation Questions

Only add or tune work when it improves at least one of these:

- Does it improve lead search?
- Does it increase lead quantity?
- Does it increase lead quality?
- Does it reduce manual time?
- Does it reduce costs?
- Does it help close clients?
- Does it reduce false positives?

## Flora Pilot Priority

Flora remains the main validation path because it is closest to proving commercial value. Prioritize:

- Conversation-first query quality.
- Delivery candidate quality.
- Verification review quality.
- Pilot pack clarity.
- Client acceptance and close probability.

## Do Not Do This During Validation

- Do not run repeated live workflows to compensate for weak results.
- Do not add new providers before validating Tavily quality and cost.
- Do not add scraping, login automation, auto-DMs, contact extraction, or aggressive crawling.
- Do not tune classifiers from intuition alone.
- Do not promote zero-approval query types unless explicitly marked experimental and reviewed.
- Do not expand scope unless the north-star metrics show a bottleneck.

