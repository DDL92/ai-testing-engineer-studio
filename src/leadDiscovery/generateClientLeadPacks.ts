import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { LeadRecord, LeadScoreBreakdown, LeadSourceType, LeadVertical } from './types';

interface RoutedLead {
  id: string;
  vertical: LeadVertical;
  nameOrHandle: string;
  sourceUrl: string;
  sourceType: LeadSourceType;
  location: string;
  intentSummary: string;
  requestedService: string;
  dateSignal: string | null;
  budgetSignal: string | null;
  urgency: 'low' | 'medium' | 'high';
  score: number;
  scoreBreakdown: LeadScoreBreakdown;
  salesAngle: string;
  suggestedFirstMessage: string;
  riskFlags: string[];
  status: LeadRecord['status'] | 'needs_review';
  createdAt: string;
  updatedAt: string;
  sourceName?: string;
  contactHint?: string | null;
}

interface ClientRoutingResult {
  client: LeadDiscoveryClientConfig;
  leads: RoutedLead[];
  outputPaths: string[];
}

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const normalizedPath = path.join(process.cwd(), 'output', 'lead-discovery', 'normalized-leads.json');
const samplePath = path.join(process.cwd(), 'data', 'lead-discovery', 'sample-leads.json');
const outputRoot = path.join(process.cwd(), 'output', 'lead-discovery', 'clients');
const routingSummaryPath = path.join(outputRoot, 'client-routing-summary.md');

export interface ClientLeadPackResult {
  generatedAt: string;
  totalClients: number;
  activeClients: number;
  results: ClientRoutingResult[];
  zeroMatchClients: string[];
  filesGenerated: string[];
}

export function generateClientLeadPacks(now = new Date()): ClientLeadPackResult {
  const generatedAt = now.toISOString();
  const clients = readClients();
  const activeClients = clients.filter((client) => client.status === 'active');
  const leads = readLeads();
  const results = activeClients.map((client) => routeClient(client, leads, generatedAt));
  const zeroMatchClients = results.filter((result) => result.leads.length === 0).map((result) => result.client.clientId);

  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(routingSummaryPath, renderRoutingSummary(clients, activeClients, results, zeroMatchClients, generatedAt), 'utf8');

  return {
    generatedAt,
    totalClients: clients.length,
    activeClients: activeClients.length,
    results,
    zeroMatchClients,
    filesGenerated: [
      path.relative(process.cwd(), routingSummaryPath),
      ...results.flatMap((result) => result.outputPaths),
    ],
  };
}

function readClients(): LeadDiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as LeadDiscoveryClientConfig)
    .sort((left, right) => left.clientId.localeCompare(right.clientId));
}

function readLeads(): RoutedLead[] {
  if (fs.existsSync(normalizedPath)) {
    return JSON.parse(fs.readFileSync(normalizedPath, 'utf8')) as RoutedLead[];
  }
  return (JSON.parse(fs.readFileSync(samplePath, 'utf8')) as LeadRecord[]).map((lead) => ({
    ...lead,
    status: lead.status === 'needs_human_review' ? 'needs_review' : lead.status,
  }));
}

function routeClient(client: LeadDiscoveryClientConfig, leads: RoutedLead[], generatedAt: string): ClientRoutingResult {
  const matched = leads
    .filter((lead) => lead.vertical === client.vertical)
    .filter((lead) => lead.score >= client.minScore)
    .filter((lead) => lead.status === 'needs_review' || lead.status === 'qualified')
    .filter((lead) => matchesLocation(client, lead))
    .filter((lead) => matchesPreferredTypes(client, lead))
    .filter((lead) => !matchesExcludedTypes(client, lead))
    .sort((left, right) => right.score - left.score || left.nameOrHandle.localeCompare(right.nameOrHandle))
    .slice(0, client.leadGoalPerDay);

  const clientDir = path.join(outputRoot, client.clientId);
  const paths = {
    summary: path.join(clientDir, 'lead-pack-summary.md'),
    csv: path.join(clientDir, 'qualified-leads.csv'),
    delivery: path.join(clientDir, 'delivery-ready-pack.md'),
    review: path.join(clientDir, 'review-needed.md'),
  };

  fs.mkdirSync(clientDir, { recursive: true });
  fs.writeFileSync(paths.summary, renderClientSummary(client, matched, generatedAt), 'utf8');
  fs.writeFileSync(paths.csv, renderClientCsv(matched), 'utf8');
  fs.writeFileSync(paths.delivery, renderDeliveryPack(client, matched, generatedAt), 'utf8');
  fs.writeFileSync(paths.review, renderReviewNeeded(client, matched, generatedAt), 'utf8');

  return {
    client,
    leads: matched,
    outputPaths: Object.values(paths).map((filePath) => path.relative(process.cwd(), filePath)),
  };
}

