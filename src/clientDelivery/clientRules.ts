import fs = require('fs');
import path = require('path');
import {
  ClientDeliveryAssessment,
  ClientDeliveryAutomationInput,
  DeliveryClient,
  DeliverySource,
} from './types';

const clientsPath = path.join(process.cwd(), 'data', 'clients', 'clients.json');
const outputDir = path.join(process.cwd(), 'output', 'client-delivery');

const safetyNotes = [
  'Human approval required before client use.',
  'Review required before sending.',
  'Evidence based only.',
  'No reports, emails, invoices, contracts, payment links, or client messages were sent.',
  'No client feedback, client satisfaction, delivered work, revenue, payment status, or acceptance was invented.',
];

export function loadDeliveryClients(): DeliveryClient[] {
  return readJson<DeliveryClient[]>(clientsPath, []);
}

export function buildClientDeliveryInput(clientId: string): ClientDeliveryAutomationInput {
  const client = findClient(clientId);
  if (!client) {
    throw new Error(`Client not found in data/clients/clients.json: ${clientId}`);
  }

  return {
    generatedAt: new Date().toISOString(),
    client,
    sources: buildSources(client),
  };
}

export function writeClientOnboarding(input: ClientDeliveryAutomationInput): string {
  return writeOutput('client-onboarding.md', renderClientOnboarding(input));
}

export function writeWeeklyReport(input: ClientDeliveryAutomationInput): string {
  return writeOutput('weekly-report.md', renderWeeklyReport(input));
}

export function writeMonthlyReport(input: ClientDeliveryAutomationInput): string {
  return writeOutput('monthly-report.md', renderMonthlyReport(input));
}

export function writeRenewalReview(input: ClientDeliveryAutomationInput): string[] {
  const assessment = assessClient(input);
  return [
    writeOutput('renewal-review.md', renderRenewalReview(input, assessment)),
    writeOutput('client-health.md', renderClientHealth(input, assessment)),
    writeOutput('client-retention.md', renderClientRetention(input, assessment)),
  ];
}

export function renderClientOnboarding(input: ClientDeliveryAutomationInput): string {
  const { client } = input;

  return `# Client Onboarding

Generated: ${input.generatedAt}

## Onboarding Summary

${bullets([
    `Client Name: ${client.clientName}`,
    `Start Date: ${client.startDate}`,
    `Engagement Type: ${client.engagementType}`,
    `Reporting Schedule: ${client.reportingSchedule}`,
    `Next Milestone: ${client.nextMilestone}`,
  ])}

## Scope

${bullets(client.scope)}

## Deliverables

${bullets(client.deliverables)}

## Available Local Sources

${sourceLines(input.sources)}

## Safety

${bullets(safetyNotes)}
`;
}

export function renderWeeklyReport(input: ClientDeliveryAutomationInput): string {
  const { client } = input;
  const evidence = availableSources(input.sources);

  return `# Weekly Client Report

Generated: ${input.generatedAt}

## Completed Activities

${bullets(completedActivities(input))}

## Evidence Generated

${bullets(evidence.length > 0 ? evidence.map((source) => `${source.label}: ${source.path}`) : ['No local evidence artifacts found.'])}

## Coverage Added

${bullets(client.coverageAdded.length > 0 ? client.coverageAdded : ['No added coverage is recorded in local client data.'])}

## Observations

${bullets(client.observations.length > 0 ? client.observations : ['No observations are recorded in local client data.'])}

## Next Week Focus

${bullets(client.nextWeekFocus)}

## Safety

${bullets(safetyNotes)}
`;
}

