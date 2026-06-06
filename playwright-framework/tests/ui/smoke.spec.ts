import { hasTestCredentials, env } from '../../config/env';
import { expect, test } from '../../fixtures/testBase';

test.describe('UI smoke', () => {
  test.skip(!hasTestCredentials, 'Set TEST_USER_EMAIL and TEST_USER_PASSWORD to run authenticated UI smoke tests.');

  test('allows a valid user to access the dashboard', async ({ loginPage, dashboardPage, page }) => {
    // Arrange
    await loginPage.open();
    await loginPage.expectLoaded();

    // Act
    await loginPage.login(env.testUserEmail!, env.testUserPassword!);

    // Assert
    await expect(page).toHaveURL(/dashboard|home|overview/);
    await dashboardPage.expectLoaded();
  });
});
