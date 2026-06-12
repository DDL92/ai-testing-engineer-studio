import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';
import {
  FirstAuditWorkflowInput,
  FirstAuditWorkflowReport,
  FirstAuditWorkflowSource,
  WorkflowDocument,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'first-audit-workflow');

const suggestedCommands = [
  'npm run client-readiness:pack',
  'npm run proposal:center',
  'npm run sow:center',
  'npm run revenue:command-center',
  'npm run mac:daily',
];

const manualApprovalReminder = [
  'Human approval is required before discovery calls, scope confirmation, proposals, invoices, payment tracking, kickoff, delivery, reports, or retainer conversion.',
  'This workflow prepares assets only. It does not process payments or send invoices.',
  'No APIs, scraping, browsing, CRM, outreach automation, payment processing, invoice generation, credentials, or external databases were used.',
  'Do not invent findings, defects, clients, evidence, approvals, payment status, or outcomes.',
  'Do not guarantee audit results, retainer conversion, revenue, production readiness, compliance, or complete coverage.',
];

export function loadFirstAuditWorkflowInput(): FirstAuditWorkflowInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    clients: readJson<Client[]>(path.join('data', 'clients.json'), []),
    contextSources: [
      readContextSource('Real client readiness pack', path.join('output', 'real-client-readiness', 'real-client-readiness-pack.md')),
      readContextSource('First audit sales pack', path.join('output', 'real-client-readiness', 'first-audit-sales-pack.md')),
      readContextSource('Proposal command center', path.join('output', 'proposal-center', 'proposal-command-center.md')),
      readContextSource('SOW readiness report', path.join('output', 'proposal-center', 'sow-readiness-report.md')),
      readContextSource('Outreach execution pack', path.join('output', 'outreach-execution', 'outreach-execution-pack.md')),
      readContextSource('Revenue command center', path.join('output', 'revenue-command-center', 'revenue-command-center.md')),
      readContextSource('Leads', path.join('data', 'leads.json')),
      readContextSource('Clients', path.join('data', 'clients.json')),
    ],
  };
}

export function buildFirstAuditWorkflowReport(input: FirstAuditWorkflowInput): FirstAuditWorkflowReport {
  return {
    generatedAt: input.generatedAt,
    leadsReviewed: input.leads.length,
    clientsReviewed: input.clients.length,
    contextSources: input.contextSources,
    suggestedCommands,
  };
}

export function writeFirstAuditWorkflowOutputs(report: FirstAuditWorkflowReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const documents = buildWorkflowDocuments(report);
  for (const document of documents) {
    fs.writeFileSync(path.join(outputRoot, document.fileName), document.body, 'utf8');
  }

  return documents.map((document) => path.join(outputRoot, document.fileName));
}

export function writeAuditKickoffOutput(report: FirstAuditWorkflowReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'audit-kickoff-plan.md');
  fs.writeFileSync(outputPath, renderAuditKickoffPlan(report), 'utf8');
  return outputPath;
}

