# Message Quality Rules

The message quality checker runs on every optimized draft from `message:optimize` and `lead:optimize`.

## Checks

- Overclaiming or guarantees
- Saying bugs were found without audit evidence
- Claiming private app, dashboard, or logged-in testing without scope
- Messages that are too long
- Messages that are too generic
- Salesy or spam-like phrasing
- Missing CTA
- Missing QA automation relevance
- Unsupported revenue or ROI claims
- Aggressive tone
- Spam-like automation language

## Output

Each optimized draft includes:

- Pass/fail status
- Warnings
- Suggested fixes
- Review-required header

## Operator Standard

Passing the checker does not mean a message should be sent automatically. Daniel still reviews the draft for accuracy, client fit, tone, evidence, and commercial judgment.
