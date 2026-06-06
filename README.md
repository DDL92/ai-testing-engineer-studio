# AI Testing Engineer Studio

AI Testing Engineer Studio is a lean MVP for selling QA Automation and AI Testing services fast. It combines a reusable Playwright + TypeScript starter framework, AI testing templates, client delivery documents, Upwork assets, Codex prompts, and launch content.

## MVP Scope

This repo supports three services:

- Playwright QA Automation Audit: $300-$500
- Playwright Starter Framework: $800-$1,500
- AI Testing Audit: $500-$1,000

The goal is not to build a SaaS. The goal is to close the first paid audit, deliver a professional result, and convert the client into a framework project or monthly retainer.

## Install

```bash
npm install
npx playwright install
cp .env.example .env
```

Update `.env` with the client app URLs and test credentials.

## Run Tests

```bash
npm test
npm run test:ui
npm run test:api
npm run test:ai
npm run test:headed
npm run report
```

## Adapt To A Client

1. Set `BASE_URL`, `API_BASE_URL`, and optional `AI_API_URL` in `.env`.
2. Update page objects in `playwright-framework/pages`.
3. Replace generic login and dashboard assertions with client-specific stable locators.
4. Add API endpoints in `playwright-framework/tests/api`.
5. Add AI prompts and expected quality criteria in `playwright-framework/tests/ai`.
6. Deliver using the templates in `client-delivery-system`.

## Repo Areas

- `docs`: MVP plan, business model, service offers, automation strategy, launch checklist.
- `playwright-framework`: reusable Playwright framework with POM, fixtures, UI/API/AI examples.
- `ai-testing-kit`: prompt, injection, RAG, and response quality testing assets.
- `client-delivery-system`: intake, audit report, coverage matrix, delivery, retainer proposal.
- `codex-prompts`: prompts to accelerate delivery with Codex.
- `upwork-assets`: profile, project catalogs, proposal templates.
- `content-engine`: first posts, carousels, and 7-day content plan.

## Delivery Workflow

1. Qualify client with the intake form.
2. Run a short manual + automated audit.
3. Customize the framework for 1-3 critical flows.
4. Generate report and coverage matrix.
5. Send final delivery message.
6. Offer the starter framework or monthly retainer as the next step.

