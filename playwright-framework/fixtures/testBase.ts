import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { ApiClient } from '../utils/apiClient';
import { env } from '../config/env';

type AppFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiClient: ApiClient;
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request, env.apiBaseUrl ?? ''));
  }
});

export { expect } from '@playwright/test';
