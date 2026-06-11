import { AuditFinding, AuditResult } from './types';

export function renderAuditReport(result: AuditResult): string {
  return `# QA Audit Pack

## Executive Summary

- Audit date: ${result.summary.generatedAt}
- Audited URL: ${result.summary.targetUrl}
- Final URL: ${result.summary.finalUrl}
- Total findings: ${result.summary.findingCount}
- Findings by severity: ${renderSeverityInline(result)}
- QA risk level: ${result.summary.riskAssessment.level}
- Suggested service path: ${result.summary.suggestedService.servicePath}

Key observations:

${result.summary.keyObservations.map((observation) => `- ${observation}`).join('\n')}

This is a limited passive homepage audit. Findings are potential issues or automation opportunities that require manual review before client delivery. This report does not claim compliance, accessibility certification, performance scores, or production readiness.

## Site Overview

- Domain: ${result.summary.domain}
- Target URL: ${result.summary.targetUrl}
- Final URL: ${result.summary.finalUrl}
- Page title: ${result.summary.pageTitle || 'Not detected'}
- Audit timestamp: ${result.evidence.capturedAt}

## Evidence Captured

- Homepage screenshot: ${result.evidence.homepageScreenshotPath}
- Viewport: ${result.evidence.viewport}
- Audit timestamp: ${result.evidence.capturedAt}
- Final URL: ${result.evidence.finalUrl}
- Page title: ${result.evidence.pageTitle || 'Not detected'}
- Console errors captured: ${result.evidence.consoleErrors.length}
- Visible nav detected: ${yesNo(result.evidence.visibleElements.hasNav)}
- Visible main content detected: ${yesNo(result.evidence.visibleElements.hasMain)}
- Visible footer detected: ${yesNo(result.evidence.visibleElements.hasFooter)}
- Buttons detected: ${result.evidence.visibleElements.buttonCount}
- Forms detected: ${result.evidence.visibleElements.formCount}
- Links detected: ${result.evidence.visibleElements.linkCount}

## Severity Summary

- Low: ${result.summary.severitySummary.low}
- Medium: ${result.summary.severitySummary.medium}
- High: ${result.summary.severitySummary.high}

## Findings

${renderFindings(result.findings)}

## Automation Opportunities

${renderAutomationOpportunities(result.findings)}

## QA Risk Assessment

- Risk level: ${result.summary.riskAssessment.level}

Rationale:

${result.summary.riskAssessment.rationale.map((item) => `- ${item}`).join('\n')}

No high-severity finding should be interpreted as risk-free. This audit is intentionally limited to passive homepage evidence.

## Recommended Next Steps

1. Review the screenshot evidence and confirm the page loaded as expected.
2. Manually review any potential issue before calling it a defect.
3. Pick one safe, non-destructive smoke-test path before building automation.
4. Confirm scope with Daniel before sharing this report or creating client-facing deliverables.

## Suggested Service Path

- Recommendation: ${result.summary.suggestedService.servicePath}
- Reason: ${result.summary.suggestedService.reason}

Service path options:

- QA Audit Follow-Up for cautious manual review and prioritized recommendations.
- Playwright Starter Pack when the site has clear smoke-test opportunities.
- QA Automation Retainer only when recurring release risk is confirmed through manual review.

## Future Lighthouse Readiness

This audit does not currently include Lighthouse metrics.

Future optional enhancements could include:

- Performance snapshots
- Core Web Vitals review
- Accessibility scans
- Best practices review

No Lighthouse scores, performance numbers, Core Web Vitals values, or accessibility compliance claims are generated in this report.

## Manual Review Checklist

- [ ] Findings reviewed
- [ ] Screenshots verified
- [ ] Recommendations reviewed
- [ ] No unsupported claims
- [ ] Ready for client review

## Scope & Limitations

- This was a limited passive homepage audit.
- No login was attempted.
- No forms were submitted.
- No payment flows were tested.
- No authentication was bypassed.
- No Lighthouse performance numbers were collected.
- No accessibility compliance claim is made.
- No production readiness claim is made.
- Findings use cautious language and require manual confirmation.
- Human approval is required before sending this report to leads or clients.
`;
}

function renderSeverityInline(result: AuditResult): string {
  return `low=${result.summary.severitySummary.low}, medium=${result.summary.severitySummary.medium}, high=${result.summary.severitySummary.high}`;
}

function renderFindings(findings: AuditFinding[]): string {
  if (findings.length === 0) return '- No findings were generated during this limited pass.';

  return findings.map((finding) => `### ${finding.title}

- Severity: ${finding.severity}
- Category: ${finding.category}
- Description: ${finding.description}
- Recommendation: ${finding.recommendation}
- Evidence: ${finding.evidencePath}`).join('\n\n');
}

function renderAutomationOpportunities(findings: AuditFinding[]): string {
  const opportunities = findings.filter((finding) => finding.category === 'automation-opportunity');
  if (opportunities.length === 0) return '- No automation opportunities were generated during this limited pass.';

  return [
    ...opportunities.map((finding) => `- ${finding.title}: ${finding.recommendation}`),
    ...recommendedAutomationRoadmap(findings),
  ].join('\n');
}

function recommendedAutomationRoadmap(findings: AuditFinding[]): string[] {
  const recommendations: string[] = [];
  const categories = new Set(findings.map((finding) => finding.category));
  const ids = new Set(findings.map((finding) => finding.id));

  recommendations.push('- Smoke tests: validate homepage load, title, visible content, and screenshot evidence.');

  if (categories.has('navigation')) {
    recommendations.push('- Navigation coverage: verify expected navigation or important links are visible before clicking deeper flows.');
  }

  if (ids.has('forms-detected-not-tested')) {
    recommendations.push('- Onboarding coverage: review forms manually before adding safe validation checks.');
  }

  if (categories.has('reliability')) {
    recommendations.push('- Regression coverage: add checks around any confirmed reliability issue after manual triage.');
  }

  if (findings.some((finding) => finding.description.toLowerCase().includes('api'))) {
    recommendations.push('- API coverage: consider API checks only if approved endpoints and expected responses are documented.');
  }

  recommendations.push('- CI/CD validation: run approved smoke tests in CI once the first stable Playwright checks exist.');
  return recommendations;
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}
