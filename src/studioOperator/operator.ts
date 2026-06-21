import fs = require('fs');
import path = require('path');
import { execFileSync } from 'child_process';
import type { Lead } from '../leads/types';
import { getTavilyUsage, loadLocalEnv } from '../integrations/tavily/tavilyClient';
import { readTavilyLedger, websiteUsageFromLedger } from '../integrations/tavily/tavilyUsage';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import { buildWebsiteRanking, isFixtureWebsiteLead } from '../websiteStudio/rankingWorkflow';
import type { DemoCheck, SiteAudit } from '../websiteStudio/demoTypes';
import type { SalesPackJson } from '../websiteStudio/salesTypes';
import {
  metricCounts,
  readLifecycle,
  readMetrics,
  upsertAutomatic,
  writeLifecycleAndMetrics,
} from './lifecycle';
import type {
  CommercialFinding,
  LeadType,
  LifecycleEntry,
  LifecycleStatus,
  StudioAction,
  StudioCandidate,
  StudioMetrics,
  TavilySnapshot,
} from './types';

export const MAX_NEW_QA_CANDIDATES = 5;
export const MAX_NEW_WEBSITE_CANDIDATES = 5;
export const MAX_DEEP_QA_AUDIT = 1;
export const MAX_WEBSITE_AUDIT_DEMO = 1;
export const MAX_QA_OUTREACH_APPROVAL = 1;
export const MAX_WEBSITE_OUTREACH_APPROVAL = 1;
export const MAX_FOLLOW_UP_ACTIONS = 2;
export const MAX_TOTAL_DAILY_REVENUE_ACTIONS = 5;

const DAILY_DIR = path.join(process.cwd(), 'output', 'studio-operator', 'daily');
const STATUS_DIR = path.join(process.cwd(), 'output', 'studio-operator', 'status');

export async function buildDailyPlan(options: {
  dryRun: boolean;
  skipDiscovery: boolean;
}): Promise<{
  generatedAt: string;
  dryRun: boolean;
  skipDiscovery: boolean;
  tavily: TavilySnapshot;
  qaCandidates: StudioCandidate[];
  websiteCandidates: StudioCandidate[];
  lifecycle: LifecycleEntry[];
  topActions: StudioAction[];
  blockers: string[];
  dirtyWorktree: boolean;
  estimatedReviewMinutes: number;
}> {
  const generatedAt = new Date().toISOString();
  const tavily = await tavilySnapshot();
  const qaCandidates = loadQaCandidates().slice(0, MAX_NEW_QA_CANDIDATES);
  const websiteCandidates = loadWebsiteCandidates().slice(0, MAX_NEW_WEBSITE_CANDIDATES);
  let lifecycle = readLifecycle();
  for (const candidate of [...qaCandidates, ...websiteCandidates]) {
    lifecycle = upsertAutomatic(lifecycle, {
      leadId: candidate.leadId,
      leadType: candidate.leadType,
      businessName: candidate.businessName,
      status: candidate.suggestedStatus,
      nextAction: defaultNextAction(candidate.suggestedStatus),
      sourceRecordPath: candidate.sourceRecordPath,
      packPath: candidate.packPath,
    }, generatedAt);
  }
  const actions = selectActions(lifecycle, [...qaCandidates, ...websiteCandidates]);
  const dirtyWorktree = detectDirtyWorktree();
  const blockers = [
    ...(tavily.warning ? [tavily.warning] : []),
    ...(dirtyWorktree ? ['Working tree is dirty; planning continued without staging, committing, or resetting files.'] : []),
    ...(!options.skipDiscovery && tavily.eligibleQueries === 0 ? ['Website Tavily queries are cached or otherwise ineligible; use stored data.'] : []),
  ];
  const plan = {
    generatedAt,
    dryRun: options.dryRun,
    skipDiscovery: options.skipDiscovery,
    tavily,
    qaCandidates,
    websiteCandidates,
    lifecycle,
    topActions: actions,
    blockers,
    dirtyWorktree,
    estimatedReviewMinutes: actions.reduce((total, action) => total + action.estimatedMinutes, 0),
  };
  if (!options.dryRun) {
    writeLifecycleAndMetrics(lifecycle, readMetrics());
    writeDailyOutputs(plan);
  }
  return plan;
}

