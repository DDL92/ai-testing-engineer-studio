# Audit Offer Framework

The offer ladder stays simple and bounded:

```text
QA Audit -> Playwright Starter Pack -> QA Automation Retainer
```

Agency path:

```text
QA Audit -> Agency Partner Retainer
```

The goal is to reduce release risk, catch regressions earlier, make QA repeatable, and support faster delivery without promising perfect quality, guaranteed revenue, or unlimited QA.

## Package Comparison

| Package | Price Range | Best For | Primary Outcome |
| --- | --- | --- | --- |
| QA Audit | $199-$500 | Initial risk review, QA opportunity discovery, small first engagement | Clear risk picture and automation roadmap |
| Playwright Starter Pack | $900-$1,500 | Teams that need a first automation foundation | Small CI-ready smoke test foundation |
| QA Automation Retainer | $1,500-$3,000/month | Teams that need recurring QA coverage and maintenance | Ongoing automation support and reporting |

## QA Audit

Problem solved:
The client does not know where QA risk is highest or what to automate first.

Deliverables:

- QA risk review
- Homepage or product-flow smoke review
- Evidence screenshots
- Prioritized findings
- Automation recommendations
- Next-step roadmap

Price range:
$199-$500.

When to recommend:

- Lead score is 6 or lower.
- The lead is qualified but not ready for a larger automation package.
- No reviewed audit evidence exists yet.
- A small, low-risk first engagement is the safest path.

Upsell path:
QA Audit -> Playwright Starter Pack.

## Playwright Starter Pack

Problem solved:
The client needs a small first automation foundation that makes release checks more repeatable.

Deliverables:

- Playwright setup
- Smoke test suite
- Critical flow coverage
- Screenshots/traces on failure where configured
- Basic CI-ready structure
- README/run instructions

Price range:
$900-$1,500.

When to recommend:

- Lead score is 7-8.
- Audit output shows automation opportunities.
- The client has public or staging-safe workflows to cover.
- The team needs a first practical automation layer, not a large retainer yet.

Upsell path:
Playwright Starter Pack -> QA Automation Retainer.

## QA Automation Retainer

Problem solved:
The client needs recurring QA automation coverage, maintenance, risk visibility, and reporting.

Deliverables:

- Test maintenance
- New smoke/regression coverage
- Monthly QA report
- Defect/risk summary
- CI monitoring recommendations
- Automation roadmap updates

Price range:
$1,500-$3,000/month.

When to recommend:

- Lead score is 8 or higher.
- The lead is marked as a QA Automation Retainer fit.
- There is recurring release risk or recurring test maintenance need.
- A discovery call confirms ongoing QA value.

Upsell path:
Expand monthly scope only after delivered value and workload justify it.

## Agency Partner Retainer

Problem solved:
An agency needs repeatable QA support for launches, maintenance clients, or multiple web/product builds.

Deliverables:

- Bounded partner QA support
- Launch smoke coverage
- Failure review
- Client-ready QA summaries where appropriate
- Automation recommendations for approved client workflows

Price range:
Use QA Automation Retainer range as the starting point: $1,500-$3,000/month.

When to recommend:

- Lead is marked as `agency-partner-retainer`.
- The agency has recurring client work.
- QA support can be bounded by projects, workflows, or monthly capacity.

Upsell path:
QA Audit -> Agency Partner Retainer.

## What Not To Include

- Unlimited QA.
- Guaranteed revenue.
- Perfect quality promises.
- Zero-defect guarantees.
- Production fixes unless separately scoped.
- Login, account, or payment testing unless explicitly approved.
- Security testing, penetration testing, or compliance certification.
- Performance scores unless Lighthouse or equivalent evidence is explicitly generated and reviewed.
- Accessibility compliance claims unless a proper accessibility scope is approved and completed.

## Recommendation Rules

- Recommend QA Audit when score is 6 or lower.
- Recommend Playwright Starter Pack when score is 7-8 or audit output shows automation opportunities.
- Recommend QA Automation Retainer when score is 8 or higher and the lead is marked `qa-automation-retainer`.
- Recommend Agency Partner Retainer when the lead is marked `agency-partner-retainer`.

All recommendations are draft recommendations. Daniel must review fit, price, scope, and message before sending anything externally.
