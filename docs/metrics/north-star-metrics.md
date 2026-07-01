# North Star Metrics

These metrics should guide future AI Lead Discovery Studio work during validation mode. Future sprints should improve at least one of these without increasing risk, cost, or false positives.

## Primary Metrics

| Metric | Definition | Why it matters | Target direction | Eventually measured in |
| --- | --- | --- | --- | --- |
| Cost per approved opportunity | Tavily/search/extract credits used divided by human-approved opportunities. | Shows whether paid discovery is economically viable. | Down | Tavily ledger, review history, Source Quality v2 |
| Approved opportunity rate | Approved opportunities divided by reviewed candidates. | Measures real lead quality after human review. | Up | Review state and review history |
| Verification review rate | Verification-review candidates divided by delivery candidates or search candidates. | Shows whether the system produces candidates worth manual validation. | Up, with false positives controlled | Verification queue and delivery reports |
| False positive rate | False positives divided by reviewed or promoted candidates. | Protects Daniel's time and client trust. | Down | Review decisions, regression suite, false-positive learning |
| Client acceptance rate | Client-accepted delivered opportunities divided by delivered opportunities. | Measures whether lead packs are useful to paying clients. | Up | Delivery pack outcomes and client feedback |
| Pilot close rate | Closed pilots divided by qualified pilot opportunities. | Connects discovery quality to revenue. | Up | Pilot pack, call tracker, outcomes |
| Monthly recurring revenue | Real recurring revenue booked per month. | Ultimate business health metric. | Up | Finance tracking, outcome learning, revenue dashboard |

## Secondary Metrics

| Metric | Definition | Why it matters | Target direction | Eventually measured in |
| --- | --- | --- | --- | --- |
| Tavily credits used | Estimated or actual Tavily credits consumed in the month. | Keeps discovery inside the low-cost operating model. | Controlled, within budget | Tavily credit ledger and budget plan |
| Credits per run | Estimated search + extract + buffer credits per scheduled run. | Prevents accidental overuse. | Stable or down | Tavily allocation |
| Lead-like percentage | Lead-like and possibly lead-like candidates divided by search candidates. | Early indicator of query quality. | Up | Search candidates and dashboard |
| Delivery candidate count | Non-excluded delivery candidates generated per run. | Measures usable pipeline volume. | Up, while quality stays high | Delivery candidate reports |
| Review minutes per day | Manual time spent reviewing candidates and packs. | Ensures the system stays usable for a solo operator. | Down | Manual time log or future review tracker |
| Source quality score | Source Quality v2 score by source/query/client group. | Guides budget allocation toward better sources. | Up | Source Quality v2 |
| Query success rate | Successful provider queries divided by attempted provider queries. | Detects provider, query, or guardrail problems. | Up | Search diagnostics and provider health |
| Provider failure rate | Provider errors, timeouts, rate limits, and parser failures divided by attempted provider queries. | Protects live run reliability and avoids wasted credits. | Down | Search diagnostics and provider health |

## Operating Rule

Do not add a feature only because it is technically possible. Add or tune work only when it improves one or more primary metrics, or when a secondary metric is blocking primary metric improvement.