export async function buildStatus(): Promise<{
  generatedAt: string;
  counts: Record<LeadType, Record<LifecycleStatus, number>>;
  repliesAwaitingAttention: number;
  approvedOutreachAwaitingSend: number;
  contactedAwaitingFollowUp: number;
  proposalsReady: number;
  proposalsSent: number;
  won: number;
  lost: number;
  archived: number;
  packsReady: number;
  tavily: TavilySnapshot;
  metrics: ReturnType<typeof metricCounts>;
  dirtyWorktree: boolean;
  blockers: string[];
  nextHighestValueAction: StudioAction | null;
}> {
  const tavily = await tavilySnapshot();
  const plan = await buildDailyPlan({ dryRun: true, skipDiscovery: true });
  const lifecycle = plan.lifecycle.filter((entry) => !isLifecycleFixture(entry));
  const counts = lifecycleCounts(lifecycle);
  const dirtyWorktree = detectDirtyWorktree();
  const status = {
    generatedAt: new Date().toISOString(),
    counts,
    repliesAwaitingAttention: countStatus(lifecycle, 'replied'),
    approvedOutreachAwaitingSend: countStatus(lifecycle, 'approved_for_outreach'),
    contactedAwaitingFollowUp: countStatus(lifecycle, 'contacted'),
    proposalsReady: countStatus(lifecycle, 'proposal_ready'),
    proposalsSent: countStatus(lifecycle, 'proposal_sent'),
    won: countStatus(lifecycle, 'won'),
    lost: countStatus(lifecycle, 'lost'),
    archived: countStatus(lifecycle, 'archived'),
    packsReady: countStatus(lifecycle, 'pack_ready'),
    tavily,
    metrics: metricCounts(readMetrics()),
    dirtyWorktree,
    blockers: [
      ...(tavily.warning ? [tavily.warning] : []),
      ...(dirtyWorktree ? ['Working tree is dirty. No files were staged, committed, reset, or discarded.'] : []),
    ],
    nextHighestValueAction: plan.topActions[0] ?? null,
  };
  writeStatusOutputs(status);
  return status;
}

export function loadQaCandidates(): StudioCandidate[] {
  const leads = readJson<Lead[]>(path.join(process.cwd(), 'data', 'leads.json'), []);
  return leads
    .filter((lead) => !isQaFixture(lead))
    .filter((lead) => !['won', 'lost', 'paused'].includes(lead.status))
    .sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName))
    .map((lead) => {
      const packPath = qaPackPath(lead.id);
      const findings = qaFindings(lead);
      return {
        leadId: lead.id,
        leadType: 'qa' as const,
        businessName: lead.companyName,
        source: lead.source,
        category: lead.industry,
        offer: lead.recommendedOffer,
        score: lead.score,
        fixture: false,
        suggestedStatus: packPath ? 'pack_ready' : lead.score >= 6 ? 'qualified' : 'needs_verification',
        sourceRecordPath: 'data/leads.json',
        packPath,
        proposalPath: null,
        findings,
        verificationCommand: `npm run lead:review -- --id ${lead.id}`,
        packCommand: packPath ? null : `npm run lead:pack -- --id ${lead.id}`,
      };
    });
}

