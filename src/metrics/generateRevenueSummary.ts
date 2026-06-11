import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';
import { buildRevenueSummary } from './revenueRules';
import { CurrencyRange, RevenueAction, RevenueSummary } from './types';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputPath = path.join(process.cwd(), 'output', 'metrics', 'revenue-summary.md');

function main(): void {
  const leads = readJson<Lead[]>(leadsPath, []);
  const clients = readJson<Client[]>(clientsPath, []);
  const summary = buildRevenueSummary(leads, clients);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderRevenueSummary(summary), 'utf8');

  console.log(`Revenue summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Estimated MRR from local client data: ${formatCurrency(summary.estimatedMrr)}`);
  console.log('No revenue was invented. Lead opportunity values are labeled estimates.');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderRevenueSummary(summary: RevenueSummary): string {
  return `# AI Studio OS Revenue Summary

## Snapshot

- Generated at: ${summary.generatedAt}
- Total leads: ${summary.totalLeads}
- Active clients: ${summary.activeClients.length}
- Estimated MRR from active retainer clients: ${formatCurrency(summary.estimatedMrr)}
- At-risk clients: ${summary.atRiskClients.length}

## Lead Pipeline

${renderRecord(summary.leadsByStatus)}

Top 5 scored leads:

${summary.topScoredLeads.length ? summary.topScoredLeads.map((lead, index) => `${index + 1}. ${lead.companyName} - ${lead.score}/10 - ${lead.status} - ${lead.recommendedOffer}`).join('\n') : '- No actionable leads found.'}

## Client Revenue

Clients by service type:

${renderRecord(summary.clientsByServiceType)}

Clients by status:

${renderRecord(summary.clientsByStatus)}

Active clients:

${summary.activeClients.length ? summary.activeClients.map((client) => `- ${client.companyName}: ${client.serviceType}, ${formatCurrency(client.monthlyFee)}/month recorded fee`).join('\n') : '- No active clients recorded.'}

## MRR Estimate

- Estimated MRR: ${formatCurrency(summary.estimatedMrr)}
- Source: active clients with service type qa-automation-retainer or agency-partner-retainer.
- Rule: uses monthlyFee from data/clients.json only when present.

## One-Time Opportunity Estimate

- Estimated one-time lead opportunity range: ${formatRange(summary.oneTimeOpportunityEstimate)}
- This is an estimate from current lead recommendedOffer values, not booked revenue.
- Standard ranges used: QA Audit $199-$500; Playwright Starter Pack $900-$1,500.

## Retainer Opportunity Estimate

- Estimated monthly retainer lead opportunity range: ${formatRange(summary.retainerOpportunityEstimate)}
- This is an estimate from current lead recommendedOffer values, not booked MRR.
- Standard ranges used: QA Automation Retainer $1,500-$3,000/month; Agency Partner Retainer $1,500-$3,000/month.

Retainer opportunities:

${summary.retainerOpportunities.length ? summary.retainerOpportunities.map((lead) => `- ${lead.companyName}: ${lead.score}/10, ${lead.recommendedOffer}`).join('\n') : '- No active retainer opportunities found.'}

## Top Revenue Actions

${renderActions(summary.nextBestRevenueActions)}

## Risks

- Revenue estimates are based only on local JSON data and are not booked revenue unless represented by active client monthlyFee.
- Lead opportunity ranges require manual qualification, discovery, and approval before proposals are sent.
- At-risk clients should be reviewed before assuming retention.
- No bank, invoice, payment processor, CRM, API, or external source is connected.

## Recommended Next Commands

- npm run day:plan
- npm run lead:pack -- --id lead_id
- npm run audit:site -- --url https://example.com
- npm run sow:generate -- --id lead_id
- npm run client:report -- --id client_id

## Manual Review Note

- Review this summary before using it for business decisions.
- Do not treat lead opportunity ranges as booked revenue.
- Do not send outreach, proposals, or client updates without Daniel approval.
- Use only local data unless additional research is explicitly approved.
`;
}

function renderRecord<T extends string>(record: Record<T, number>): string {
  return Object.entries(record)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
}

function renderActions(actions: RevenueAction[]): string {
  if (actions.length === 0) return '- No revenue actions generated.';

  return actions
    .map((action) => `${action.priority}. ${action.title}\n   - Reason: ${action.reason}\n   - Suggested command: ${action.suggestedCommand}`)
    .join('\n');
}

function formatRange(range: CurrencyRange): string {
  const suffix = range.cadence === 'monthly' ? '/month' : '';
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}${suffix}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

main();
