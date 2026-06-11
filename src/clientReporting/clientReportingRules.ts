import { Client, ClientServiceType } from '../clientReports/types';
import {
  ClientReportingDocument,
  ClientReportingInput,
  EvidenceSummary,
  RenewalSignalResult,
} from './types';

const noEvidence = 'No evidence currently recorded.';

export function buildDeliveryReportDocuments(input: ClientReportingInput): ClientReportingDocument[] {
  const evidence = buildEvidenceSummary(input);
  const renewalSignal = calculateRenewalSignal(input.client, evidence);

  return [
    executiveSummary(input, evidence),
    weeklyReport(input, evidence),
    monthlyReport(input, evidence),
    valueDelivered(input, evidence),
    renewalSignalDocument(input.client, renewalSignal),
  ];
}

export function buildClientUpdateDraft(input: ClientReportingInput): ClientReportingDocument {
  const evidence = buildEvidenceSummary(input);
  const renewalSignal = calculateRenewalSignal(input.client, evidence);

  return doc('client-update-draft.md', 'Client Update Draft', [
    '# Client Update Draft',
    '',
    'DRAFT ONLY — REQUIRES DANIEL REVIEW BEFORE SENDING',
    '',
    `Hi ${input.client.companyName} team,`,
    '',
    'Here is the current QA delivery update draft for review:',
    '',
    bullets([
      `Current focus: ${input.client.currentFocus || noEvidence}`,
      `Work completed: ${joinOrNoEvidence(input.client.completedWork)}`,
      `Evidence available: ${evidence.evidenceCount > 0 ? `${evidence.evidenceCount} reviewed local evidence item(s)` : noEvidence}`,
      `Open risks: ${joinOrNoEvidence(evidence.risks)}`,
      `Recommended next steps: ${joinOrNoEvidence(evidence.recommendations)}`,
      `Renewal signal for internal review: ${renewalSignal.signal}`,
    ]),
    '',
    'Nothing in this draft has been sent. Daniel must review wording, evidence, scope, and claims before using it externally.',
    '',
    'Daniel',
    '',
    '## Manual Approval Notes',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function executiveSummary(input: ClientReportingInput, evidence: EvidenceSummary): ClientReportingDocument {
  const client = input.client;

  return doc('executive-summary.md', 'Executive Summary', [
    '# Executive Summary',
    '',
    '## Client',
    '',
    bullets([
      `Client: ${client.companyName}`,
      `Website: ${client.website}`,
      `Service type: ${client.serviceType}`,
      `Status: ${client.status}`,
    ]),
    '',
    '## Reporting Period',
    '',
    bullets([
      `Start date: ${client.startDate}`,
      `Last report date: ${client.lastReportDate || 'Not recorded'}`,
      'Reporting period should be confirmed manually before client-facing use.',
    ]),
    '',
    '## Work Completed',
    '',
    bullets(client.completedWork.length > 0 ? client.completedWork : [noEvidence]),
    '',
    '## Evidence Available',
    '',
    bullets(evidenceItems(evidence)),
    '',
    '## Risks',
    '',
    bullets(evidence.risks.length > 0 ? evidence.risks : [noEvidence]),
    '',
    '## Recommendations',
    '',
    bullets(evidence.recommendations.length > 0 ? evidence.recommendations : [noEvidence]),
    '',
    '## Approval Reminder',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function weeklyReport(input: ClientReportingInput, evidence: EvidenceSummary): ClientReportingDocument {
  const client = input.client;

  return doc('weekly-report.md', 'Weekly Client Report', [
    '# Weekly Client Report',
    '',
    '## Tasks Completed',
    '',
    bullets(client.completedWork.length > 0 ? client.completedWork : [noEvidence]),
    '',
    '## Evidence Recorded',
    '',
    bullets(evidenceItems(evidence)),
    '',
    '## Open Risks',
    '',
    bullets(evidence.risks.length > 0 ? evidence.risks : [noEvidence]),
    '',
    '## Next Week Plan',
    '',
    bullets(client.recommendedNextSteps.length > 0 ? client.recommendedNextSteps : ['Review scope and choose the next approved QA action.']),
    '',
    '## Manual Approval Notes',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function monthlyReport(input: ClientReportingInput, evidence: EvidenceSummary): ClientReportingDocument {
  const client = input.client;

  return doc('monthly-report.md', 'Monthly Client Report', [
    '# Monthly Client Report',
    '',
    '## Month Overview',
    '',
    bullets([
      `Client status: ${client.status}`,
      `Service type: ${client.serviceType}`,
      `Current focus: ${client.currentFocus || noEvidence}`,
    ]),
    '',
    '## Evidence Summary',
    '',
    bullets(evidenceItems(evidence)),
    '',
    '## QA Improvements',
    '',
    bullets(qaImprovements(client, evidence)),
    '',
    '## Coverage Expansion',
    '',
    bullets(coverageExpansion(client.serviceType, evidence)),
    '',
    '## Risks',
    '',
    bullets(evidence.risks.length > 0 ? evidence.risks : [noEvidence]),
    '',
    '## Recommended Next Month Scope',
    '',
    bullets(client.recommendedNextSteps.length > 0 ? client.recommendedNextSteps : ['Confirm one safe QA priority for next month.']),
    '',
    '## Manual Approval Notes',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function valueDelivered(input: ClientReportingInput, evidence: EvidenceSummary): ClientReportingDocument {
  const client = input.client;

  return doc('value-delivered.md', 'Value Delivered', [
    '# Value Delivered',
    '',
    '## Deliverables Completed',
    '',
    bullets(client.completedWork.length > 0 ? client.completedWork : [noEvidence]),
    '',
    '## Evidence Count',
    '',
    bullets([
      `Recorded evidence count: ${evidence.evidenceCount}`,
      evidence.evidenceCount > 0 ? 'Evidence count uses local evidence-log items only.' : noEvidence,
    ]),
    '',
    '## Risk Reduction Opportunities',
    '',
    bullets(evidence.risks.length > 0 ? evidence.risks.map((risk) => `Opportunity to reduce risk: ${risk}`) : [noEvidence]),
    '',
    '## Automation Opportunities',
    '',
    bullets(automationOpportunities(client.serviceType, evidence)),
    '',
    '## Human Approval Notice',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function renewalSignalDocument(client: Client, result: RenewalSignalResult): ClientReportingDocument {
  return doc('renewal-signal.md', 'Renewal Signal', [
    '# Renewal Signal',
    '',
    '## Signal',
    '',
    result.signal,
    '',
    '## Reasons',
    '',
    bullets(result.reasons),
    '',
    '## Manual Review Notes',
    '',
    bullets([
      'Renewal signal is calculated only from local client data and evidence counts.',
      'Do not treat this as guaranteed renewal probability.',
      'Daniel must review client context before discussing renewal.',
    ]),
  ]);
}

function buildEvidenceSummary(input: ClientReportingInput): EvidenceSummary {
  const content = input.evidenceLog.content ?? '';

  const auditEvidence = sectionItems(content, 'Audit Evidence');
  const screenshots = sectionItems(content, 'Screenshots');
  const testResults = sectionItems(content, 'Test Results');
  const defects = sectionItems(content, 'Defects');
  const risks = sectionItems(content, 'Risks');
  const recommendations = sectionItems(content, 'Recommendations');
  const followUpItems = sectionItems(content, 'Follow-Up Items');

  return {
    auditEvidence,
    screenshots,
    testResults,
    defects,
    risks: risks.length > 0 ? risks : input.client.openRisks,
    recommendations: recommendations.length > 0 ? recommendations : input.client.recommendedNextSteps,
    followUpItems: followUpItems.length > 0 ? followUpItems : input.client.recommendedNextSteps,
    evidenceCount: auditEvidence.length + screenshots.length + testResults.length + defects.length,
  };
}

function sectionItems(markdown: string, heading: string): string[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (headingIndex === -1) return [];

  const items: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (!line.startsWith('- ')) continue;

    const item = line.replace(/^-\s+/, '').trim();
    if (item && item !== noEvidence) items.push(item);
  }

  return items;
}

function evidenceItems(evidence: EvidenceSummary): string[] {
  const items = [
    ...evidence.auditEvidence.map((item) => `Audit evidence: ${item}`),
    ...evidence.screenshots.map((item) => `Screenshot: ${item}`),
    ...evidence.testResults.map((item) => `Test result: ${item}`),
    ...evidence.defects.map((item) => `Defect: ${item}`),
  ];

  return items.length > 0 ? items : [noEvidence];
}

function qaImprovements(client: Client, evidence: EvidenceSummary): string[] {
  if (evidence.evidenceCount === 0) return [noEvidence];

  return [
    `${evidence.evidenceCount} local evidence item(s) are available for Daniel review.`,
    `Current QA focus recorded locally: ${client.currentFocus}.`,
  ];
}

function coverageExpansion(serviceType: ClientServiceType, evidence: EvidenceSummary): string[] {
  if (evidence.evidenceCount === 0) return [noEvidence];

  if (serviceType === 'playwright-starter-pack') {
    return ['Review whether starter smoke coverage should expand to one additional approved flow.'];
  }

  if (serviceType === 'qa-automation-retainer' || serviceType === 'agency-partner-retainer') {
    return ['Review whether monthly retainer coverage should expand to the next approved high-risk workflow.'];
  }

  return ['Review whether audit evidence supports a starter automation scope.'];
}

function automationOpportunities(serviceType: ClientServiceType, evidence: EvidenceSummary): string[] {
  if (evidence.recommendations.length === 0) return [noEvidence];

  const prefix = serviceType.includes('retainer')
    ? 'Retainer automation opportunity'
    : 'Automation opportunity';

  return evidence.recommendations.map((recommendation) => `${prefix}: ${recommendation}`);
}

function calculateRenewalSignal(client: Client, evidence: EvidenceSummary): RenewalSignalResult {
  const reasons: string[] = [];
  let score = 0;

  if (client.status === 'active') {
    score += 2;
    reasons.push('Client is active in local data.');
  }

  if (client.monthlyFee > 0) {
    score += 2;
    reasons.push(`Recorded monthly fee is $${client.monthlyFee.toLocaleString('en-US')}.`);
  }

  if (client.completedWork.length >= 2) {
    score += 1;
    reasons.push(`${client.completedWork.length} completed work item(s) recorded locally.`);
  }

  if (client.recommendedNextSteps.length > 0) {
    score += 1;
    reasons.push('Recommended next steps are recorded locally.');
  }

  if (evidence.evidenceCount > 0) {
    score += 1;
    reasons.push(`${evidence.evidenceCount} local evidence item(s) recorded.`);
  } else {
    reasons.push(noEvidence);
  }

  if (client.status === 'at-risk' || client.status === 'paused') {
    score -= 2;
    reasons.push(`Client status is ${client.status}.`);
  }

  if (score >= 5) return { signal: 'HIGH', reasons };
  if (score >= 3) return { signal: 'MEDIUM', reasons };
  return { signal: 'LOW', reasons };
}

function joinOrNoEvidence(items: string[]): string {
  return items.length > 0 ? items.join('; ') : noEvidence;
}

function manualApprovalNotes(): string[] {
  return [
    'DRAFT ONLY — Daniel must review before sending.',
    'Do not invent defects, bugs, test executions, coverage, screenshots, results, revenue impact, or client claims.',
    'No email integrations, CRM integrations, external APIs, scraping, browser automation, payment systems, or client systems were used.',
  ];
}

function doc(fileName: ClientReportingDocument['fileName'], title: string, lines: string[]): ClientReportingDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}
