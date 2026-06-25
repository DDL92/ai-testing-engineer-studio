# AI Lead Discovery Studio Scoring Model

Lead scores use a practical 10-point model. A score is not permission to contact. It only ranks leads for human review.

## 10-Point Score

| Factor | Max | What Good Looks Like |
| --- | ---: | --- |
| Intent clarity | 2.0 | The person or business clearly states what they need. |
| Location relevance | 1.0 | Location matches the buyer’s service area. |
| Budget signal | 1.0 | Budget is stated or a credible buying signal is visible. |
| Urgency/date | 1.5 | A date, deadline, launch, event, or near-term need is visible. |
| Source quality | 1.5 | Source is public, recent, attributable, and reviewable. |
| Contactability | 1.0 | A safe public reply path or business contact path exists. |
| Fit with client offer | 1.5 | The need maps directly to what the buyer sells. |
| Duplicate/risk flags | 0.5 | No duplicate, spam, privacy, or low-fit risk is visible. |

Suggested interpretation:

- 8.0–10.0: strong lead for human review.
- 6.0–7.9: useful but needs validation.
- 4.0–5.9: weak or incomplete.
- Below 4.0: archive unless new evidence appears.

## Risk Flags

Risk flags reduce confidence and must be shown in the report:

- duplicate_possible
- source_context_weak
- old_or_stale_post
- personal_data_risk
- unclear_budget
- unclear_location
- low_commercial_fit
- manual_review_required

## Example: travel_leads

Strong travel lead:

- Intent clarity: 2.0 — asks for a 7-day Costa Rica itinerary.
- Location relevance: 1.0 — destination matches buyer coverage.
- Budget signal: 0.7 — says “mid-range boutique hotels.”
- Urgency/date: 1.3 — travel month is six weeks away.
- Source quality: 1.2 — public, recent, attributable source.
- Contactability: 0.8 — public reply path exists.
- Fit with client offer: 1.5 — buyer sells itinerary planning.
- Duplicate/risk flags: 0.4 — no duplicate, minor budget ambiguity.
- Total: 8.9/10.

Weak travel lead:

- Wants “ideas someday,” no date, no destination, no budget.
- Score should stay below 5 until more evidence appears.

## Example: catering_leads

Strong catering lead:

- Intent clarity: 2.0 — requests catering for a corporate lunch.
- Location relevance: 1.0 — venue is in the buyer’s city.
- Budget signal: 0.8 — shares guest count and service style.
- Urgency/date: 1.5 — event is in three weeks.
- Source quality: 1.2 — public request with enough context.
- Contactability: 0.8 — public reply path exists.
- Fit with client offer: 1.5 — buyer offers corporate catering.
- Duplicate/risk flags: 0.4 — no duplicate, dietary details incomplete.
- Total: 9.2/10.

Weak catering lead:

- Asks for “food ideas” with no event, guest count, date, or location.
- Score should remain low and require manual validation.
