import { expect, test } from '@playwright/test';
import { buildAutomationDeliveryReportForClient } from '../../../src/automationDelivery/automationRules';
import { ClientRecord } from '../../../src/clientConversion/types';
import {
  buildDeliveryAssetsReportForClient,
  renderAssetBundle,
  renderCoverageMatrix,
  renderDeliveryTimeline,
  renderExecutiveReport,
  renderImplementationBlueprint,
  renderOnboardingChecklist,
  renderRiskMatrix,
} from '../../../src/deliveryAssets/assetRules';
import { buildEvidenceProReport } from '../../../src/evidencePro/evidenceProRules';

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

const evidence = buildEvidenceProReport({
  target: {
    companyId: client.clientId,
    companyName: client.clientName,
    website: client.website,
    source: 'Lead Rotation Actionable Lead',
  },
  generatedAt: '2026-06-18T00:00:00.000Z',
  requestedUrl: client.website,
  finalUrl: `${client.website}/`,
  statusCode: 200,
  requests: [{
    url: `${client.website}/`,
    method: 'GET',
    resourceType: 'document',
    statusCode: 200,
    durationMs: 100,
    responseBytes: 20_000,
    failed: false,
    failureText: '',
  }],
  consoleTimeline: [],
  performance: {
    domContentLoadedMs: 400,
    loadEventMs: 700,
    firstPaintMs: 250,
    largestContentfulPaintMs: 600,
  },
  harPath: '/workspace/output/evidence/har/demo.har',
  tracePath: '/workspace/output/evidence/traces/demo.zip',
  videoPath: '/workspace/output/evidence/videos/demo.webm',
  screenshotPath: '/workspace/output/evidence/screenshots/demo.png',
});

function report() {
  const automation = buildAutomationDeliveryReportForClient(client);
  return buildDeliveryAssetsReportForClient(client, automation, { ...evidence, status: 'READY' });
}

test.describe('Delivery Assets regression', () => {
  test('generates a cautious executive report', () => {
    const output = renderExecutiveReport(report());
    expect(output).toContain('Client Executive Report');
    expect(output).toContain('Potential Areas To Review');
    expect(output).not.toContain('Confirmed bug');
  });

  test('generates a risk matrix without business-impact claims', () => {
    const output = renderRiskMatrix(report());
    expect(output).toContain('Recommended Review Priority');
    expect(output).toContain('do not infer business impact');
  });

  test('generates coverage without inventing automation', () => {
    const result = report();
    expect(result.coverage.map((item) => item.coverageStatus)).toContain('Observed');
    expect(result.coverage.map((item) => item.coverageStatus)).toContain('Pending');
    expect(result.coverage.every((item) => item.coverageStatus !== 'Automated')).toBe(true);
    expect(renderCoverageMatrix(result)).toContain('No flow is marked Automated');
  });

  test('generates all six planning phases', () => {
    const result = report();
    expect(result.timeline).toHaveLength(6);
    expect(renderDeliveryTimeline(result)).toContain('Phase 6: Review');
  });

  test('generates a recommendation-only implementation blueprint', () => {
    const output = renderImplementationBlueprint(report());
    expect(output).toContain('Page Object Model');
    expect(output).toContain('No executable client code was generated');
  });

  test('separates public and client-access onboarding requirements', () => {
    const output = renderOnboardingChecklist(report());
    expect(output).toContain('Boundary: public-only');
    expect(output).toContain('Boundary: client-access-required');
    expect(output).toContain('No production passwords');
  });

  test('generates the QA Audit asset bundle', () => {
    const result = report();
    const output = renderAssetBundle(result);
    expect(result.bundleContents).toEqual(['Client Executive Report', 'Risk Matrix', 'Coverage Matrix']);
    expect(output).toContain('Delivery Asset Bundle');
    expect(output).not.toContain('## Implementation Blueprint');
    expect(output).not.toContain('## Onboarding Checklist');
  });
});
