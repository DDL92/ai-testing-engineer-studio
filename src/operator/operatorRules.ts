import { Client } from '../clientReports/types';
import {
  ClientHealth,
  ContactReview,
  FollowUpSummary,
  Lead,
  OperatorAction,
  OperatorDocument,
  OperatorInput,
  OperatorOpportunity,
  RenewalClient,
} from './types';

const insufficientData = 'Insufficient data available.';

export function buildDailyCommandCenter(input: OperatorInput): OperatorDocument {
  const opportunities = topOpportunities(input).slice(0, 10);
  const followUps = followUpSummary(input);
  const renewals = renewalClients(input);
  const health = healthCounts(renewals);
  const expansion = expansionWatchlist(input, renewals);
  const renewalWatch = renewals.filter((record) => record.health === 'YELLOW' || record.health === 'RED');
  const actions = topActions(input, opportunities, followUps, renewalWatch, expansion).slice(0, 5);

  return doc('daily-command-center.md', 'AI Studio Daily Command Center', [
    '# AI Studio Daily Command Center',
    '',
    `Generated At: ${input.generatedAt}`,
    '',
    '## Revenue Snapshot',
    '',
    bullets([
      `Estimated MRR: $${estimatedMrr(input.clients).toLocaleString('en-US')}`,
      `Active Clients: ${input.clients.filter((client) => client.status === 'active').length}`,
      `Renewal Risks: ${renewalWatch.length}`,
      `Expansion Opportunities: ${expansion.length}`,
    ]),
    '',
    '## Top Opportunities',
    '',
    opportunities.length > 0
      ? table(
          ['Company', 'Opportunity Score', 'Stage', 'Next Action', 'Daily Priority Score'],
          opportunities.map((opportunity) => [
            opportunity.company,
            `${opportunity.opportunityScore}`,
            opportunity.stage,
            opportunity.nextAction,
            `${opportunity.dailyPriorityScore}`,
          ]),
        )
      : insufficientData,
    '',
    '## Follow-Ups',
    '',
    bullets([
      `Follow-ups due: ${followUps.due.length}`,
      `Follow-ups overdue: ${followUps.overdue.length}`,
      ...followUps.overdue.map((review) => `Overdue: ${review.companyName} (${review.nextFollowUpDate})`),
      ...followUps.due.map((review) => `Due: ${review.companyName} (${review.nextFollowUpDate})`),
    ]),
    '',
    '## Client Health',
    '',
    bullets([`GREEN: ${health.GREEN}`, `YELLOW: ${health.YELLOW}`, `RED: ${health.RED}`]),
    '',
    '## Renewal Watchlist',
    '',
    bullets(renewalWatch.length > 0 ? renewalWatch.map((record) => `${record.client}: ${record.health} - ${record.nextAction}`) : [insufficientData]),
    '',
    '## Expansion Watchlist',
    '',
    bullets(expansion.length > 0 ? expansion : [insufficientData]),
    '',
    '## Top 5 Actions Today',
    '',
    numbered(actions.map((action) => `${action.label} - ${action.reason}`)),
    '',
    '## Suggested Commands',
    '',
    bullets(actions.map((action) => action.command)),
    '',
    '## Human Approval Reminder',
    '',
    bullets(humanApprovalRules()),
  ]);
}

