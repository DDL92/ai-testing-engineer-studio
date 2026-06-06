import { expect, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly mainRegion = this.page.getByRole('main');
  readonly heading = this.page.getByRole('heading', { name: /dashboard|home|overview/i });
  readonly accountMenu = this.page.getByRole('button', { name: /account|profile|user/i });

  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.mainRegion).toBeVisible();
    await expect(this.heading.or(this.accountMenu)).toBeVisible();
  }
}

