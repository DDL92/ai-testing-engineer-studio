# Lead Scoring

Leads are scored deterministically from 0-100.

## Positive Signals

- SaaS or web product company: +20
- Has active website: +10
- Has login/signup/dashboard/app indicators: +15
- Mentions QA/testing/automation/bug/regression/release: +20
- Agency or software studio: +15
- Uses modern web stack indicators: +10
- Has hiring/job post for QA/Automation/SDET: +20
- Budget or commercial intent detected: +10
- Good fit for Playwright: +20

## Red Flags

- Unclear business: -10
- No website: -15
- Low budget: -20
- Irrelevant industry: -15
- Spammy or low-quality source: -20

## Categories

- 80-100: hot
- 50-79: warm
- 20-49: low
- 0-19: ignore