export function buildWeeklySuccessReview(input: OperatorInput): OperatorDocument {
  const opportunities = topOpportunities(input);
  const followUps = followUpSummary(input);
  const renewals = renewalClients(input);
  const expansion = expansionWatchlist(input, renewals);
  const newLeads = input.leads.filter((lead) => isWithinDays(lead.createdAt, input.today, 7));

  return doc('weekly-success-review.md', 'Weekly Success Review', [
    '# Weekly Success Review',
    '',
    `Generated At: ${input.generatedAt}`,
    '',
    '## Revenue Snapshot',
    '',
    bullets([
      `Estimated MRR: $${estimatedMrr(input.clients).toLocaleString('en-US')}`,
      `Active Clients: ${input.clients.filter((client) => client.status === 'active').length}`,
      `Renewal watchlist: ${renewals.filter((record) => record.health === 'YELLOW' || record.health === 'RED').length}`,
      `Expansion watchlist: ${expansion.length}`,
    ]),
    '',
    '## New Leads Added',
    '',
    bullets(newLeads.length > 0 ? newLeads.map((lead) => `${lead.companyName}: ${lead.createdAt}`) : [insufficientData]),
    '',
    '## Pipeline Changes',
    '',
    bullets(sectionBullets(input.opportunityTracker.content, 'Pipeline Breakdown')),
    '',
    '## New Opportunities',
    '',
    bullets(opportunities.slice(0, 5).map((opportunity) => `${opportunity.company}: ${opportunity.stage}, score ${opportunity.opportunityScore}`)),
    '',
    '## Client Activity',
    '',
    bullets(input.clients.length > 0 ? input.clients.map((client) => `${client.companyName}: ${client.currentFocus || insufficientData}`) : [insufficientData]),
    '',
    '## Renewal Activity',
    '',
    bullets(renewals.length > 0 ? renewals.map((record) => `${record.client}: ${record.health} - ${record.renewalRecommendation}`) : [insufficientData]),
    '',
    '## Risks',
    '',
    bullets([
      followUps.overdue.length > 0 ? `${followUps.overdue.length} follow-up(s) overdue.` : insufficientData,
      ...renewals.filter((record) => record.health === 'YELLOW' || record.health === 'RED').map((record) => `${record.client} needs renewal review (${record.health}).`),
    ]),
    '',
    '## Recommended Focus',
    '',
    bullets(topActions(input, opportunities.slice(0, 10), followUps, renewals, expansion).slice(0, 5).map((action) => `${action.label}: ${action.command}`)),
    '',
    '## Human Approval Reminder',
    '',
    bullets(humanApprovalRules()),
  ]);
}

export function buildMonthlySuccessReview(input: OperatorInput): OperatorDocument {
  const opportunities = topOpportunities(input);
  const renewals = renewalClients(input);
  const health = healthCounts(renewals);
  const expansion = expansionWatchlist(input, renewals);
  const monthLeads = input.leads.filter((lead) => isSameMonth(lead.createdAt, input.today));

  return doc('monthly-success-review.md', 'Monthly Success Review', [
    '# Monthly Success Review',
    '',
    `Generated At: ${input.generatedAt}`,
    '',
    '## Month Summary',
    '',
    bullets([
      `Leads created this month: ${monthLeads.length}`,
      `Clients reviewed: ${input.clients.length}`,
      `Top opportunities available: ${opportunities.length}`,
    ]),
    '',
    '## Revenue Snapshot',
    '',
    bullets([
      `Estimated MRR: $${estimatedMrr(input.clients).toLocaleString('en-US')}`,
      `Active Clients: ${input.clients.filter((client) => client.status === 'active').length}`,
      'Revenue uses local client monthlyFee values only.',
    ]),
    '',
    '## Client Health Overview',
    '',
    bullets([`GREEN: ${health.GREEN}`, `YELLOW: ${health.YELLOW}`, `RED: ${health.RED}`]),
    '',
    '## Renewal Overview',
    '',
    bullets(renewals.length > 0 ? renewals.map((record) => `${record.client}: ${record.health} - ${record.nextAction}`) : [insufficientData]),
    '',
    '## Expansion Overview',
    '',
    bullets(expansion.length > 0 ? expansion : [insufficientData]),
    '',
    '## Top Opportunities',
    '',
    bullets(opportunities.slice(0, 10).map((opportunity) => `${opportunity.company}: score ${opportunity.opportunityScore}, stage ${opportunity.stage}`)),
    '',
    '## Operational Risks',
    '',
    bullets(operationalRisks(input, renewals)),
    '',
    '## Next Month Priorities',
    '',
    bullets(nextMonthPriorities(input, opportunities, renewals, expansion)),
    '',
    '## Human Approval Reminder',
    '',
    bullets(humanApprovalRules()),
  ]);
}

function topOpportunities(input: OperatorInput): OperatorOpportunity[] {
  const parsed = parseOpportunityTable(input.opportunityTracker.content, input.leads);
  if (parsed.length > 0) {
    return parsed
      .map((opportunity) => ({ ...opportunity, dailyPriorityScore: dailyPriorityScore(opportunity, input, false) }))
      .sort((a, b) => b.dailyPriorityScore - a.dailyPriorityScore || b.opportunityScore - a.opportunityScore);
  }

  return input.leads
    .filter((lead) => lead.status !== 'paused' && lead.status !== 'lost' && lead.recommendedOffer !== 'not-fit')
    .map((lead) => {
      const opportunity: OperatorOpportunity = {
        company: lead.companyName,
        leadId: lead.id,
        opportunityScore: Math.min(100, Math.max(0, lead.score * 10)),
        stage: 'NEW_LEAD',
        offer: lead.recommendedOffer,
        nextAction: lead.nextAction || 'Review lead manually.',
        dailyPriorityScore: 0,
      };
      return { ...opportunity, dailyPriorityScore: dailyPriorityScore(opportunity, input, false) };
    })
    .sort((a, b) => b.dailyPriorityScore - a.dailyPriorityScore || b.opportunityScore - a.opportunityScore);
}

