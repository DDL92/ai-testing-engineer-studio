# AI Testing Engineer Studio — Codex Instructions

## Goal

Build a local-first, low-cost, evidence-first QA Automation business system for a solo remote QA Automation engineer.

## Business objective

Support productized QA services:

- QA Audit Pack
- Playwright smoke test automation
- Lighthouse performance/accessibility snapshot
- Allure/HTML client reports
- Lead packs
- Discovery call prep
- SOW/proposal generation
- Monthly QA retainer reports

## Core principles

- Lowest operating cost possible
- Local-first
- Open-source-first
- Playwright-first
- Evidence-first
- Human approval before risky actions
- No overengineering
- No unnecessary paid services
- No auto-DMs
- No aggressive scraping
- No auto-applying
- No real client credentials
- No production client systems unless explicitly approved
- Do not install Ruflo, Stagehand, Browserbase, or complex MCP servers yet

## Preferred stack

- Playwright
- TypeScript
- Lighthouse / playwright-lighthouse
- Allure open source
- Markdown/HTML reports
- Local JSON/CSV data
- Controlled GitHub Actions
- VS Code

## Prioritized commands to build

- `npm run audit:site`
- `npm run lead:pack`
- `npm run client:report`
- `npm run call:prep`
- `npm run sow:generate`
- `npm run fix:loop`
- `npm run day:plan`

## When making changes

1. Inspect the repo first.
2. Propose a small scoped plan.
3. Modify only necessary files.
4. Keep generated outputs out of git unless intentionally tracked.
5. Update README/docs when needed.
6. Run validation when available:
   - `npm run typecheck`
   - `npm test`
   - `npx playwright test`
   - `npm run lint`
7. Summarize:
   - files changed
   - commands run
   - validation results
   - next recommended action

## Security rules

Do not use credentials, tokens, passwords, API keys, or private client data in code, prompts, logs, screenshots, reports, or committed files.

Use:

- `.env` for local private variables
- `.env.example` for placeholders
- fake/demo/staging data for tests

Never commit:

- `.env`
- real client credentials
- private tokens
- production secrets
- sensitive screenshots