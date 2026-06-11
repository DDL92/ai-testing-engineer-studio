# Source Quality Scoring

`npm run sources:report` scores each configured source from 0-100 using local lead, opportunity, conversion, and close data.

## Scoring Signals

- Produces hot leads: +30
- Produces warm leads: +20
- High average lead score: up to +20
- Produces leads with website/contact info: +10
- Matches QA Automation keywords: +15
- Produces contacted/proposal/won signals: +20
- Mostly ignored or low-quality leads: -25
- No usable output: -20
- Manual paid/login source warning: -10

## Categories

- 80-100: excellent
- 60-79: good
- 40-59: experimental
- 0-39: low priority

## Decisions

- Keep excellent and good sources.
- Add more sources similar to excellent sources.
- Improve keywords for experimental sources.
- Disable low-priority sources unless manual review shows strong fit.
- Keep Upwork and LinkedIn manual only.