function dailyPriorityScore(opportunity: OperatorOpportunity, input: OperatorInput, hasExpansionPotential: boolean): number {
  const contact = input.contactReviews.find((review) => review.leadId === opportunity.leadId);
  let score = Math.round(opportunity.opportunityScore * 0.55);

  score += stageWeight(opportunity.stage);
  if (contact?.messageStatus === 'follow-up-needed' || contact?.nextFollowUpDate) score += 15;
  if (contact?.nextFollowUpDate && compareDates(contact.nextFollowUpDate, input.today) <= 0) score += 10;
  if (hasExpansionPotential) score += 10;

  return Math.min(100, Math.max(0, score));
}

function stageWeight(stage: OperatorOpportunity['stage']): number {
  const weights: Record<OperatorOpportunity['stage'], number> = {
    FOLLOW_UP: 25,
    SOW_READY: 22,
    CLIENT_READY: 20,
    DISCOVERY_CALL: 18,
    OUTREACH_READY: 16,
    CONTACT_REVIEW: 14,
    AUDIT_READY: 12,
    RESEARCH_READY: 10,
    NEW_LEAD: 5,
    CLIENT: 5,
    PAUSED: -20,
    LOST: -25,
    UNKNOWN: 0,
  };

  return weights[stage];
}

function followUpSummary(input: OperatorInput): FollowUpSummary {
  const withDates = input.contactReviews.filter((review) => Boolean(review.nextFollowUpDate));

  return {
    due: withDates.filter((review) => compareDates(review.nextFollowUpDate, input.today) === 0 || review.messageStatus === 'follow-up-needed'),
    overdue: withDates.filter((review) => compareDates(review.nextFollowUpDate, input.today) < 0),
    future: withDates.filter((review) => compareDates(review.nextFollowUpDate, input.today) > 0),
  };
}

function renewalClients(input: OperatorInput): RenewalClient[] {
  const rows = parseMarkdownTable(input.renewalPipeline.content, 'Renewal Tracker');
  if (rows.length > 0) {
    return rows.map((row) => {
      const clientName = row.Client ?? '';
      const client = input.clients.find((candidate) => candidate.companyName === clientName);
      return {
        client: clientName,
        clientId: client?.id ?? slug(clientName),
        status: row.Status ?? 'unknown',
        monthlyValue: row['Monthly Value'] ?? '$0',
        health: parseHealth(row.Health),
        renewalRecommendation: row['Renewal Recommendation'] ?? insufficientData,
        nextAction: row['Next Action'] ?? insufficientData,
      };
    });
  }

  return input.clients.map((client) => ({
    client: client.companyName,
    clientId: client.id,
    status: client.status,
    monthlyValue: `$${client.monthlyFee.toLocaleString('en-US')}`,
    health: client.status === 'active' ? 'YELLOW' : 'RED',
    renewalRecommendation: 'Run renewal tracker for a complete local review.',
    nextAction: `npm run renewal:review -- --id ${client.id}`,
  }));
}

function expansionWatchlist(input: OperatorInput, renewals: RenewalClient[]): string[] {
  const lines = input.expansionOpportunities.content.split(/\r?\n/);
  const results: string[] = [];
  let currentClient = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ') && trimmed !== '## Upgrade Paths') currentClient = '';
    if (trimmed.startsWith('### ')) currentClient = trimmed.replace(/^###\s+/, '');
    if (trimmed.startsWith('- ') && currentClient && !trimmed.includes(insufficientData)) {
      const renewal = renewals.find((candidate) => candidate.client === currentClient);
      results.push(`${currentClient}: ${trimmed.replace(/^-\s+/, '')}${renewal ? ` (${renewal.clientId})` : ''}`);
    }
  }

  return results;
}

