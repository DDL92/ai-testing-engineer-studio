import { expect, test } from '@playwright/test';
import { ClientRecord } from '../../../src/clientConversion/types';
import {
  buildRetainerOperationsReportForClient,
  renderClientHealth,
  renderCoverageRoadmap,
  renderExpansionOpportunities,
  renderMonthlyReportTemplate,
  renderMonthlyRoadmap,
  renderOperationalMetrics,
  renderRenewalPlan,
  renderRetainerPlan,
  renderWeeklyReportTemplate,
} from '../../../src/retainerOperations/retainerRules';

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

test.describe('Retainer Operations regression', () => {
  test('generates a planning-only retainer plan', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(report.retainerStatus).toBe('PLANNING');
    expect(renderRetainerPlan(report)).toContain('No completed work');
  });

  test('generates a three-month roadmap', () => {
    const report = buildRetainerOperationsReportForClient(client);
    const output = renderMonthlyRoadmap(report);
    expect(report.monthlyRoadmap.month1.length).toBeGreaterThan(0);
    expect(output).toContain('## Month 3');
  });

  test('tracks planned and pending coverage without claiming automation', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(report.metrics.automatedFlowsCount).toBe(0);
    expect(report.metrics.criticalFlowsCount).toBe(9);
    expect(renderCoverageRoadmap(report)).toContain('0% automated');
  });

  test('generates weekly and monthly report templates', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(renderWeeklyReportTemplate(report)).toContain('TEMPLATE ONLY');
    expect(renderMonthlyReportTemplate(report)).toContain('TEMPLATE ONLY');
  });

  test('uses neutral client health when delivery history is absent', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(report.health.status).toBe('WATCH');
    expect(renderClientHealth(report)).toContain('Neutral defaults');
  });

  test('keeps renewal not ready without delivery evidence', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(report.renewal.status).toBe('NOT READY');
    expect(renderRenewalPlan(report)).toContain('No renewal is recorded');
  });

  test('generates expansion recommendations and operational metrics', () => {
    const report = buildRetainerOperationsReportForClient(client);
    expect(report.expansionOpportunities).toHaveLength(6);
    expect(renderExpansionOpportunities(report)).toContain('accessibility');
    expect(renderOperationalMetrics(report)).toContain('No revenue metrics are inferred');
  });
});