export function loadWebsiteCandidates(): StudioCandidate[] {
  const leads = readWebsiteLeads();
  const ranking = buildWebsiteRanking(leads);
  const candidates: StudioCandidate[] = [];
  for (const ranked of ranking) {
    const record = leads.find((lead) => lead.lead.id === ranked.leadId);
    if (!record || isFixtureWebsiteLead(record)) continue;
    const leadPack = relativeIfExists(`output/website-studio/leads/${record.lead.id}/lead-pack.md`);
    const salesPackPath = `output/website-studio/sales/${record.lead.id}/sales-pack.json`;
    const salesPack = readJson<SalesPackJson | null>(path.join(process.cwd(), salesPackPath), null);
    const proposalPath = salesPack && fs.existsSync(path.join(process.cwd(), 'output', 'website-studio', 'sales', record.lead.id, salesPack.proposalPath))
      ? `output/website-studio/sales/${record.lead.id}/${salesPack.proposalPath}`
      : null;
    const findings = websiteFindings(record.lead.id);
    const suggestedStatus: LifecycleStatus = proposalPath
      ? 'proposal_ready'
      : leadPack ? 'pack_ready'
        : ranked.decision === 'PRIORITY' || ranked.decision === 'QUALIFIED' ? 'qualified'
          : 'needs_verification';
    candidates.push({
      leadId: record.lead.id,
      leadType: 'website',
      businessName: record.lead.companyName,
      source: record.lead.source,
      category: record.lead.industry,
      offer: record.analysis.primaryOffer.name,
      score: record.analysis.score,
      fixture: false,
      suggestedStatus,
      sourceRecordPath: 'data/website-studio/leads.json',
      packPath: leadPack,
      proposalPath,
      findings,
      verificationCommand: null,
      packCommand: leadPack ? null : `npm run website:lead:pack -- --id ${record.lead.id}`,
    });
  }
  return candidates;
}

function selectActions(lifecycle: LifecycleEntry[], candidates: StudioCandidate[]): StudioAction[] {
  const active = lifecycle.filter((entry) => !['won', 'lost', 'archived'].includes(entry.status));
  const byPriority: StudioAction[] = [];
  for (const entry of active) {
    const candidate = candidates.find((item) => item.leadId === entry.leadId && item.leadType === entry.leadType);
    if (!candidate) continue;
    const action = actionFor(entry, candidate);
    if (action) byPriority.push(action);
  }
  byPriority.sort((a, b) => a.priority - b.priority || b.estimatedMinutes - a.estimatedMinutes || a.businessName.localeCompare(b.businessName));
  const selected: StudioAction[] = [];
  let qaApprovals = 0;
  let websiteApprovals = 0;
  let followUps = 0;
  let qaAudits = 0;
  let websiteAudits = 0;
  for (const action of byPriority) {
    if (selected.length >= MAX_TOTAL_DAILY_REVENUE_ACTIONS) break;
    if (action.actionType === 'review_outreach_draft') {
      if (action.leadType === 'qa' && qaApprovals >= MAX_QA_OUTREACH_APPROVAL) continue;
      if (action.leadType === 'website' && websiteApprovals >= MAX_WEBSITE_OUTREACH_APPROVAL) continue;
      action.leadType === 'qa' ? qaApprovals += 1 : websiteApprovals += 1;
    }
    if (action.actionType === 'follow_up_manually' && ++followUps > MAX_FOLLOW_UP_ACTIONS) continue;
    if (action.actionType === 'review_audit') {
      if (action.leadType === 'qa' && ++qaAudits > MAX_DEEP_QA_AUDIT) continue;
      if (action.leadType === 'website' && ++websiteAudits > MAX_WEBSITE_AUDIT_DEMO) continue;
    }
    selected.push({ ...action, priority: selected.length + 1 });
  }
  return selected;
}

function actionFor(entry: LifecycleEntry, candidate: StudioCandidate): StudioAction | null {
  const confirmed = candidate.findings.filter((finding) => finding.confidence === 'confirmed' && finding.commerciallyUsable);
  const common = {
    leadId: entry.leadId,
    leadType: entry.leadType,
    businessName: entry.businessName,
    currentStatus: entry.status,
  };
  if (entry.status === 'replied') return action(1, common, 'review_reply', 'A reply requires operator attention.', entry.packPath, null, 10, true);
  if (entry.status === 'call_scheduled') return action(2, common, 'prepare_call', 'A scheduled call outranks new discovery.', entry.packPath, null, 15, true);
  if (entry.status === 'proposal_ready') return action(3, common, 'review_proposal', 'An existing proposal requires manual review.', candidate.proposalPath, null, 10, true);
  if (entry.status === 'proposal_sent' || entry.status === 'contacted') return action(4, common, 'follow_up_manually', 'The lead is awaiting a manual follow-up decision.', entry.packPath, null, 5, true);
  if (entry.status === 'approved_for_outreach') return action(4, common, 'send_approved_outreach_manually', 'Outreach is approved but must be sent manually.', entry.packPath, null, 5, true);
  if (entry.status === 'pack_ready' && confirmed.length > 0) return action(5, common, 'review_outreach_draft', confirmed[0].description, entry.packPath, null, 10, true);
  if (entry.status === 'pack_ready') return action(6, common, 'verify_lead', 'A pack exists, but no confirmed commercially usable finding gates outreach.', entry.packPath, candidate.verificationCommand, 5, true);
  if (entry.status === 'qualified' && candidate.packCommand) return action(7, common, 'generate_pack', 'Qualified lead has no current pack.', null, candidate.packCommand, 10, true);
  if (entry.status === 'qualified' && candidate.leadType === 'website') return action(7, common, 'review_audit', 'Review one high-value Website audit/demo opportunity.', candidate.packPath, `npm run website:demo -- --id ${candidate.leadId}`, 15, true);
  if (entry.status === 'needs_verification' || entry.status === 'discovered') return action(6, common, 'verify_lead', 'Lead evidence requires verification.', entry.sourceRecordPath, candidate.verificationCommand, 5, true);
  return null;
}

