import { expect, test } from '@playwright/test';
import {
  buildEvidenceProReport,
  renderEvidencePackage,
  renderHarEvidence,
  renderPerformanceMetrics,
  renderTraceEvidence,
  renderVideoEvidence,
} from '../../../src/evidencePro/evidenceProRules';

function report() {
  return buildEvidenceProReport({
    target: {
      companyId: 'demo',
      companyName: 'Demo Company',
      website: 'https://example.com',
      source: 'Lead Rotation Actionable Lead',
    },
    generatedAt: '2026-06-18T00:00:00.000Z',
    requestedUrl: 'https://example.com',
    finalUrl: 'https://example.com/',
    statusCode: 200,
    requests: [
      {
        url: 'https://example.com/',
        method: 'GET',
        resourceType: 'document',
        statusCode: 200,
        durationMs: 120,
        responseBytes: 20_000,
        failed: false,
        failureText: '',
      },
      {
        url: 'https://cdn.example.net/app.js',
        method: 'GET',
        resourceType: 'script',
        statusCode: 200,
        durationMs: 200,
        responseBytes: 40_000,
        failed: false,
        failureText: '',
      },
    ],
    consoleTimeline: [],
    performance: {
      domContentLoadedMs: 450,
      loadEventMs: 700,
      firstPaintMs: 300,
      largestContentfulPaintMs: 600,
    },
    harPath: '/workspace/output/evidence/har/demo-desktop.har',
    tracePath: '/workspace/output/evidence/traces/demo-desktop.zip',
    videoPath: '/workspace/output/evidence/videos/demo-desktop.webm',
    screenshotPath: '/workspace/output/evidence/screenshots/demo-evidence-pro-desktop.png',
  });
}

test.describe('Evidence Pro regression', () => {
  test('generates HAR evidence metrics', () => {
    const result = report();
    expect(result.har.requestCount).toBe(2);
    expect(renderHarEvidence(result)).toContain('Request Count: 2');
  });

  test('generates trace evidence metadata', () => {
    const result = report();
    expect(result.trace.navigationSteps.length).toBeGreaterThan(0);
    expect(renderTraceEvidence(result)).toContain('Trace Status: CAPTURED');
  });

  test('generates video evidence metadata', () => {
    expect(renderVideoEvidence(report())).toContain('passive desktop navigation');
  });

  test('generates performance and page-weight metrics', () => {
    const result = report();
    expect(result.pageWeight.pageSizeBytes).toBe(60_000);
    expect(result.dependencies[0]?.host).toBe('cdn.example.net');
    expect(renderPerformanceMetrics(result)).toContain('450 ms');
  });

  test('generates a cautious professional evidence package', () => {
    const output = renderEvidencePackage(report());
    expect(output).toContain('Professional Evidence Package');
    expect(output).toContain('Recommended Areas To Review');
    expect(output).not.toContain('Confirmed bug');
  });
});
