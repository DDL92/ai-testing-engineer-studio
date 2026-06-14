import path = require('path');
import { expect, test } from '@playwright/test';
import { resolveDashboardAsset } from '../../../src/securityBoundary/securityRules';

test.describe('Dashboard security boundary', () => {
  const dashboardRoot = path.join(process.cwd(), 'dashboard');

  test('allows only expected dashboard static assets', () => {
    // Arrange
    const allowedPaths = ['/dashboard/index.html', '/dashboard/app.js', '/dashboard/styles.css'];

    // Act
    const results = allowedPaths.map((requestPath) => resolveDashboardAsset(dashboardRoot, requestPath));

    // Assert
    for (const result of results) {
      expect(result.allowed, result.reason).toBe(true);
      expect(result.status).toBe(200);
      expect(result.filePath).toContain(`${path.sep}dashboard${path.sep}`);
    }
  });

  test('blocks private, runtime, source, dependency, and traversal paths', () => {
    // Arrange
    const blockedPaths = [
      '/.env',
      '/.env.local',
      '/package.json',
      '/data/contacts/contacts.json',
      '/output/dashboard/dashboard.json',
      '/src/dashboard/generateDashboard.ts',
      '/node_modules/@playwright/test/package.json',
      '/dashboard/../package.json',
    ];

    // Act
    const results = blockedPaths.map((requestPath) => resolveDashboardAsset(dashboardRoot, requestPath));

    // Assert
    for (const result of results) {
      expect(result.allowed, result.reason).toBe(false);
      expect([400, 403, 404]).toContain(result.status);
    }
  });
});
