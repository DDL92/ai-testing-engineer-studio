import { hasApiBaseUrl } from '../../config/env';
import { expect, test } from '../../fixtures/testBase';

test.describe('API health', () => {
  test.skip(!hasApiBaseUrl, 'Set API_BASE_URL to run API health tests.');

  test('returns a healthy status from the health endpoint', async ({ apiClient }) => {
    // Arrange
    const healthEndpoint = process.env.API_HEALTH_PATH ?? '/health';

    // Act
    const response = await apiClient.get(healthEndpoint);

    // Assert
    expect(response.status(), `Expected ${healthEndpoint} to be available`).toBeLessThan(500);
  });
});
