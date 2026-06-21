import fs = require('fs');
import path = require('path');
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import type { Lead } from '../leads/types';
import {
  markLifecycle,
  readLifecycle,
  readMetrics,
  writeLifecycleAndMetrics,
} from '../studioOperator/lifecycle';
import { buildDailyPlan, buildStatus, loadQaCandidates, loadWebsiteCandidates } from '../studioOperator/operator';
import { LIFECYCLE_STATUSES, type LeadType, type LifecycleStatus } from '../studioOperator/types';
import {
  buildFollowUps,
  generateClosePack,
  generateWeeklyReport,
  writeFollowUps,
  writeWeeklyReport,
} from '../studioOperator/conversion';

const command = process.argv[2];
const args = process.argv.slice(3);

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main(): Promise<void> {
  if (command === 'daily') return daily();
  if (command === 'status') return status();
  if (command === 'mark') return mark();
  if (command === 'week') return week();
  if (command === 'followups') return followups();
  if (command === 'close-pack') return closePack();
  throw new Error('Usage: studio-operator.ts <daily|status|mark|week|followups|close-pack>');
}

async function daily(): Promise<void> {
  validateFlags(new Set(['--dry-run', '--skip-discovery']));
  const dryRun = args.includes('--dry-run');
  const skipDiscovery = args.includes('--skip-discovery');
  const plan = await buildDailyPlan({ dryRun, skipDiscovery });
  console.log(`Studio daily ${dryRun ? 'dry run' : 'plan'}: ${plan.topActions.length} action(s), ${plan.estimatedReviewMinutes} minutes.`);
  for (const action of plan.topActions) {
    console.log(`${action.priority}. ${action.businessName} [${action.leadType}] — ${action.actionType}`);
  }
  console.log(`Tavily: ${plan.tavily.planUsage ?? 'unknown'}/${plan.tavily.planLimit ?? 'unknown'}; cached=${plan.tavily.cachedQueries}; eligible=${plan.tavily.eligibleQueries}.`);
  console.log(dryRun ? 'No lifecycle, metrics, packs, or reports were written.' : 'No outreach, proposals, meetings, invoices, deployments, or revenue records were created.');
}

async function status(): Promise<void> {
  validateFlags(new Set());
  const report = await buildStatus();
  console.log(`Studio status: replies=${report.repliesAwaitingAttention}, approved-unsent=${report.approvedOutreachAwaitingSend}, proposals-ready=${report.proposalsReady}.`);
  console.log(`Tavily: ${report.tavily.planUsage ?? 'unknown'}/${report.tavily.planLimit ?? 'unknown'}; Website ${report.tavily.websiteToday}/${report.tavily.dailyLimit} today, ${report.tavily.websiteMonth}/${report.tavily.monthlyLimit} month.`);
  console.log(`Next action: ${report.nextHighestValueAction?.businessName ?? 'none'} — ${report.nextHighestValueAction?.actionType ?? 'no_action'}.`);
  console.log(`Status report: ${path.relative(process.cwd(), path.join(process.cwd(), 'output', 'studio-operator', 'status', 'latest.md'))}`);
}

function mark(): void {
  validateFlags(
    new Set(['--id', '--status', '--type', '--note', '--offer', '--one-time-revenue', '--mrr']),
    new Set(['--id', '--status', '--type', '--note', '--offer', '--one-time-revenue', '--mrr']),
  );
  const leadId = requiredFlag('--id');
  const statusValue = requiredFlag('--status') as LifecycleStatus;
  if (!LIFECYCLE_STATUSES.includes(statusValue)) throw new Error(`Unsupported lifecycle status: ${statusValue}`);
  const requestedType = readFlag('--type') as LeadType | undefined;
  if (requestedType && !['qa', 'website'].includes(requestedType)) throw new Error('--type must be qa or website.');

  const matches = locateLead(leadId);
  if (matches.length === 0) throw new Error(`Lead not found: ${leadId}`);
  const filtered = requestedType ? matches.filter((match) => match.leadType === requestedType) : matches;
  if (filtered.length === 0) throw new Error(`Lead ${leadId} was not found for type ${requestedType}.`);
  if (filtered.length > 1) throw new Error(`Lead ID ${leadId} exists in both stores; provide --type <qa|website>.`);
  const lead = filtered[0];
  const entries = readLifecycle();
  if (!entries.some((entry) => entry.leadId === leadId && entry.leadType === lead.leadType)) {
    throw new Error('Lifecycle entry is not initialized. Run npm run studio:daily first.');
  }
  const result = markLifecycle({
    entries,
    metrics: readMetrics(),
    leadId,
    leadType: lead.leadType,
    status: statusValue,
    note: readFlag('--note'),
    now: new Date().toISOString(),
    source: lead.source,
    category: lead.category,
    offer: lead.offer,
    confirmedOffer: readFlag('--offer'),
    confirmedOneTimeRevenueUsd: optionalPositiveNumber('--one-time-revenue'),
    confirmedMrrUsd: optionalPositiveNumber('--mrr'),
  });
  if (result.changed) writeLifecycleAndMetrics(result.entries, result.metrics);
  console.log(`Lead: ${result.entry.businessName}`);
  console.log(`Type: ${result.entry.leadType}`);
  console.log(`Previous status: ${result.entry.previousStatus ?? result.entry.status}`);
  console.log(`New status: ${result.entry.status}`);
  console.log(`Next recommended action: ${result.entry.nextAction}`);
  console.log('No message or external action was performed.');
}

