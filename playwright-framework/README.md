# Playwright Framework MVP

This is a reusable Playwright + TypeScript starter framework for client delivery.

## Structure

- `pages`: Page Object Model classes.
- `fixtures`: shared Playwright fixtures.
- `utils`: API client and test data.
- `config`: environment handling.
- `tests/ui`: UI smoke tests.
- `tests/api`: API health tests.
- `tests/ai`: AI quality and defensive prompt injection checks.

## Adaptation Guide

### Selectors

Prefer stable locators in this order:

1. `getByRole`
2. `getByLabel`
3. `getByPlaceholder`
4. `getByTestId`
5. `locator` only when necessary

Update `LoginPage.ts` and `DashboardPage.ts` with the client app's accessible names.

### Base URL

Set `BASE_URL` in `.env`.

### Login

Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. If the app uses SSO, replace `LoginPage.login()` with a stored auth state or API login fixture.

### API Endpoints

Set `API_BASE_URL`. Override the health endpoint with:

```bash
API_HEALTH_PATH=/status npm run test:api
```

### AI Endpoints

Set `AI_API_URL` to the endpoint that accepts `{ "prompt": "..." }`. If the API contract differs, adapt the request body and response parsing in `tests/ai`.

### Test Data

Update `utils/testData.ts` with client-specific prompts, expected response rules, and forbidden phrases.

