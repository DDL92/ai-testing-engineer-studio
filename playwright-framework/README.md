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

## Skipped Tests

Tests skip by design until the required environment variables are configured. This allows the framework to be shared publicly without real client URLs, credentials, or AI endpoints.

- UI tests skip until `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are set.
- API tests skip until `API_BASE_URL` is set.
- AI tests skip until `AI_API_URL` is set.

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

Example:

```bash
BASE_URL=https://staging.example-saas.com
```

### Login

Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD`. If the app uses SSO, replace `LoginPage.login()` with a stored auth state or API login fixture.

Example locator updates:

```ts
readonly emailInput = this.page.getByLabel('Work email');
readonly passwordInput = this.page.getByLabel('Password');
readonly submitButton = this.page.getByRole('button', { name: 'Sign in' });
```

### Dashboard Verification

Update `DashboardPage.ts` to assert a user-visible post-login signal.

Example:

```ts
readonly heading = this.page.getByRole('heading', { name: 'Dashboard' });
readonly accountMenu = this.page.getByRole('button', { name: 'Account menu' });
```

### API Endpoints

Set `API_BASE_URL`. Override the health endpoint with:

```bash
API_BASE_URL=https://api.staging.example-saas.com
API_HEALTH_PATH=/status npm run test:api
```

### AI Endpoints

Set `AI_API_URL` to the endpoint that accepts `{ "prompt": "..." }`. If the API contract differs, adapt the request body and response parsing in `tests/ai`.

Example:

```bash
AI_API_URL=https://api.staging.example-saas.com/ai/chat
```

### Test Data

Update `utils/testData.ts` with client-specific prompts, expected response rules, and forbidden phrases.