function websiteFindings(leadId: string): CommercialFinding[] {
  const auditPath = path.join(process.cwd(), 'output', 'website-studio', 'demos', leadId, 'audit.json');
  const audit = readJson<SiteAudit | null>(auditPath, null);
  if (!audit || audit.reachable !== true || audit.auditErrors.length > 0) return [];
  const observedAt = audit.completedAt;
  return Object.entries(audit.checks)
    .filter(([, check]) => check.status === 'FAIL')
    .map(([name, check]) => findingFromCheck(name, check, auditPath, observedAt));
}

function findingFromCheck(name: string, check: DemoCheck, source: string, observedAt: string): CommercialFinding {
  return {
    description: check.detail,
    source: path.relative(process.cwd(), source),
    observedAt,
    severity: /broken|overflow|failed/i.test(`${name} ${check.detail}`) ? 'medium' : 'low',
    confidence: 'confirmed',
    commerciallyUsable: true,
  };
}

function qaFindings(lead: Lead): CommercialFinding[] {
  const auditPath = path.join(process.cwd(), 'output', 'top-lead-audit', 'top-lead-evidence.md');
  if (!fs.existsSync(auditPath) || !fs.readFileSync(auditPath, 'utf8').includes(lead.companyName)) return [];
  return [{
    description: 'Existing QA evidence pack requires manual review before use.',
    source: path.relative(process.cwd(), auditPath),
    observedAt: fs.statSync(auditPath).mtime.toISOString(),
    severity: 'medium',
    confidence: 'confirmed',
    commerciallyUsable: true,
  }];
}

async function tavilySnapshot(): Promise<TavilySnapshot> {
  loadLocalEnv();
  const ledgerUsage = websiteUsageFromLedger(readTavilyLedger());
  const cache = readJson<Array<{ lastRunAt?: string }>>(path.join(process.cwd(), 'data', 'website-studio', 'tavily-cache.json'), []);
  const config = readJson<{ queries?: Array<{ enabled?: boolean }> }>(path.join(process.cwd(), 'data', 'website-studio', 'tavily-discovery.json'), {});
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cachedQueries = cache.filter((entry) => entry.lastRunAt && new Date(entry.lastRunAt).getTime() >= cutoff).length;
  const configured = config.queries?.filter((query) => query.enabled).length ?? 0;
  try {
    const usage = await getTavilyUsage();
    return {
      usageAvailable: usage.available,
      planUsage: usage.planUsage,
      planLimit: usage.planLimit,
      websiteToday: ledgerUsage.today,
      websiteMonth: ledgerUsage.month,
      dailyLimit: 3,
      monthlyLimit: 100,
      sharedThresholdPercent: 80,
      cachedQueries,
      eligibleQueries: Math.max(0, configured - cachedQueries),
      warning: null,
    };
  } catch (error) {
    return {
      usageAvailable: false,
      planUsage: null,
      planLimit: null,
      websiteToday: ledgerUsage.today,
      websiteMonth: ledgerUsage.month,
      dailyLimit: 3,
      monthlyLimit: 100,
      sharedThresholdPercent: 80,
      cachedQueries,
      eligibleQueries: 0,
      warning: `Tavily usage unavailable; no credits should be spent: ${errorMessage(error)}`,
    };
  }
}