function matchesLocation(client: LeadDiscoveryClientConfig, lead: RoutedLead): boolean {
  if (client.targetLocations.length === 0) return true;
  const haystack = normalize(`${lead.location} ${lead.intentSummary}`);
  return client.targetLocations.some((location) => {
    const target = normalize(location);
    if (target === 'united states' || target === 'usa travelers') return /\b(us|usa|united states|tx|ca|nc|fl|or)\b/.test(haystack);
    return haystack.includes(target) || target.split(/\s+/).some((part) => part.length > 3 && haystack.includes(part));
  });
}

function matchesPreferredTypes(client: LeadDiscoveryClientConfig, lead: RoutedLead): boolean {
  if (client.preferredLeadTypes.length === 0) return true;
  const haystack = normalize(`${lead.intentSummary} ${lead.requestedService} ${lead.salesAngle} ${lead.budgetSignal ?? ''}`);
  return client.preferredLeadTypes.some((type) => {
    const target = normalize(type);
    if (target === 'tailored travel') return /\b(custom|tailored|itinerary|private transfer)\b/.test(haystack);
    if (target === 'luxury travel') return /\b(luxury|premium|boutique|private)\b/.test(haystack);
    if (target === 'wellness retreat') return /\b(wellness|retreat|yoga)\b/.test(haystack);
    if (target === 'private events') return /\b(private|anniversary|event|plated)\b/.test(haystack);
    if (target === 'corporate catering') return /\b(corporate|product launch|team|office|lunch)\b/.test(haystack);
    return target.split(/\s+/).every((part) => haystack.includes(part));
  });
}

function matchesExcludedTypes(client: LeadDiscoveryClientConfig, lead: RoutedLead): boolean {
  if (client.excludedLeadTypes.length === 0) return false;
  const haystack = normalize(`${lead.intentSummary} ${lead.requestedService} ${lead.salesAngle}`);
  return client.excludedLeadTypes.some((type) => haystack.includes(normalize(type)));
}

function renderClientSummary(client: LeadDiscoveryClientConfig, leads: RoutedLead[], generatedAt: string): string {
  return `# Client Lead Pack Summary — ${client.clientName}

Generated: ${generatedAt}

- Client ID: ${client.clientId}
- Vertical: ${client.vertical}
- Matched leads: ${leads.length}
- Minimum score: ${client.minScore}
- Lead goal per day: ${client.leadGoalPerDay}
- Manual review required before client delivery or contact.
- No scraping, network calls, outreach, email, DM, or form submission was performed.

${renderSummaryTable(leads)}
`;
}

function renderSummaryTable(leads: RoutedLead[]): string {
  const rows = leads.map((lead) => (
    `| ${cell(lead.nameOrHandle)} | ${cell(lead.location)} | ${cell(lead.intentSummary)} | ${cell(lead.budgetSignal ?? 'Not supplied')} | ${cell(lead.dateSignal ?? 'Not supplied')} | ${cell(lead.requestedService)} | ${cell(contactValue(lead))} | ${cell(sourceValue(lead))} | ${lead.score.toFixed(1)} | ${cell(scoreReason(lead))} | ${cell(lead.salesAngle)} | ${cell(lead.suggestedFirstMessage)} |`
  ));
  return `| Name / handle | Country / location | Interest | Estimated budget | Approximate dates | Service type | Email / profile / contact | Source | Score | Score reason | Sales angle | Suggested message |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
${rows.join('\n') || '| No matched leads | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | Not applicable | 0 | Not applicable | Not applicable | Not applicable |'}`;
}