export function renderMonthlyReport(input: ClientDeliveryAutomationInput): string {
  const { client } = input;

  return `# Monthly Client Report

Generated: ${input.generatedAt}

## Executive Summary

${bullets([
    `${client.clientName} is currently in ${client.status} status in local delivery data.`,
    'This report summarizes local generated evidence and recorded delivery-prep notes only.',
    'No client satisfaction, acceptance, payment, or sent-report status is inferred.',
  ])}

## Work Completed

${bullets(completedActivities(input))}

## Evidence Delivered

${bullets([
    'No evidence is recorded locally as delivered to the client.',
    ...availableSources(input.sources).map((source) => `Local review artifact available: ${source.label}: ${source.path}`),
  ])}

## Automation Progress

${bullets(automationProgress(input))}

## Risk Areas

${bullets(client.riskAreas.length > 0 ? client.riskAreas : ['No risk areas are recorded locally.'])}

## Recommendations

${bullets(client.recommendations)}

## Safety

${bullets(safetyNotes)}
`;
}

export function renderRenewalReview(input: ClientDeliveryAutomationInput, assessment: ClientDeliveryAssessment): string {
  return `# Renewal Review

Generated: ${input.generatedAt}

## Renewal Summary

${bullets([
    `Client Health: ${assessment.healthScore}`,
    `Renewal Probability: ${assessment.renewalProbability}`,
    `Recommended Next Step: ${assessment.recommendedNextStep}`,
  ])}

## Value Delivered

${bullets(assessment.valueDelivered)}

## Expansion Opportunity

${bullets(assessment.expansionOpportunities)}

## Safety

${bullets(safetyNotes)}
`;
}

export function renderClientHealth(input: ClientDeliveryAutomationInput, assessment: ClientDeliveryAssessment): string {
  return `# Client Health

Generated: ${input.generatedAt}

${bullets([
    `Client: ${input.client.clientName}`,
    `Health Score: ${assessment.healthScore}`,
    `Basis: ${healthBasis(input).join('; ')}`,
  ])}

## Safety

${bullets(safetyNotes)}
`;
}

export function renderClientRetention(input: ClientDeliveryAutomationInput, assessment: ClientDeliveryAssessment): string {
  return `# Client Retention

Generated: ${input.generatedAt}

## Retention Opportunities

${bullets(assessment.expansionOpportunities)}

## Renewal Notes

${bullets(input.client.renewalNotes)}

## Recommended Next Step

- ${assessment.recommendedNextStep}

## Safety

${bullets(safetyNotes)}
`;
}

function assessClient(input: ClientDeliveryAutomationInput): ClientDeliveryAssessment {
  const sourceCount = availableSources(input.sources).length;
  const hasAudit = hasSource(input, 'Audit Report') || hasSource(input, 'Unified Audit');
  const hasProposal = hasSource(input, 'Proposal');
  const hasEvidence = hasSource(input, 'Evidence') || hasSource(input, 'Playwright') || hasSource(input, 'Lighthouse');
  const healthScore = healthScoreFor(input, { sourceCount, hasAudit, hasProposal, hasEvidence });
  const expansionOpportunities = retentionOpportunities(input);

  return {
    healthScore,
    valueDelivered: valueDelivered(input),
    renewalProbability: healthScore === 'Green' ? 'Medium' : healthScore === 'Yellow' ? 'Low' : 'Low',
    expansionOpportunities,
    recommendedNextStep: hasAudit && hasProposal
      ? 'Review audit report, proposal, and evidence package before any client-facing delivery or renewal discussion.'
      : 'Collect or review missing local evidence before client-facing delivery planning.',
  };
}

function healthScoreFor(
  input: ClientDeliveryAutomationInput,
  signals: { sourceCount: number; hasAudit: boolean; hasProposal: boolean; hasEvidence: boolean },
): 'Green' | 'Yellow' | 'Red' {
  if (input.client.status === 'at-risk') return 'Red';
  if (input.client.status === 'delivery-prep') return signals.sourceCount >= 2 ? 'Yellow' : 'Red';
  if (signals.hasAudit && signals.hasProposal && signals.hasEvidence && input.client.riskAreas.length <= 3) return 'Green';
  if (signals.sourceCount >= 2) return 'Yellow';
  return 'Red';
}

function valueDelivered(input: ClientDeliveryAutomationInput): string[] {
  const recorded = input.client.completedActivities;
  if (recorded.length > 0) return recorded;
  return [
    'No client-delivered work is recorded in local data.',
    ...availableSources(input.sources).map((source) => `Local review artifact available: ${source.label}: ${source.path}`),
  ];
}