function writeDailyOutputs(plan: Awaited<ReturnType<typeof buildDailyPlan>>): void {
  fs.mkdirSync(path.join(DAILY_DIR, 'history'), { recursive: true });
  writeJson(path.join(DAILY_DIR, 'latest.json'), plan);
  fs.writeFileSync(path.join(DAILY_DIR, 'latest.md'), renderDaily(plan), 'utf8');
  const stamp = plan.generatedAt.replace(/[:.]/g, '-');
  writeJson(path.join(DAILY_DIR, 'history', `${stamp}.json`), plan);
  fs.writeFileSync(path.join(DAILY_DIR, 'history', `${stamp}.md`), renderDaily(plan), 'utf8');
  pruneHistory();
}

function writeStatusOutputs(status: Awaited<ReturnType<typeof buildStatus>>): void {
  fs.mkdirSync(STATUS_DIR, { recursive: true });
  writeJson(path.join(STATUS_DIR, 'latest.json'), status);
  fs.writeFileSync(path.join(STATUS_DIR, 'latest.md'), renderStatus(status), 'utf8');
}

function renderDaily(plan: Awaited<ReturnType<typeof buildDailyPlan>>): string {
  const actions = (type?: LeadType) => plan.topActions.filter((item) => !type || item.leadType === type);
  return `# Studio Daily Revenue Plan

## System status

- QA candidates reviewed: ${plan.qaCandidates.length}
- Website candidates reviewed: ${plan.websiteCandidates.length}
- Dirty worktree: ${plan.dirtyWorktree ? 'yes' : 'no'}

## Tavily and cost controls

- Shared usage: ${plan.tavily.planUsage ?? 'unknown'}/${plan.tavily.planLimit ?? 'unknown'}
- Website usage today: ${plan.tavily.websiteToday}/${plan.tavily.dailyLimit}
- Website usage this month: ${plan.tavily.websiteMonth}/${plan.tavily.monthlyLimit}
- Cached queries: ${plan.tavily.cachedQueries}
- Eligible queries: ${plan.tavily.eligibleQueries}

## Replies and follow-ups

${bullets(plan.topActions.filter((item) => ['review_reply', 'follow_up_manually', 'prepare_call'].includes(item.actionType)).map(formatAction))}

## QA actions

${bullets(actions('qa').map(formatAction))}

## Website actions

${bullets(actions('website').map(formatAction))}

## Today’s top five actions

${bullets(plan.topActions.map(formatAction))}

## Manual approvals required

${bullets(plan.topActions.filter((item) => item.manualApprovalRequired).map((item) => `${item.businessName}: ${item.actionType}`))}

## Blockers

${bullets(plan.blockers)}

## Do not run today

- Automated outreach, Gmail drafts, DMs, form submissions, proposal sending, invoicing, deployment, or revenue recording.
- Tavily Search when usage is unavailable or all queries remain cached.
- Fixture leads in production actions.

## Estimated review time

${plan.estimatedReviewMinutes} minutes.

No outreach was sent. No proposal was sent. No revenue was recorded. All external actions require manual approval.
`;
}

function renderStatus(status: Awaited<ReturnType<typeof buildStatus>>): string {
  return `# Studio Operator Status

- QA lifecycle: ${formatCounts(status.counts.qa)}
- Website lifecycle: ${formatCounts(status.counts.website)}
- Replies awaiting attention: ${status.repliesAwaitingAttention}
- Approved outreach awaiting manual send: ${status.approvedOutreachAwaitingSend}
- Contacted leads awaiting follow-up: ${status.contactedAwaitingFollowUp}
- Proposals ready: ${status.proposalsReady}
- Proposals sent: ${status.proposalsSent}
- Won: ${status.won}
- Lost: ${status.lost}
- Archived: ${status.archived}
- Packs ready: ${status.packsReady}
- Tavily shared usage: ${status.tavily.planUsage ?? 'unknown'}/${status.tavily.planLimit ?? 'unknown'}
- Website Tavily usage: ${status.tavily.websiteToday}/${status.tavily.dailyLimit} today; ${status.tavily.websiteMonth}/${status.tavily.monthlyLimit} this month
- Cached queries: ${status.tavily.cachedQueries}; eligible: ${status.tavily.eligibleQueries}
- Dirty worktree: ${status.dirtyWorktree ? 'yes' : 'no'}
- Next highest-value action: ${status.nextHighestValueAction ? formatAction(status.nextHighestValueAction) : 'No action.'}

## Blockers

${bullets(status.blockers)}
`;
}

