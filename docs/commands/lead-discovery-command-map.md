# Lead Discovery Command Map

Use this map to decide which commands are safe during validation mode and which commands require human approval because they can spend Tavily credits.

## Safe Offline

| Command | Purpose | When to run | Uses Tavily | Risk |
| --- | --- | --- | --- | --- |
| `npm run leads:operator` | Generate the local daily operator brief. | Daily planning and status review. | No | Low |
| `npm run leads:safe-commands` | Print safe commands and blocked live commands. | Before uncertain operation or when budget is paused. | No | Low |
| `npm run leads:tavily-budget` | Generate budget health and schedule status. | Before any planned live run. | No | Low |
| `npm run leads:tavily-allocation` | Plan credit allocation by client and query bucket. | After Source Quality v2 or before live readiness. | No | Low |
| `npm run leads:live-readiness` | Check whether live search is currently allowed. | Before any live Tavily command. | No | Low |
| `npm run leads:simulate` | Run offline fixture simulation. | After classifier or query-quality changes. | No | Low |
| `npm run leads:regression` | Run golden lead-quality regression suite. | Before commits and after lead-quality changes. | No | Low |
| `npm run leads:review-simulate` | Validate review workflow behavior with local fixtures. | After review workflow changes. | No | Low |
| `npm run leads:dashboard` | Generate the client discovery dashboard. | After local reports or live run review. | No | Low |
| `npm run repo:check` | Check repo safety, docs, generated files, and secret risk. | Before commits and after validation. | No | Low |
| `npm run system:audit` | Generate broader system audit and command/output inventory. | Periodically or before larger cleanup. | No | Low |

## Live Tavily

Run these only when `leads:live-readiness` says live execution is allowed and Daniel explicitly approves the run.

| Command | Purpose | When to run | Uses Tavily | Risk |
| --- | --- | --- | --- | --- |
| `npm run leads:search` | Execute bounded public search for allowed queries. | Scheduled Tavily day only, after readiness passes. | Yes | High |
| `npm run leads:morning` | Run the morning lead workflow, including live discovery when allowed. | Scheduled Tavily day only, not repeatedly. | Yes | High |
| `npm run leads:daily` | Run the fuller daily lead workflow. | Rare, scheduled, and human-approved. | Yes | High |
| `npm run leads:test-provider` | Run controlled Tavily provider test queries. | Manual diagnostics only. | Yes | High |

## Commercial

| Command | Purpose | When to run | Uses Tavily | Risk |
| --- | --- | --- | --- | --- |
| `npm run leads:offer-pack` | Generate client offer pack from local evidence. | After candidates are reviewed. | No | Low |
| `npm run leads:meeting-prep` | Prepare discovery call context. | Before a human sales call. | No | Low |
| `npm run leads:pilot-pack` | Generate pilot delivery pack. | For Flora or another validated client opportunity. | No | Low |
| `npm run leads:call-tracker` | Generate or update local call tracking context. | During commercial follow-up planning. | No | Low |
| `npm run leads:delivery-router` | Route reviewed opportunities into delivery plans. | After review and commercial qualification. | No | Low |

## Learning

| Command | Purpose | When to run | Uses Tavily | Risk |
| --- | --- | --- | --- | --- |
| `npm run leads:source-quality-v2` | Score source/query/client quality and recommend budget mix. | After live run outputs or review updates. | No | Low |
| `npm run leads:query-learning` | Summarize query performance and recommendations. | After search, delivery, and review artifacts exist. | No | Low |
| `npm run leads:false-positive-learning` | Summarize false-positive patterns. | After rejected or false-positive review decisions. | No | Low |
| `npm run leads:performance` | Generate source performance reporting. | After search and delivery outputs. | No | Low |

## Rule Of Thumb

If a command can call a provider, spend Tavily credits, execute live search, or test a live provider, treat it as high risk. Everything else should still be reviewed, but safe offline commands are the default validation-mode workflow.