function week(): void {
  validateFlags(new Set());
  const report = generateWeeklyReport(readLifecycle(), readMetrics());
  const outputs = writeWeeklyReport(report);
  console.log(`Weekly bottleneck: ${report.primaryBottleneck.stage} — ${report.primaryBottleneck.evidence}`);
  console.log(`Confirmed MRR: USD ${report.confirmedMrrUsd}; one-time: USD ${report.confirmedOneTimeRevenueUsd}.`);
  console.log(`Weekly report: ${path.relative(process.cwd(), outputs.markdown)}`);
}

function followups(): void {
  validateFlags(new Set(['--type', '--id']), new Set(['--type', '--id']));
  const leadType = readFlag('--type') as LeadType | undefined;
  if (leadType && !['qa', 'website'].includes(leadType)) throw new Error('--type must be qa or website.');
  const items = buildFollowUps(readLifecycle(), { leadType, leadId: readFlag('--id') });
  writeFollowUps(items);
  console.log(`Follow-ups due: ${items.length}.`);
  for (const item of items) console.log(`${item.businessName}: ${item.recommendedFollowUpType} on ${item.recommendedDate}.`);
  console.log('DRAFT — NOT APPROVED — NOT SENT. No message was sent or scheduled.');
}

function closePack(): void {
  validateFlags(new Set(['--id', '--type']), new Set(['--id', '--type']));
  const id = requiredFlag('--id');
  const type = readFlag('--type') as LeadType | undefined;
  if (type && !['qa', 'website'].includes(type)) throw new Error('--type must be qa or website.');
  const matches = readLifecycle().filter((entry) => entry.leadId === id && (!type || entry.leadType === type));
  if (matches.length === 0) throw new Error(`Lifecycle lead not found: ${id}`);
  if (matches.length > 1) throw new Error(`Lead ID ${id} is ambiguous; provide --type.`);
  const result = generateClosePack(matches[0], { allowFixture: id.startsWith('fixture_') });
  console.log(`Close pack generated: ${path.relative(process.cwd(), result.outputDir)}`);
  console.log(`Offer: ${result.offer.name} (${result.offer.priceRange})`);
  console.log(`Confirmed findings reused: ${result.findings.length}`);
  console.log('No proposal was sent and no revenue was recorded.');
}

function locateLead(id: string): Array<{ leadType: LeadType; source: string; category: string; offer: string }> {
  const matches: Array<{ leadType: LeadType; source: string; category: string; offer: string }> = [];
  const qa = readJson<Lead[]>(path.join(process.cwd(), 'data', 'leads.json'), []).find((lead) => lead.id === id);
  if (qa) matches.push({ leadType: 'qa', source: qa.source, category: qa.industry, offer: qa.recommendedOffer });
  const website = readWebsiteLeads().find((lead) => lead.lead.id === id);
  if (website) matches.push({ leadType: 'website', source: website.lead.source, category: website.lead.industry, offer: website.analysis.primaryOffer.name });
  return matches;
}

function validateFlags(allowed: Set<string>, valueFlags = new Set<string>()): void {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) throw new Error(`Unexpected argument: ${argument}`);
    const flag = argument.includes('=') ? argument.split('=')[0] : argument;
    if (!allowed.has(flag)) throw new Error(`Unsupported flag: ${flag}`);
    if (valueFlags.has(flag) && !argument.includes('=')) index += 1;
  }
}

function requiredFlag(flag: string): string {
  const value = readFlag(flag);
  if (!value) throw new Error(`Missing required ${flag}.`);
  return value;
}

function readFlag(flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  return args.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

function optionalPositiveNumber(flag: string): number | undefined {
  const raw = readFlag(flag);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${flag} must be a positive number.`);
  return value;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}