function lifecycleCounts(entries: LifecycleEntry[]): Record<LeadType, Record<LifecycleStatus, number>> {
  const statuses: LifecycleStatus[] = ['discovered', 'needs_verification', 'qualified', 'pack_ready', 'approved_for_outreach', 'contacted', 'replied', 'call_scheduled', 'proposal_ready', 'proposal_sent', 'won', 'lost', 'archived'];
  const make = () => Object.fromEntries(statuses.map((status) => [status, 0])) as Record<LifecycleStatus, number>;
  const counts = { qa: make(), website: make() };
  for (const entry of entries) counts[entry.leadType][entry.status] += 1;
  return counts;
}

function countStatus(entries: LifecycleEntry[], status: LifecycleStatus): number {
  return entries.filter((entry) => entry.status === status).length;
}

function action(
  priority: number,
  common: Pick<StudioAction, 'leadId' | 'leadType' | 'businessName' | 'currentStatus'>,
  actionType: StudioAction['actionType'],
  reason: string,
  evidencePath: string | null,
  exactExistingCommand: string | null,
  estimatedMinutes: number,
  manualApprovalRequired: boolean,
): StudioAction {
  return { priority, ...common, actionType, reason, evidencePath, exactExistingCommand, estimatedMinutes, manualApprovalRequired };
}

function isQaFixture(lead: Lead): boolean {
  return lead.id.startsWith('example_') || lead.id.startsWith('sample-') || /demo|sample|fictional/i.test(`${lead.companyName} ${lead.source} ${lead.fitNotes}`)
    || /\.example(?:\/|$)/i.test(lead.website);
}

function isLifecycleFixture(entry: LifecycleEntry): boolean {
  return entry.leadId.startsWith('example_') || entry.leadId.startsWith('sample-') || /demo|sample|fictional/i.test(entry.businessName);
}

function qaPackPath(id: string): string | null {
  return relativeIfExists(`output/lead-packs/${id}.md`);
}

function relativeIfExists(relativePath: string): string | null {
  return fs.existsSync(path.join(process.cwd(), relativePath)) ? relativePath : null;
}

function detectDirtyWorktree(): boolean {
  try {
    return execFileSync('git', ['status', '--porcelain'], { cwd: process.cwd(), encoding: 'utf8' }).trim().length > 0;
  } catch {
    return false;
  }
}

function defaultNextAction(status: LifecycleStatus): string {
  return status === 'proposal_ready' ? 'Review the proposal.'
    : status === 'pack_ready' ? 'Review evidence before outreach approval.'
      : status === 'qualified' ? 'Generate or review the pack.'
        : 'Verify the lead.';
}

function formatAction(item: StudioAction): string {
  return `${item.priority}. ${item.businessName} (${item.leadType}): ${item.actionType} — ${item.reason}${item.exactExistingCommand ? ` Command: ${item.exactExistingCommand}` : ''}`;
}

function formatCounts(counts: Record<LifecycleStatus, number>): string {
  return Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => `${key}=${value}`).join(', ') || 'none';
}

function bullets(values: string[]): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join('\n') : '- None.';
}

function pruneHistory(): void {
  const dir = path.join(DAILY_DIR, 'history');
  const files = fs.readdirSync(dir).filter((file) => /\.(json|md)$/.test(file)).sort();
  const stems = [...new Set(files.map((file) => file.replace(/\.(json|md)$/, '')))].sort();
  for (const stem of stems.slice(0, Math.max(0, stems.length - 30))) {
    for (const extension of ['json', 'md']) {
      const filePath = path.join(dir, `${stem}.${extension}`);
      if (fs.existsSync(filePath)) fs.rmSync(filePath);
    }
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