function retentionOpportunities(input: ClientDeliveryAutomationInput): string[] {
  const opportunities: string[] = [];
  if (hasSource(input, 'Audit Report')) opportunities.push('Additional Audit: Supported by existing audit report artifacts.');
  if (hasSource(input, 'Playwright')) opportunities.push('Additional Coverage: Supported by existing Playwright evidence artifacts.');
  if (hasSource(input, 'Playwright') && hasSource(input, 'Lighthouse')) opportunities.push('Automation Expansion: Supported by combined Playwright and Lighthouse evidence.');
  if (hasSource(input, 'Proposal')) opportunities.push('Retainer Continuation: Review proposal and evidence before discussing any retainer path.');
  return opportunities.length > 0 ? opportunities : ['No retention opportunity is supported by current local evidence.'];
}

function completedActivities(input: ClientDeliveryAutomationInput): string[] {
  const recorded = input.client.completedActivities;
  const generated = availableSources(input.sources).map((source) => `Generated local ${source.label} artifact for review: ${source.path}`);
  return [...recorded, ...generated].length > 0
    ? [...recorded, ...generated]
    : ['No completed activities are recorded in local client data.'];
}

function automationProgress(input: ClientDeliveryAutomationInput): string[] {
  const progress: string[] = [];
  if (hasSource(input, 'Playwright')) progress.push('Playwright evidence artifacts are available for review.');
  if (hasSource(input, 'Lighthouse')) progress.push('Lighthouse evidence artifacts are available for review.');
  if (input.client.coverageAdded.length > 0) progress.push(...input.client.coverageAdded);
  return progress.length > 0 ? progress : ['No automation progress is recorded locally.'];
}

function healthBasis(input: ClientDeliveryAutomationInput): string[] {
  return [
    `${availableSources(input.sources).length} local source artifacts available`,
    `${input.client.riskAreas.length} risk areas recorded`,
    `Client status is ${input.client.status}`,
  ];
}

function buildSources(client: DeliveryClient): DeliverySource[] {
  const id = client.clientId;
  return [
    source('Audit Report Markdown', `output/client-audit-reports/${id}-qa-audit-report.md`),
    source('Audit Report PDF', `output/client-audit-reports/${id}-qa-audit-report.pdf`),
    source('Unified Audit', `output/unified-audits/${id}-unified-audit.md`),
    source('Proposal Markdown', `output/proposals/${id}-proposal.md`),
    source('Proposal PDF', `output/proposals/${id}-proposal.pdf`),
    source('Evidence Report', `output/evidence/${id}-evidence.md`),
    source('Playwright Evidence', `output/playwright-runner/${id}-playwright-evidence.md`),
    source('Lighthouse Evidence', `output/lighthouse/${id}-lighthouse.md`),
    source('Daily Plan', 'output/daily-revenue/today-plan.md'),
    source('Weekly Revenue Review', 'output/daily-revenue/week-review.md'),
  ];
}

function source(label: string, relativePath: string): DeliverySource {
  return {
    label,
    path: relativePath,
    exists: fs.existsSync(path.join(process.cwd(), relativePath)),
  };
}

function sourceLines(sources: DeliverySource[]): string {
  return sources.map((source) => `- ${source.label}: ${source.exists ? 'Available' : 'Missing'} (${source.path})`).join('\n');
}

function availableSources(sources: DeliverySource[]): DeliverySource[] {
  return sources.filter((source) => source.exists);
}

function hasSource(input: ClientDeliveryAutomationInput, labelPart: string): boolean {
  return input.sources.some((source) => source.exists && source.label.includes(labelPart));
}

function findClient(clientId: string): DeliveryClient | undefined {
  const normalized = normalize(clientId);
  return loadDeliveryClients().find((client) => normalize(client.clientId) === normalized || normalize(client.clientName) === normalized);
}

function writeOutput(fileName: string, body: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, body, 'utf8');
  return outputPath;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