function renderClientCsv(leads: RoutedLead[]): string {
  const headers = ['Name / handle', 'Country / location', 'Interest', 'Estimated budget', 'Approximate dates', 'Service type', 'Email / profile / contact', 'Source', 'Score', 'Score reason', 'Sales angle', 'Suggested message'];
  const rows = leads.map((lead) => [
    lead.nameOrHandle,
    lead.location,
    lead.intentSummary,
    lead.budgetSignal ?? 'Not supplied',
    lead.dateSignal ?? 'Not supplied',
    lead.requestedService,
    contactValue(lead),
    sourceValue(lead),
    lead.score.toFixed(1),
    scoreReason(lead),
    lead.salesAngle,
    lead.suggestedFirstMessage,
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderDeliveryPack(client: LeadDiscoveryClientConfig, leads: RoutedLead[], generatedAt: string): string {
  return `# Delivery Ready Pack — ${client.clientName}

Generated: ${generatedAt}

Manual review required before client delivery.

This is a local preparation artifact only. Sales teams must review and contact leads manually through approved processes.

${leads.map((lead, index) => renderLeadBlock(lead, index + 1)).join('\n\n') || '- No matched leads.'}
`;
}

function renderReviewNeeded(client: LeadDiscoveryClientConfig, leads: RoutedLead[], generatedAt: string): string {
  return `# Review Needed — ${client.clientName}

Generated: ${generatedAt}

${leads.map((lead, index) => `## ${index + 1}. ${lead.nameOrHandle}

- ID: ${lead.id}
- Risk flags: ${lead.riskFlags.join(', ') || 'None'}
- Missing fields: ${missingFields(lead).join(', ') || 'None'}
- Required action: Human must verify source context, fit, contact path, and delivery readiness.`).join('\n\n') || '- No matched leads.'}

No outreach, email, DM, or form submission was performed.
`;
}

function renderRoutingSummary(
  clients: LeadDiscoveryClientConfig[],
  activeClients: LeadDiscoveryClientConfig[],
  results: ClientRoutingResult[],
  zeroMatchClients: string[],
  generatedAt: string,
): string {
  return `# Client Lead Routing Summary

Generated: ${generatedAt}

- Total clients: ${clients.length}
- Active clients: ${activeClients.length}
- Clients with zero matched leads: ${zeroMatchClients.join(', ') || 'none'}
- Manual review required before client delivery or contact.
- No scraping, network calls, paid APIs, outreach, email, DM, or form submission was performed.

## Leads Routed Per Client

${results.map((result) => `- ${result.client.clientId} (${result.client.clientName}): ${result.leads.length}`).join('\n') || '- None.'}

## Generated Output Paths

${results.flatMap((result) => result.outputPaths).map((outputPath) => `- ${outputPath}`).join('\n') || '- None.'}
`;
}

function renderLeadBlock(lead: RoutedLead, rank: number): string {
  return `## ${rank}. ${lead.nameOrHandle}

- Vertical: ${lead.vertical}
- Location: ${lead.location}
- Interest: ${lead.intentSummary}
- Estimated budget: ${lead.budgetSignal ?? 'Not supplied'}
- Approximate dates: ${lead.dateSignal ?? 'Not supplied'}
- Service type: ${lead.requestedService}
- Contact: ${contactValue(lead)}
- Source: ${sourceValue(lead)}
- Score: ${lead.score.toFixed(1)}
- Score reason: ${scoreReason(lead)}
- Sales angle: ${lead.salesAngle}
- Suggested message: ${lead.suggestedFirstMessage}
- Risk flags: ${lead.riskFlags.join(', ') || 'None'}`;
}

function missingFields(lead: RoutedLead): string[] {
  const fields: string[] = [];
  if (!lead.location || lead.location === 'Unknown') fields.push('location');
  if (!lead.dateSignal) fields.push('approximate dates');
  if (!lead.budgetSignal) fields.push('estimated budget');
  if (!contactValue(lead) || contactValue(lead) === 'Not supplied') fields.push('contact');
  if (!lead.sourceUrl) fields.push('source');
  return fields;
}

function scoreReason(lead: RoutedLead): string {
  return Object.entries(lead.scoreBreakdown)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key.replace(/[A-Z]/g, (match) => ` ${match.toLowerCase()}`))
    .join('; ') || 'No score reason recorded';
}

function contactValue(lead: RoutedLead): string {
  return lead.contactHint ?? 'Not supplied';
}

function sourceValue(lead: RoutedLead): string {
  return `${lead.sourceName ?? lead.sourceType}: ${lead.sourceUrl}`;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const result = generateClientLeadPacks();
  console.log(`Client lead packs generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Clients: ${result.totalClients}; active: ${result.activeClients}; zero-match: ${result.zeroMatchClients.length}`);
  console.log('Local files only. No scraping, network calls, outreach, email, DM, or form submission was performed.');
}

if (require.main === module) main();
