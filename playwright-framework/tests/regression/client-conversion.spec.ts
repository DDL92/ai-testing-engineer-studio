import { expect, test } from '@playwright/test';
import { buildClientRecordFromActionableLead, isSupportedClientPackage } from '../../../src/clientConversion/conversionRules';
import { ClientPackage } from '../../../src/clientConversion/types';
import { buildDeliveryRouterReportForClient, renderDeliveryPlan, routeClientPackage } from '../../../src/deliveryRouter/routerRules';
import { buildLeadRotationDecision } from '../../../src/leadRotation/rotationRules';

test.describe('Client Conversion regression', () => {
  test('converts the actionable lead to a delivery-prep client record', () => {
    // Arrange
    const actionableLead = buildLeadRotationDecision().actionableLead;
    expect(actionableLead, 'Expected an actionable lead').toBeTruthy();

    // Act
    const record = buildClientRecordFromActionableLead(
      actionableLead!,
      'qa-audit',
      'delivery-prep',
      undefined,
      '2026-06-18T00:00:00.000Z',
    );

    // Assert
    expect(record.clientName).toBe(actionableLead?.companyName);
    expect(record.selectedPackage).toBe('qa-audit');
    expect(record.status).toBe('delivery-prep');
    expect(record.approvalStatus).toBe('human-review-required');
  });

  test('routes every supported package', () => {
    // Arrange
    const packages: ClientPackage[] = ['qa-audit', 'starter-pack', 'retainer'];

    for (const selectedPackage of packages) {
      // Act
      const route = routeClientPackage(selectedPackage);

      // Assert
      expect(route.package).toBe(selectedPackage);
      expect(route.scopeSections.length).toBeGreaterThan(0);
      expect(route.recommendedOutputs.length).toBeGreaterThan(0);
    }
  });

  test('rejects invalid package values', () => {
    // Arrange
    const invalidPackages = ['enterprise', 'free', '', 'qa_audit'];

    // Act / Assert
    for (const invalidPackage of invalidPackages) {
      expect(isSupportedClientPackage(invalidPackage)).toBe(false);
    }
    expect(() => routeClientPackage('invalid' as ClientPackage)).toThrow('Unsupported delivery package');
  });

  test('generates a five-phase delivery plan', () => {
    // Arrange
    const actionableLead = buildLeadRotationDecision().actionableLead;
    expect(actionableLead, 'Expected an actionable lead').toBeTruthy();
    const record = buildClientRecordFromActionableLead(actionableLead!, 'qa-audit');

    // Act
    const report = buildDeliveryRouterReportForClient(record);
    const plan = renderDeliveryPlan(report);

    // Assert
    expect(report.phases).toHaveLength(5);
    expect(plan).toContain('Phase 1: Discovery');
    expect(plan).toContain('Phase 5: Review');
    expect(plan).toContain('QA Audit Delivery Route');
    expect(plan).toContain('No work is claimed as completed');
  });
});
