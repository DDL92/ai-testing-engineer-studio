# Current System Status

Generated for Sprint 38 repo hardening.

## Completed Modules

- Lead Discovery intake, query planning, safe search routing, enrichment, quality filtering, verification preparation, review simulation, regression suite, dashboard reporting, and operator brief.
- Tavily provider integration with cost budget guardrails and paused-state handling.
- Offline fixture simulation, golden regression, review simulation, false-positive learning, buyer role classification, and loop state persistence.
- Flora pilot delivery pack, commercial offer pack, meeting prep pack, call tracker, and client delivery router.

## Current System Status

- Architecture is stable.
- Offline validation workflows pass.
- Commercial materials are ready for Flora preparation.
- Live discovery is paused while Tavily credits are exhausted.

## Current Pause Reason

- `cost_budget_paused`
- Do not run Tavily-consuming commands until credits reset.

## Safe Commands

- `npm run typecheck`
- `npm run leads:safe-commands`
- `npm run leads:operator`
- `npm run leads:simulate`
- `npm run leads:regression`
- `npm run leads:review-simulate`
- `npm run leads:dashboard`
- `npm run leads:pilot-pack`
- `npm run leads:offer-pack`
- `npm run leads:meeting-prep`
- `npm run leads:call-tracker`
- `npm run leads:delivery-router`

## Blocked Commands

- `npm run leads:search`
- `npm run leads:morning`
- `npm run leads:daily`
- `npm run leads:test-provider`

## Known Risks

- Runtime and generated files can appear modified after validation runs.
- Tavily credits can be consumed if live search commands are run while paused.
- Existing output artifacts may look delivery-ready even when there are zero approved leads.
- Commercial materials are preparation assets and still require human review before client use.

## Next Recommended Action

Prepare and run the Flora conversation manually. Keep discovery paused until Tavily credits reset.