function buildWorkflowDocuments(report: FirstAuditWorkflowReport): WorkflowDocument[] {
  return [
    { fileName: 'first-audit-workflow.md', body: renderFirstAuditWorkflow(report) },
    { fileName: 'discovery-call-prep.md', body: renderDiscoveryCallPrep(report) },
    { fileName: 'audit-scope-confirmation.md', body: renderAuditScopeConfirmation(report) },
    { fileName: 'audit-kickoff-plan.md', body: renderAuditKickoffPlan(report) },
    { fileName: 'audit-delivery-checklist.md', body: renderAuditDeliveryChecklist(report) },
    { fileName: 'retainer-upgrade-path.md', body: renderRetainerUpgradePath(report) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];
}

export function renderFirstAuditWorkflow(report: FirstAuditWorkflowReport): string {
  return [
    '# First Audit Workflow',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Positive Reply Received',
    renderList([
      'Record the reply manually in local notes.',
      'Confirm the prospect is asking for next steps before proposing a call or scope.',
      'Do not infer budget, urgency, defects, or approval from a positive reply.',
    ]),
    '',
    '## Discovery Call',
    renderList([
      'Use the discovery questions in `discovery-call-prep.md`.',
      'Clarify workflow, business context, release process, QA ownership, and desired audit outcome.',
      'Do not promise findings, ROI, compliance, or production readiness.',
    ]),
    '',
    '## Audit Scope Review',
    renderList([
      'Confirm audit type: QA Audit, Playwright Starter Pack, or Retainer Preparation.',
      'Confirm in-scope and out-of-scope workflows before work begins.',
      'Avoid private, production, payment, or authenticated systems unless explicitly approved and safely scoped later.',
    ]),
    '',
    '## Audit Approval',
    renderList([
      'Review pricing, scope, deliverables, timeline, and exclusions manually.',
      'Get explicit client approval before kickoff.',
      'Daniel approves before any client-facing commitment.',
    ]),
    '',
    '## Manual Payment Tracking',
    renderList([
      'Track payment/invoice status manually outside this workflow.',
      'This sprint does not process payments.',
      'This sprint does not generate or send invoices.',
      'Do not mark payment as received unless Daniel manually confirms it.',
    ]),
    '',
    '## Kickoff',
    renderList([
      'Use `audit-kickoff-plan.md` to verify environment, access, evidence, reporting, and communication plan.',
      'Start only after scope, approvals, and manual payment/invoice status are clear.',
    ]),
    '',
    '## Delivery',
    renderList([
      'Collect evidence only from approved scope.',
      'Review screenshots and notes before writing findings.',
      'Do not invent defects, findings, metrics, or severity.',
    ]),
    '',
    '## Reporting',
    renderList([
      'Prepare a concise audit report with evidence-backed observations.',
      'Keep recommendations practical and clearly scoped.',
      'Daniel approves before sending any report.',
    ]),
    '',
    '## Retainer Conversion',
    renderList([
      'Use the retainer upgrade path only after audit value and next-step fit are clear.',
      'Do not guarantee conversion.',
      'Position retainer as optional, evidence-backed next step.',
    ]),
    '',
    '## Suggested Commands',
    renderList(report.suggestedCommands.map((command) => `\`${command}\``)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
    '## Local Context Read',
    renderContextSources(report.contextSources),
    '',
  ].join('\n');
}

export function renderDiscoveryCallPrep(report: FirstAuditWorkflowReport): string {
  return [
    '# Discovery Call Prep',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Generate questions only. Do not invent answers.',
    '',
    '## Questions',
    renderList([
      'Current release process: How do releases move from development to production today?',
      'QA ownership: Who currently owns QA decisions, test coverage, and release sign-off?',
      'Regression process: How do you decide what needs regression testing before a release?',
      'Production issues: What types of production issues have been most painful recently?',
      'Onboarding flow: Which onboarding steps matter most for new users or customers?',
      'Booking flow: Are booking, scheduling, or reservation flows part of the critical path?',
      'Checkout flow: Are checkout, billing, or payment-adjacent flows in scope for review?',
      'Deployment cadence: How often do you deploy or release customer-facing changes?',
      'Automation coverage: Do you currently have Playwright, Cypress, Selenium, unit, API, or CI coverage?',
      'Pain points: What QA bottleneck would make this audit worth doing?',
      'Success criteria: What would a useful audit deliverable look like for your team?',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderAuditScopeConfirmation(report: FirstAuditWorkflowReport): string {
  return [
    '# Audit Scope Confirmation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## In Scope',
    renderList([
      'QA Audit: focused review of approved public or provided workflows.',
      'Playwright Starter Pack: small automation foundation for approved smoke flows.',
      'Retainer Preparation: audit-backed roadmap for recurring QA automation support.',
    ]),
    '',
    '## Out Of Scope',
    renderList([
      'Unapproved production systems.',
      'Payment processing or live transactions.',
      'Private data, credentials, or sensitive screenshots.',
      'Compliance certification, accessibility certification, security testing, or load testing unless explicitly scoped later.',
    ]),
    '',
    '## Assumptions',
    renderList([
      'Client confirms the approved URL, workflow, environment, and constraints.',
      'Daniel reviews all scope and pricing before client-facing use.',
      'Findings must be evidence-backed.',
    ]),
    '',
    '## Risks',
    renderList([
      'Scope can expand if workflows are not clearly bounded.',
      'Private or authenticated systems may require additional approvals and safeguards.',
      'Audit recommendations should not be framed as guaranteed outcomes.',
    ]),
    '',
    '## Approvals Required',
    renderList([
      'Client approval for scope.',
      'Daniel approval for scope, pricing, timeline, and deliverables.',
      'Manual confirmation before payment/invoice tracking.',
    ]),
    '',
    '## Expected Deliverables',
    renderList([
      'QA risk summary.',
      'Evidence-backed findings and notes.',
      'Screenshots when approved and safe.',
      'Playwright smoke-test opportunities.',
      'Automation roadmap.',
      'Recommended next step.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderAuditKickoffPlan(report: FirstAuditWorkflowReport): string {
  return [
    '# Audit Kickoff Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Kickoff Checklist',
    renderChecklist([
      'positive reply recorded manually',
      'discovery call completed or intentionally skipped with approval',
      'audit type selected',
      'scope confirmed',
      'pricing reviewed',
      'client approval received',
      'Daniel approval received',
    ]),
    '',
    '## Environment Confirmation',
    renderChecklist([
      'approved URL confirmed',
      'environment type confirmed',
      'public/staging/production boundary understood',
      'do not use credentials unless separately approved',
      'do not test payment flow unless separately approved',
    ]),
    '',
    '## Access Checklist',
    renderChecklist([
      'no credentials required by default',
      'no private data requested',
      'no production client systems accessed without approval',
      'access limitations documented',
    ]),
    '',
    '## Evidence Collection Plan',
    renderList([
      'Capture only approved screenshots and notes.',
      'Record page/workflow context clearly.',
      'Separate observations from confirmed findings.',
      'Do not invent defects or severity.',
    ]),
    '',
    '## Reporting Plan',
    renderList([
      'Summarize scope, evidence, findings, risks, recommendations, and next steps.',
      'Flag unknowns and limitations.',
      'Daniel reviews before client delivery.',
    ]),
    '',
    '## Communication Plan',
    renderList([
      'Use manual communication only.',
      'Confirm kickoff, delivery timeline, and report handoff manually.',
      'Do not automate emails, messages, invoices, or reminders.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderAuditDeliveryChecklist(report: FirstAuditWorkflowReport): string {
  return [
    '# Audit Delivery Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderChecklist([
      'scope confirmed',
      'evidence collected',
      'screenshots reviewed',
      'findings reviewed',
      'recommendations reviewed',
      'report approved',
      'client update drafted',
      'delivery approved',
    ]),
    '',
    '## Delivery Rules',
    renderList([
      'Use evidence only.',
      'Do not invent findings, defects, severity, metrics, or outcomes.',
      'Do not expose sensitive screenshots or private data.',
      'Daniel approves before sending.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRetainerUpgradePath(report: FirstAuditWorkflowReport): string {
  return [
    '# Retainer Upgrade Path',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer',
    '',
    '## QA Audit',
    renderList([
      'Price: $199-$500',
      'Objective: Identify practical QA risks and automation opportunities from approved scope.',
      'Value: Gives the prospect evidence and a small first step.',
      'Next step: Review audit report and decide whether a starter pack is justified.',
      'Approval required: Client and Daniel approve scope, pricing, and deliverables.',
    ]),
    '',
    '## Playwright Starter Pack',
    renderList([
      'Price: $900-$1,500',
      'Objective: Build a small Playwright smoke-test foundation for approved workflows.',
      'Value: Converts audit recommendations into runnable automation evidence.',
      'Next step: Review maintenance needs and recurring regression priorities.',
      'Approval required: Client and Daniel approve workflows, environment, timeline, and access constraints.',
    ]),
    '',
    '## QA Automation Retainer',
    renderList([
      'Price: $1,500-$3,000/month',
      'Objective: Maintain and extend QA automation for approved recurring needs.',
      'Value: Creates ongoing regression support, reporting, and risk visibility.',
      'Next step: Define monthly scope, cadence, reporting, and renewal expectations.',
      'Approval required: Client and Daniel approve monthly scope, pricing, communication cadence, and boundaries.',
    ]),
    '',
    '## Safety Notes',
    renderList([
      'Do not guarantee conversions.',
      'Do not guarantee outcomes.',
      'Do not treat upgrade opportunities as booked revenue.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(report: FirstAuditWorkflowReport): string {
  return [
    '# Approval Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderChecklist([
      'discovery call completed',
      'scope approved',
      'pricing reviewed',
      'deliverables reviewed',
      'no invented findings',
      'no unsupported claims',
      'client approval received',
      'Daniel approval received',
    ]),
    '',
    '## Payment / Invoice Boundary',
    renderChecklist([
      'no payment processed by this workflow',
      'no invoice generated by this workflow',
      'manual payment/invoice status tracked outside this workflow',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): FirstAuditWorkflowSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function renderContextSources(sources: FirstAuditWorkflowSource[]): string {
  return sources.map((source) => {
    const status = source.exists ? 'available' : 'missing';
    const excerpt = source.exists && source.excerpt ? ` Summary: ${source.excerpt}` : '';
    return `- ${source.label}: ${status} (${source.path}).${excerpt}`;
  }).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}