function topActions(
  input: OperatorInput,
  opportunities: OperatorOpportunity[],
  followUps: FollowUpSummary,
  renewalWatch: RenewalClient[],
  expansion: string[],
): OperatorAction[] {
  const actions: OperatorAction[] = [];

  for (const review of [...followUps.overdue, ...followUps.due]) {
    actions.push({
      label: `Review ${review.companyName} follow-up`,
      command: `npm run contact:review -- --id ${review.leadId}`,
      score: 100,
      reason: review.nextFollowUpDate ? `Follow-up date ${review.nextFollowUpDate}` : 'Follow-up needed',
    });
  }

  for (const opportunity of opportunities) {
    actions.push({
      label: `${verbForStage(opportunity.stage)} for ${opportunity.company}`,
      command: commandForOpportunity(opportunity),
      score: opportunity.dailyPriorityScore,
      reason: `${opportunity.stage}, opportunity score ${opportunity.opportunityScore}`,
    });
  }

  for (const renewal of renewalWatch) {
    actions.push({
      label: `Review renewal status for ${renewal.clientId}`,
      command: `npm run renewal:review -- --id ${renewal.clientId}`,
      score: renewal.health === 'RED' ? 88 : 78,
      reason: `${renewal.health} client health`,
    });
  }

  for (const item of expansion) {
    const match = item.match(/\(([^)]+)\)$/);
    const clientId = match?.[1] ?? '';
    actions.push({
      label: clientId ? `Review expansion path for ${clientId}` : 'Review expansion path',
      command: clientId ? `npm run renewal:review -- --id ${clientId}` : 'npm run renewal:tracker',
      score: 72,
      reason: 'Expansion potential detected in local renewal report',
    });
  }

  if (actions.length === 0) {
    actions.push({
      label: 'Refresh pipeline and dashboard',
      command: 'npm run pipeline:opportunities',
      score: 50,
      reason: insufficientData,
    });
  }

  return dedupeActions(actions).sort((a, b) => b.score - a.score).slice(0, 8);
}

function commandForOpportunity(opportunity: OperatorOpportunity): string {
  if (opportunity.stage === 'FOLLOW_UP') return `npm run contact:review -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'SOW_READY') return `npm run sow:generate -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'OUTREACH_READY') return `npm run outreach:pack -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'AUDIT_READY') return `npm run audit:pack -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'RESEARCH_READY') return `npm run audit:pack -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'DISCOVERY_CALL') return `npm run client:prep -- --id ${opportunity.leadId}`;
  if (opportunity.stage === 'CLIENT_READY') return `npm run client:onboard -- --id ${opportunity.leadId}`;
  return `npm run lead:research -- --id ${opportunity.leadId}`;
}

function verbForStage(stage: OperatorOpportunity['stage']): string {
  if (stage === 'FOLLOW_UP') return 'Review follow-up';
  if (stage === 'SOW_READY') return 'Review SOW';
  if (stage === 'AUDIT_READY') return 'Review audit pack';
  if (stage === 'RESEARCH_READY') return 'Generate audit pack';
  if (stage === 'OUTREACH_READY') return 'Review outreach pack';
  if (stage === 'DISCOVERY_CALL') return 'Prepare discovery call';
  if (stage === 'CLIENT_READY') return 'Prepare onboarding';
  return 'Generate research pack';
}

function parseOpportunityTable(markdown: string, leads: Lead[]): OperatorOpportunity[] {
  return parseMarkdownTable(markdown, 'Top Opportunities').map((row) => {
    const company = row.Company ?? '';
    const lead = leads.find((candidate) => candidate.companyName === company);
    const stage = parseStage(row['Pipeline Stage'] ?? row['Current Stage']);
    return {
      company,
      leadId: lead?.id ?? slug(company),
      opportunityScore: Number(row.Score ?? row['Opportunity Score'] ?? 0),
      stage,
      offer: row.Offer ?? lead?.recommendedOffer ?? insufficientData,
      nextAction: row['Next Action'] ?? lead?.nextAction ?? insufficientData,
      dailyPriorityScore: 0,
    };
  });
}

function parseMarkdownTable(markdown: string, sectionHeading: string): Record<string, string>[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${sectionHeading}`);
  if (start === -1) return [];

  const tableLines: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (line.startsWith('|')) tableLines.push(line);
  }

  if (tableLines.length < 3) return [];
  const headers = splitTableRow(tableLines[0]);
  return tableLines.slice(2).map((line) => {
    const cells = splitTableRow(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header.replace(/:$/, '')] = cells[index] ?? '';
      return row;
    }, {});
  });
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function sectionBullets(markdown: string, heading: string): string[] {
  if (!markdown) return [insufficientData];

  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return [insufficientData];

  const items: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (line.startsWith('- ')) items.push(line.replace(/^-\s+/, ''));
  }

  return items.length > 0 ? items : [insufficientData];
}

