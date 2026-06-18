import { expect, test } from '@playwright/test';
import {
  buildAutomationDeliveryReportForClient,
  renderAutomationPlan,
  renderClientHandoff,
  renderCriticalFlows,
  renderFrameworkStructure,
  renderTestCases,
} from '../../../src/automationDelivery/automationRules';
import { ClientRecord } from '../../../src/clientConversion/types';

const client: ClientRecord = {
  clientId: 'demo-client',
  clientName: 'Demo Client',
  website: 'https://example.com',
  sourceLead: 'Demo Client',
  sourceLeadRank: 1,
  commercialReadiness: 85,
  selectedPackage: 'qa-audit',
  status: 'delivery-prep',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
  approvalStatus: 'human-review-required',
};

test.describe('Automation Delivery regression', () => {
  test('generates an automation plan', () => {
    // Arrange
    const report = buildAutomationDeliveryReportForClient(client);

    // Act
    const output = renderAutomationPlan(report);

    // Assert
    expect(report.status).toBe('READY FOR REVIEW');
    expect(output).toContain('Automation Delivery Plan');
    expect(output).toContain('Human approval');
  });

  test('generates critical flow recommendations', () => {
    // Arrange / Act
    const report = buildAutomationDeliveryReportForClient(client);
    const output = renderCriticalFlows(report);

    // Assert
    expect(report.criticalFlows).toHaveLength(9);
    expect(report.criticalFlows.map((flow) => flow.name)).toContain('Booking');
    expect(output).toContain('candidate-flow');
  });

  test('generates prioritized test cases', () => {
    // Arrange / Act
    const report = buildAutomationDeliveryReportForClient(client);
    const output = renderTestCases(report);

    // Assert
    expect(report.testCases).toHaveLength(9);
    expect(report.testCases.every((testCase) => ['HIGH', 'MEDIUM', 'LOW'].includes(testCase.priority))).toBe(true);
    expect(output).toContain('Recommended Automation');
  });

  test('generates framework recommendations without client code', () => {
    // Arrange / Act
    const report = buildAutomationDeliveryReportForClient(client);
    const output = renderFrameworkStructure(report);

    // Assert
    expect(report.frameworkStructure.map((item) => item.path)).toContain('playwright.config.ts');
    expect(report.frameworkStructure.map((item) => item.path)).toContain('pages/');
    expect(output).toContain('No client repository files were created');
  });

  test('generates a client handoff draft', () => {
    // Arrange / Act
    const report = buildAutomationDeliveryReportForClient(client);
    const output = renderClientHandoff(report);

    // Assert
    expect(report.clientHandoff).toContain('QA Audit Summary');
    expect(report.clientHandoff).toContain('Coverage Roadmap');
    expect(output).toContain('Month 1');
    expect(output).toContain('not a record of delivered or accepted work');
  });
});
