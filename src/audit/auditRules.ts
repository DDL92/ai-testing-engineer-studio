import { AuditEvidence, AuditFinding, AuditRiskAssessment, SeveritySummary, SuggestedServiceRecommendation } from './types';

export function buildAuditFindings(evidence: AuditEvidence): AuditFinding[] {
  const findings: AuditFinding[] = [];

  if (!evidence.pageTitle.trim()) {
    findings.push({
      id: 'missing-page-title',
      severity: 'medium',
      category: 'content',
      title: 'Potential issue: missing page title',
      description: 'The audited page did not expose a visible browser title during this limited pass.',
      recommendation: 'Recommended manual review: confirm the page has a descriptive title for users, bookmarks, and search previews.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (!evidence.visibleElements.hasNav) {
    findings.push({
      id: 'no-visible-nav',
      severity: 'medium',
      category: 'navigation',
      title: 'Potential issue: no visible navigation landmark detected',
      description: 'No visible nav element or navigation role was detected on the homepage during this passive review.',
      recommendation: 'Recommended manual review: confirm primary navigation is visible, keyboard reachable, and covered by a Playwright smoke test.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (!evidence.visibleElements.hasMain) {
    findings.push({
      id: 'no-visible-main',
      severity: 'medium',
      category: 'content',
      title: 'Potential issue: no visible main content landmark detected',
      description: 'No visible main element or main role was detected during this audit.',
      recommendation: 'Recommended manual review: confirm the main page content is semantically exposed and visible after load.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (!evidence.visibleElements.hasFooter) {
    findings.push({
      id: 'no-visible-footer',
      severity: 'low',
      category: 'navigation',
      title: 'Potential issue: no visible footer detected',
      description: 'No visible footer element or contentinfo role was detected during this limited homepage pass.',
      recommendation: 'Recommended manual review: confirm whether footer links, support links, or legal links are expected on this page.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (evidence.visibleElements.formCount > 0) {
    findings.push({
      id: 'forms-detected-not-tested',
      severity: 'low',
      category: 'reliability',
      title: 'Recommended manual review: forms detected but not tested',
      description: `${evidence.visibleElements.formCount} form element(s) were detected. This audit did not type into, submit, or validate forms.`,
      recommendation: 'Recommended manual review: identify which forms are business-critical before adding safe Playwright validation coverage.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (evidence.visibleElements.buttonCount > 0) {
    findings.push({
      id: 'buttons-detected',
      severity: 'low',
      category: 'automation-opportunity',
      title: 'Automation opportunity: buttons detected',
      description: `${evidence.visibleElements.buttonCount} button element(s) were detected. This indicates possible interaction points for future smoke coverage.`,
      recommendation: 'Recommended manual review: choose only safe, non-submitting buttons for first-pass Playwright coverage.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  if (evidence.consoleErrors.length > 0) {
    findings.push({
      id: 'console-errors-detected',
      severity: 'medium',
      category: 'reliability',
      title: 'Potential issue: console errors detected',
      description: `${evidence.consoleErrors.length} browser console error(s) were captured while loading the page.`,
      recommendation: 'Recommended manual review: confirm whether these errors affect user-visible behavior before prioritizing fixes.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  findings.push({
    id: 'homepage-smoke-opportunity',
    severity: 'low',
    category: 'automation-opportunity',
    title: 'Automation opportunity: homepage smoke coverage',
    description: 'The page can be covered with a small Playwright smoke test for load, title, key landmarks, and screenshot evidence.',
    recommendation: 'Recommended next step: create a minimal Playwright Starter Pack only after Daniel approves the audit scope.',
    evidencePath: evidence.homepageScreenshotPath,
  });

  if (evidence.visibleElements.linkCount > 0) {
    findings.push({
      id: 'link-navigation-opportunity',
      severity: 'low',
      category: 'automation-opportunity',
      title: 'Automation opportunity: navigation and link visibility',
      description: `${evidence.visibleElements.linkCount} link element(s) were detected. Links were not clicked during this limited audit.`,
      recommendation: 'Recommended manual review: identify critical navigation links before adding non-destructive Playwright checks.',
      evidencePath: evidence.homepageScreenshotPath,
    });
  }

  return findings;
}

export function buildSeveritySummary(findings: AuditFinding[]): SeveritySummary {
  return {
    low: findings.filter((finding) => finding.severity === 'low').length,
    medium: findings.filter((finding) => finding.severity === 'medium').length,
    high: findings.filter((finding) => finding.severity === 'high').length,
  };
}

export function buildKeyObservations(evidence: AuditEvidence, findings: AuditFinding[]): string[] {
  const observations = [
    `The page resolved to ${evidence.finalUrl}.`,
    evidence.pageTitle.trim() ? `A page title was captured: ${evidence.pageTitle}.` : 'No page title was captured during this limited pass.',
    `${findings.length} cautious finding(s) were generated from passive homepage evidence.`,
    `${evidence.consoleErrors.length} browser console error(s) were captured during page load.`,
  ];

  if (!evidence.visibleElements.hasNav || !evidence.visibleElements.hasMain || !evidence.visibleElements.hasFooter) {
    observations.push('One or more common page landmarks were not visibly detected and should be manually reviewed.');
  }

  return observations;
}

export function buildRiskAssessment(evidence: AuditEvidence, findings: AuditFinding[]): AuditRiskAssessment {
  const missingElementCount = [
    !evidence.visibleElements.hasNav,
    !evidence.visibleElements.hasMain,
    !evidence.visibleElements.hasFooter,
  ].filter(Boolean).length;
  const hasConsoleErrors = evidence.consoleErrors.length > 0;
  const hasHighFinding = findings.some((finding) => finding.severity === 'high');
  const mediumFindings = findings.filter((finding) => finding.severity === 'medium').length;
  const rationale: string[] = [];

  if (missingElementCount > 0) rationale.push(`${missingElementCount} common visible page landmark(s) were not detected.`);
  if (hasConsoleErrors) rationale.push(`${evidence.consoleErrors.length} console error(s) were captured.`);
  if (findings.length <= 2) rationale.push('Limited evidence was captured, so risk should not be treated as fully assessed.');
  if (!hasHighFinding) rationale.push('No high-severity finding was generated, but this limited audit is not risk-free.');

  if (hasHighFinding || hasConsoleErrors || missingElementCount >= 3) {
    return { level: 'high', rationale };
  }

  if (mediumFindings > 0 || missingElementCount > 0 || findings.length <= 2) {
    return { level: 'medium', rationale };
  }

  return {
    level: 'low',
    rationale: rationale.length > 0 ? rationale : ['Only low-severity findings were generated during this limited passive audit.'],
  };
}

export function suggestedOfferForFindings(findings: AuditFinding[], riskAssessment?: AuditRiskAssessment): SuggestedServiceRecommendation {
  const hasMediumOrHigh = findings.some((finding) => finding.severity === 'medium' || finding.severity === 'high');
  const automationOpportunities = findings.filter((finding) => finding.category === 'automation-opportunity');
  const hasInteractionSurface = findings.some((finding) => finding.id === 'forms-detected-not-tested' || finding.id === 'buttons-detected');

  if (riskAssessment?.level === 'high' && hasMediumOrHigh && hasInteractionSurface && automationOpportunities.length >= 2) {
    return {
      servicePath: 'QA Automation Retainer',
      reason: 'The limited audit found medium/high risk signals, interaction surfaces, and multiple automation opportunities. Confirm manually before positioning a retainer.',
    };
  }

  if (automationOpportunities.length >= 2 || hasMediumOrHigh) {
    return {
      servicePath: 'Playwright Starter Pack',
      reason: 'The audit produced smoke-test opportunities that can be converted into a bounded first Playwright engagement after manual review.',
    };
  }

  return {
    servicePath: 'QA Audit Follow-Up',
    reason: 'The safest next step is a manual follow-up review before recommending implementation work.',
  };
}