function operationalRisks(input: OperatorInput, renewals: RenewalClient[]): string[] {
  const risks = [
    input.opportunityTracker.exists ? undefined : 'Pipeline report is missing.',
    input.renewalPipeline.exists ? undefined : 'Renewal pipeline is missing.',
    input.clientOps.exists ? undefined : 'Client operations center is missing.',
    ...renewals.filter((record) => record.health === 'YELLOW' || record.health === 'RED').map((record) => `${record.client} needs renewal review (${record.health}).`),
  ].filter((item): item is string => Boolean(item));

  return risks.length > 0 ? risks : [insufficientData];
}

function nextMonthPriorities(input: OperatorInput, opportunities: OperatorOpportunity[], renewals: RenewalClient[], expansion: string[]): string[] {
  const priorities = [
    opportunities[0] ? `Advance top opportunity: ${opportunities[0].company}.` : undefined,
    renewals.some((record) => record.health === 'YELLOW' || record.health === 'RED') ? 'Close evidence/reporting gaps for renewal watchlist clients.' : undefined,
    expansion.length > 0 ? 'Review expansion paths after reports and evidence are approved.' : undefined,
    input.contactReviews.some((review) => review.nextFollowUpDate) ? 'Review manual follow-up dates before outreach.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return priorities.length > 0 ? priorities : [insufficientData];
}

function estimatedMrr(clients: Client[]): number {
  return clients.filter((client) => client.status === 'active').reduce((sum, client) => sum + client.monthlyFee, 0);
}

function healthCounts(records: RenewalClient[]): Record<'GREEN' | 'YELLOW' | 'RED', number> {
  return {
    GREEN: records.filter((record) => record.health === 'GREEN').length,
    YELLOW: records.filter((record) => record.health === 'YELLOW').length,
    RED: records.filter((record) => record.health === 'RED').length,
  };
}

function parseStage(value: string | undefined): OperatorOpportunity['stage'] {
  const stages: OperatorOpportunity['stage'][] = [
    'NEW_LEAD',
    'RESEARCH_READY',
    'AUDIT_READY',
    'OUTREACH_READY',
    'CONTACT_REVIEW',
    'FOLLOW_UP',
    'DISCOVERY_CALL',
    'SOW_READY',
    'CLIENT_READY',
    'CLIENT',
    'PAUSED',
    'LOST',
  ];
  return stages.find((stage) => stage === value) ?? 'UNKNOWN';
}

function parseHealth(value: string | undefined): ClientHealth {
  if (value === 'GREEN' || value === 'YELLOW' || value === 'RED') return value;
  return 'UNKNOWN';
}

function compareDates(left: string, right: string): number {
  if (!left || !right) return 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function isWithinDays(dateValue: string, today: string, days: number): boolean {
  const date = Date.parse(dateValue);
  const now = Date.parse(`${today}T23:59:59.999Z`);
  if (Number.isNaN(date) || Number.isNaN(now)) return false;
  const diff = now - date;
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function isSameMonth(dateValue: string, today: string): boolean {
  const date = new Date(dateValue);
  const now = new Date(`${today}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) return false;
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function dedupeActions(actions: OperatorAction[]): OperatorAction[] {
  const seen = new Set<string>();
  const deduped: OperatorAction[] = [];

  for (const action of actions) {
    const key = `${action.label}:${action.command}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(action);
  }

  return deduped;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function humanApprovalRules(): string[] {
  return [
    'Human approval is required before outreach, follow-up, scheduling, client communication, renewal, expansion, proposal, invoice, or payment action.',
    'No APIs, scraping, browser automation, CRM, outreach automation, email, calendars, payments, credentials, external databases, or client-system access were used.',
    'Use this report as a local prioritization aid only.',
  ];
}

function doc(fileName: OperatorDocument['fileName'], title: string, lines: string[]): OperatorDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function numbered(lines: string[]): string {
  return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
