import { Client, ClientServiceType } from '../clientReports/types';
import { ClientDeliveryDocument, ClientDeliveryInput, EvidenceInventory, LocalDeliverySource } from './types';

const noEvidence = 'No evidence currently recorded.';

export function buildClientDeliveryDocuments(input: ClientDeliveryInput): ClientDeliveryDocument[] {
  return [
    deliveryPlan(input),
    evidenceLog(input),
    qaChecklist(input.client),
    weeklyDeliverySummary(input),
    clientUpdateDraft(input),
  ];
}

export function buildEvidenceDocument(input: ClientDeliveryInput): ClientDeliveryDocument {
  return evidenceLog(input);
}

function deliveryPlan(input: ClientDeliveryInput): ClientDeliveryDocument {
  const { client } = input;
  const weeklyPlan = deliveryWeeks(client.serviceType);

  return doc('delivery-plan.md', 'Client Delivery Plan', [
    '# Client Delivery Plan',
    '',
    '## Client Overview',
    '',
    bullets([
      `Client: ${client.companyName}`,
      `Website: ${client.website}`,
      `Service type: ${client.serviceType}`,
      `Status: ${client.status}`,
      `Start date: ${client.startDate}`,
      `Current focus: ${client.currentFocus}`,
      `Local workflow assets: ${sourceSummary(input.sources)}`,
    ]),
    '',
    '## Current Scope',
    '',
    bullets(currentScope(client)),
    '',
    '## Success Criteria',
    '',
    bullets(successCriteria(client.serviceType)),
    '',
    '## Risks',
    '',
    bullets(client.openRisks.length > 0 ? client.openRisks : ['No open risks are recorded locally. Confirm manually before sharing status.']),
    '',
    '## Week 1',
    '',
    bullets(weeklyPlan.week1),
    '',
    '## Week 2',
    '',
    bullets(weeklyPlan.week2),
    '',
    '## Week 3',
    '',
    bullets(weeklyPlan.week3),
    '',
    '## Week 4',
    '',
    bullets(weeklyPlan.week4),
    '',
    '## Renewal Opportunity',
    '',
    bullets(renewalOpportunity(client)),
    '',
    '## Manual Approval Notes',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function evidenceLog(input: ClientDeliveryInput): ClientDeliveryDocument {
  const { client } = input;
  const inventory = buildEvidenceInventory(client, input.sources);

  return doc('evidence-log.md', 'Evidence Log', [
    '# Evidence Log',
    '',
    '## Client',
    '',
    bullets([
      `Client: ${client.companyName}`,
      `Service type: ${client.serviceType}`,
      `Status: ${client.status}`,
    ]),
    '',
    '## Audit Evidence',
    '',
    evidenceLines(inventory.auditEvidence),
    '',
    '## Screenshots',
    '',
    evidenceLines(inventory.screenshots),
    '',
    '## Test Results',
    '',
    evidenceLines(inventory.testResults),
    '',
    '## Defects',
    '',
    evidenceLines(inventory.defects),
    '',
    '## Risks',
    '',
    evidenceLines(inventory.risks),
    '',
    '## Recommendations',
    '',
    evidenceLines(inventory.recommendations),
    '',
    '## Follow-Up Items',
    '',
    evidenceLines(inventory.followUpItems),
    '',
    '## Manual Approval Notes',
    '',
    bullets([
      'Do not add evidence unless it exists locally and has been reviewed.',
      'Do not include credentials, secrets, private client data, or sensitive screenshots.',
      'Daniel must approve evidence before it is used in client-facing updates.',
    ]),
  ]);
}

function qaChecklist(client: Client): ClientDeliveryDocument {
  return doc('qa-checklist.md', 'QA Execution Checklist', [
    '# QA Execution Checklist',
    '',
    '## Scope Confirmation',
    '',
    checklist([
      `Confirm approved scope for ${client.companyName}`,
      'Confirm approved environments without storing credentials in this repo',
      'Confirm which flows are explicitly out of scope',
      'Confirm evidence handling rules before screenshots or reports are shared',
    ]),
    '',
    '## Execution',
    '',
    checklist(executionChecklist(client.serviceType)),
    '',
    '## Evidence Review',
    '',
    checklist([
      'Review screenshots, traces, logs, and reports before client use',
      'Remove unsupported claims, fake metrics, and unverified defects',
      'Confirm failures are reproducible or clearly labeled as one-time observations',
      'Confirm no private data appears in evidence',
    ]),
    '',
    '## Delivery Readiness',
    '',
    checklist([
      'Delivery plan reviewed by Daniel',
      'Weekly summary reviewed by Daniel',
      'Client update draft reviewed by Daniel',
      'No outreach or client message sent automatically',
    ]),
  ]);
}

function weeklyDeliverySummary(input: ClientDeliveryInput): ClientDeliveryDocument {
  const { client } = input;

  return doc('weekly-delivery-summary.md', 'Weekly Delivery Summary', [
    '# Weekly Delivery Summary',
    '',
    '## Client',
    '',
    bullets([
      `Client: ${client.companyName}`,
      `Service type: ${client.serviceType}`,
      `Status: ${client.status}`,
      `Last report date: ${client.lastReportDate || 'Not recorded'}`,
    ]),
    '',
    '## Work Completed',
    '',
    bullets(client.completedWork.length > 0 ? client.completedWork : [noEvidence]),
    '',
    '## Current Focus',
    '',
    bullets([client.currentFocus || 'No current focus recorded.']),
    '',
    '## Open Risks',
    '',
    bullets(client.openRisks.length > 0 ? client.openRisks : [noEvidence]),
    '',
    '## Recommended Next Steps',
    '',
    bullets(client.recommendedNextSteps.length > 0 ? client.recommendedNextSteps : ['Review scope and choose one safe next QA action.']),
    '',
    '## Evidence Status',
    '',
    bullets(sourceEvidenceSummary(input.sources)),
    '',
    '## Manual Approval Notes',
    '',
    bullets(manualApprovalNotes()),
  ]);
}

function clientUpdateDraft(input: ClientDeliveryInput): ClientDeliveryDocument {
  const { client } = input;

  return doc('client-update-draft.md', 'Client Update Draft', [
    '# Client Update Draft',
    '',
    `Hi ${client.companyName} team,`,
    '',
    'Here is the current QA delivery update for manual review:',
    '',
    bullets([
      `Current focus: ${client.currentFocus}`,
      `Completed work: ${client.completedWork.join('; ') || noEvidence}`,
      `Open risks: ${client.openRisks.join('; ') || noEvidence}`,
      `Recommended next steps: ${client.recommendedNextSteps.join('; ') || 'Review scope and choose the next approved QA action.'}`,
    ]),
    '',
    'No action is needed from this draft until Daniel reviews the wording, evidence, scope, and any client-facing claims.',
    '',
    'Daniel',
    '',
    '## Manual Approval Notes',
    '',
    bullets([
      'This is a draft only and was not sent.',
      'Remove unsupported claims before client use.',
      'Do not include credentials, private data, sensitive screenshots, or unreviewed defects.',
      'Daniel must approve before sending manually.',
    ]),
  ]);
}

function buildEvidenceInventory(client: Client, sources: LocalDeliverySource[]): EvidenceInventory {
  const auditSources = sources.filter((source) => source.exists && source.label.toLowerCase().includes('audit'));
  const testResultSources = sources.filter((source) => source.exists && source.label.toLowerCase().includes('test result'));

  return {
    auditEvidence: auditSources.map((source) => `${source.label}: ${source.path}`),
    screenshots: [],
    testResults: testResultSources.map((source) => `${source.label}: ${source.path}`),
    defects: [],
    risks: client.openRisks,
    recommendations: client.recommendedNextSteps,
    followUpItems: client.recommendedNextSteps,
  };
}

function deliveryWeeks(serviceType: ClientServiceType): { week1: string[]; week2: string[]; week3: string[]; week4: string[] } {
  if (serviceType === 'qa-audit') {
    return {
      week1: ['Confirm scope, allowed URLs, and evidence handling.', 'Run approved manual review and document risks.', 'Draft audit findings with cautious language.'],
      week2: ['Review findings with Daniel.', 'Prepare final audit report.', 'Identify starter automation opportunities.'],
      week3: ['Prepare optional starter-pack recommendation if justified.', 'Clarify scope for any follow-up implementation.', 'Keep communication manual and approval-gated.'],
      week4: ['Review renewal or follow-up opportunity.', 'Archive local delivery evidence.', 'Prepare a manual client update if approved.'],
    };
  }

  if (serviceType === 'playwright-starter-pack') {
    return {
      week1: ['Confirm approved flows and environment boundaries.', 'Set up or review Playwright framework structure.', 'Create first safe smoke checks.'],
      week2: ['Expand smoke coverage for approved flows.', 'Add clear reporting and failure evidence.', 'Review stability before client handoff.'],
      week3: ['Document run instructions and maintenance notes.', 'Review CI readiness without adding secrets.', 'Prepare delivery summary.'],
      week4: ['Deliver starter pack summary.', 'Discuss maintenance only if recurring QA need is confirmed.', 'Prepare client report draft.'],
    };
  }

  return {
    week1: ['Confirm monthly scope, approved workflows, and evidence handling.', 'Review current risks and existing coverage.', 'Prioritize the next highest-value QA action.'],
    week2: ['Maintain or add approved smoke coverage.', 'Review failures and document evidence.', 'Prepare concise progress notes.'],
    week3: ['Expand coverage for one agreed workflow.', 'Reduce flaky checks where found.', 'Review upcoming release risk.'],
    week4: ['Prepare monthly delivery summary.', 'Recommend next-month priorities.', 'Review renewal or retainer value conversation topics.'],
  };
}

function currentScope(client: Client): string[] {
  if (client.serviceType === 'qa-audit') {
    return ['Focused QA audit for approved flows.', 'Evidence-backed risks and recommendations.', 'No ongoing automation unless separately approved.'];
  }

  if (client.serviceType === 'playwright-starter-pack') {
    return ['Starter Playwright framework and smoke coverage for approved flows.', 'Reporting and run instructions.', 'No unapproved credentialed or production-destructive testing.'];
  }

  return ['Recurring QA automation support for approved workflows.', 'Maintenance, expansion, and reporting within agreed monthly scope.', 'No unlimited QA or full-product coverage claims.'];
}

function successCriteria(serviceType: ClientServiceType): string[] {
  if (serviceType === 'qa-audit') {
    return ['Client receives a clear QA risk summary.', 'Recommendations are prioritized and evidence-backed.', 'No unsupported compliance or performance claims are included.'];
  }

  if (serviceType === 'playwright-starter-pack') {
    return ['Approved smoke tests are readable and maintainable.', 'Reports or failure evidence are available locally.', 'Run instructions avoid real secrets and private data.'];
  }

  return ['Monthly work is documented clearly.', 'Approved tests or QA checks remain useful and maintained.', 'Client receives concise risk and next-action visibility.'];
}

function executionChecklist(serviceType: ClientServiceType): string[] {
  if (serviceType === 'qa-audit') {
    return ['Review approved flows only', 'Capture observations and evidence paths', 'Prioritize risks by client impact', 'Draft recommendations without guarantees'];
  }

  if (serviceType === 'playwright-starter-pack') {
    return ['Use Playwright + TypeScript', 'Use Page Object Model where UI tests are added', 'Use stable locators first', 'Avoid hard waits', 'Capture HTML report or failure artifacts'];
  }

  return ['Review monthly scope', 'Maintain approved checks', 'Document failures and risks', 'Update coverage recommendations', 'Prepare monthly report draft'];
}

function renewalOpportunity(client: Client): string[] {
  if (client.serviceType === 'qa-automation-retainer' || client.serviceType === 'agency-partner-retainer') {
    return ['Protect active retainer value with clear monthly evidence.', 'Use recurring risks and completed work to frame renewal discussions.', `Recorded monthly fee: $${client.monthlyFee.toLocaleString('en-US')}.`];
  }

  return ['Consider retainer only if recurring QA risk is confirmed.', 'Use delivered audit/starter value to identify a small maintenance scope.', 'Do not pitch recurring work before value is reviewed.'];
}

function sourceSummary(sources: LocalDeliverySource[]): string {
  const available = sources.filter((source) => source.exists);
  if (available.length === 0) return 'No local client workflow or report artifacts detected.';
  return available.map((source) => `${source.label} at ${source.path}`).join('; ');
}

function sourceEvidenceSummary(sources: LocalDeliverySource[]): string[] {
  const available = sources.filter((source) => source.exists);
  if (available.length === 0) return [noEvidence];
  return available.map((source) => `${source.label}: ${source.path}`);
}

function evidenceLines(lines: string[]): string {
  return bullets(lines.length > 0 ? lines : [noEvidence]);
}

function manualApprovalNotes(): string[] {
  return [
    'Human approval is required before client communication.',
    'No APIs, browser automation, external services, credentials, or client-system access were used.',
    'Do not create invoices, payment links, or external records from this workflow.',
    'Use local evidence only after Daniel reviews it.',
  ];
}

function doc(fileName: ClientDeliveryDocument['fileName'], title: string, lines: string[]): ClientDeliveryDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function checklist(lines: string[]): string {
  return lines.map((line) => `- [ ] ${line}`).join('\n');
}
