import fs = require('fs');
import path = require('path');
import { runDiscovery } from './discovery';
import { importWebsiteCandidates, readWebsiteLeads } from './leadAdapter';
import { writeWebsiteLeadPack } from './leadPack';
import { buildWebsiteRanking, isFixtureWebsiteLead, writeWebsiteRanking } from './rankingWorkflow';
import type { WebsiteTavilyReport } from './tavilyDiscovery';
import { WebsiteLeadRecord } from './types';

interface DailySummary {
  date: string;
  discoverySummary: {
    skipped: boolean;
    dryRun: boolean;
    candidatesFound: number;
    added: number;
    updated: number;
    duplicates: number;
    errors: string[];
    tavily: WebsiteTavilyReport | null;
  };
  storedLeadCount: number;
  rankingSummary: {
    total: number;
    priority: number;
    qualified: number;
    review: number;
    lowPriority: number;
  };
  topThreeCandidates: Array<{
    leadId: string;
    business: string;
    score: number;
    decision: string;
    nextAction: string;
  }>;
  leadPacksGenerated: string[];
  evidenceGaps: Array<{ leadId: string; gaps: string[] }>;
  recommendedManualActions: Array<{ leadId: string; action: string }>;
  warnings: string[];
  manualReviewRequired: true;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const skipDiscovery = args.includes('--skip-discovery');
  const refresh = args.includes('--refresh');
  const limitValue = readFlag(args, '--limit');
  const warnings: string[] = [];
  let discovery: Awaited<ReturnType<typeof runDiscovery>> | null = null;

  if (!skipDiscovery) {
    try {
      discovery = await runDiscovery({
        dryRun,
        limit: limitValue ? Number(limitValue) : undefined,
        writeReport: !dryRun,
        refresh,
      });
      warnings.push(...discovery.errors);
    } catch (error) {
      warnings.push(`Discovery failed; daily run continued with stored leads: ${errorMessage(error)}`);
    }
  }

  if (refresh && !dryRun) await reInspectRankedStoredLeads();
  const leads = dryRun && discovery?.plannedLeads ? discovery.plannedLeads : readWebsiteLeads();
  const ranking = buildWebsiteRanking(leads);
  const eligible = ranking
    .filter((item) => item.decision === 'PRIORITY' || item.decision === 'QUALIFIED')
    .filter((item) => {
      const record = leads.find((lead) => lead.lead.id === item.leadId);
      return record?.analysis.nextAction !== 'archive low-priority lead';
    })
    .slice(0, 3);
  const generated: string[] = [];

  if (!dryRun) {
    const rankingPaths = writeWebsiteRanking(ranking);
    console.log(`Ranking generated: ${path.relative(process.cwd(), rankingPaths.jsonPath)}, ${path.relative(process.cwd(), rankingPaths.markdownPath)}`);

    for (const record of leads.filter((lead) => lead.analysis.decision === 'NOT_QUALIFIED')) {
      const output = writeWebsiteLeadPack(record);
      generated.push(path.relative(process.cwd(), output.markdownPath));
      removeStaleSalesAssets(record.lead.id);
    }

    for (const item of eligible) {
      const record = leads.find((lead) => lead.lead.id === item.leadId);
      if (!record || isFixtureWebsiteLead(record) || hasIdenticalPack(record)) continue;
      const output = writeWebsiteLeadPack(record);
      generated.push(path.relative(process.cwd(), output.markdownPath));
    }
  }

  const summary: DailySummary = {
    date: new Date().toISOString().slice(0, 10),
    discoverySummary: {
      skipped: skipDiscovery,
      dryRun,
      candidatesFound: discovery?.candidatesFound ?? 0,
      added: discovery?.added ?? 0,
      updated: discovery?.updated ?? 0,
      duplicates: discovery?.duplicates ?? 0,
      errors: discovery?.errors ?? [],
      tavily: discovery ? {
        tavilyEnabled: discovery.tavilyEnabled,
        tavilyAvailable: discovery.tavilyAvailable,
        usageChecked: discovery.usageChecked,
        accountPlanUsage: discovery.accountPlanUsage,
        accountPlanLimit: discovery.accountPlanLimit,
        accountUsagePercent: discovery.accountUsagePercent,
        sharedThresholdPercent: discovery.sharedThresholdPercent,
        websiteCreditsUsedToday: discovery.websiteCreditsUsedToday,
        websiteCreditsUsedThisMonth: discovery.websiteCreditsUsedThisMonth,
        websiteDailyLimit: discovery.websiteDailyLimit,
        websiteMonthlyLimit: discovery.websiteMonthlyLimit,
        queriesConfigured: discovery.queriesConfigured,
        queriesEligible: discovery.queriesEligible,
        eligibleQueryIds: discovery.eligibleQueryIds,
        cachedQueryIds: discovery.cachedQueryIds,
        queriesExecuted: discovery.queriesExecuted,
        queriesSkippedCached: discovery.queriesSkippedCached,
        estimatedCredits: discovery.estimatedCredits,
        actualCredits: discovery.actualCredits,
        budgetDecision: discovery.budgetDecision,
        budgetReasons: discovery.budgetReasons,
        candidatesFromTavily: discovery.candidatesFromTavily,
        candidatesAccepted: discovery.candidatesAccepted,
        candidatesRejected: discovery.candidatesRejected,
        rejectedNonBusiness: discovery.rejectedNonBusiness,
        rejectedGenericTitle: discovery.rejectedGenericTitle,
        rejectedEditorialOrDirectory: discovery.rejectedEditorialOrDirectory,
        rejectedLowRelevance: discovery.rejectedLowRelevance,
        acceptedHighConfidence: discovery.acceptedHighConfidence,
        acceptedForReview: discovery.acceptedForReview,
        fixtureLeadsExcludedFromProductionRanking: discovery.fixtureLeadsExcludedFromProductionRanking,
        resultDiagnostics: discovery.resultDiagnostics,
        fallbackSourcesUsed: discovery.fallbackSourcesUsed,
        warnings: discovery.warnings,
      } : null,
    },
    storedLeadCount: leads.length,
    rankingSummary: {
      total: ranking.length,
      priority: ranking.filter((item) => item.decision === 'PRIORITY').length,
      qualified: ranking.filter((item) => item.decision === 'QUALIFIED').length,
      review: ranking.filter((item) => item.decision === 'REVIEW').length,
      lowPriority: ranking.filter((item) => item.decision === 'LOW_PRIORITY').length,
    },
    topThreeCandidates: eligible.map((item) => ({
      leadId: item.leadId,
      business: item.business,
      score: item.score,
      decision: item.decision,
      nextAction: item.recommendedNextAction,
    })),
    leadPacksGenerated: generated,
    evidenceGaps: eligible.map((item) => ({
      leadId: item.leadId,
      gaps: leads.find((lead) => lead.lead.id === item.leadId)?.analysis.evidenceGaps ?? [],
    })),
    recommendedManualActions: eligible.map((item) => ({
      leadId: item.leadId,
      action: item.recommendedNextAction,
    })),
    warnings,
    manualReviewRequired: true,
  };

  if (!dryRun) writeDailySummary(summary);
  console.log(`Stored leads: ${summary.storedLeadCount}`);
  console.log(`Eligible top candidates: ${summary.topThreeCandidates.length}`);
  console.log(`Lead packs generated: ${summary.leadPacksGenerated.length}`);
  console.log(`Warnings: ${summary.warnings.length}`);
  console.log(dryRun ? 'Daily dry run complete; no store, packs, ranking, or daily reports were written.' : 'Daily report generated. No outreach was sent.');
}

function removeStaleSalesAssets(leadId: string): void {
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'leads', leadId);
  for (const fileName of [
    'outreach-drafts.md',
    'homepage-demo.html',
    'proposal.md',
    'sow.md',
    'follow-up-plan.md',
    'sales-pack.json',
  ]) {
    const filePath = path.join(outputDir, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
}

async function reInspectRankedStoredLeads(): Promise<void> {
  const stored = readWebsiteLeads();
  const byId = new Map(stored.map((record) => [record.lead.id, record]));
  const candidates = buildWebsiteRanking(stored)
    .slice(0, 10)
    .map((ranked) => byId.get(ranked.leadId))
    .filter((record): record is WebsiteLeadRecord => Boolean(record))
    .map((record) => ({
      id: record.lead.id,
      businessName: record.lead.companyName,
      category: record.lead.industry,
      source: record.lead.source,
      location: record.location,
      websiteUrl: record.legacyWebsiteUrl ?? record.lead.website,
      instagramUrl: record.publicContact.instagramUrl,
      facebookUrl: record.publicContact.facebookUrl,
      email: record.publicContact.email,
      phone: record.publicContact.phone,
      notes: record.lead.fitNotes,
      sources: record.discovery?.sources ?? [],
    }));
  if (candidates.length > 0) await importWebsiteCandidates(candidates, { force: true });
}

function hasIdenticalPack(record: WebsiteLeadRecord): boolean {
  const packPath = path.join(
    process.cwd(),
    'output',
    'website-studio',
    'leads',
    record.lead.id,
    'lead-pack.json',
  );
  if (!fs.existsSync(packPath)) return false;
  try {
    const pack = JSON.parse(fs.readFileSync(packPath, 'utf8')) as {
      websiteInspectionEvidence?: unknown;
      verifiedOpportunitySignals?: unknown;
      score?: number;
      decision?: string;
    };
    return JSON.stringify({
      inspection: pack.websiteInspectionEvidence,
      signals: pack.verifiedOpportunitySignals,
      score: pack.score,
      decision: pack.decision,
    }) === JSON.stringify({
      inspection: record.inspection,
      signals: record.analysis.opportunitySignals,
      score: record.analysis.score,
      decision: record.analysis.decision,
    });
  } catch {
    return false;
  }
}

function writeDailySummary(summary: DailySummary): void {
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'daily');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'latest.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'latest.md'), renderDailySummary(summary), 'utf8');
}

function renderDailySummary(summary: DailySummary): string {
  return `# Website Studio Daily Summary — ${summary.date}

- Stored leads: ${summary.storedLeadCount}
- Ranked leads: ${summary.rankingSummary.total}
- Priority: ${summary.rankingSummary.priority}
- Qualified: ${summary.rankingSummary.qualified}
- Discovery skipped: ${summary.discoverySummary.skipped}
- Discovery candidates: ${summary.discoverySummary.candidatesFound}
- Lead packs generated: ${summary.leadPacksGenerated.length}
- Tavily enabled: ${summary.discoverySummary.tavily?.tavilyEnabled ?? false}
- Tavily shared usage: ${summary.discoverySummary.tavily?.accountPlanUsage ?? 'unknown'}/${summary.discoverySummary.tavily?.accountPlanLimit ?? 'unknown'}
- Website Tavily usage today: ${summary.discoverySummary.tavily?.websiteCreditsUsedToday ?? 0}/${summary.discoverySummary.tavily?.websiteDailyLimit ?? 3}
- Website Tavily usage this month: ${summary.discoverySummary.tavily?.websiteCreditsUsedThisMonth ?? 0}/${summary.discoverySummary.tavily?.websiteMonthlyLimit ?? 100}
- Tavily queries executed: ${summary.discoverySummary.tavily?.queriesExecuted ?? 0}
- Tavily budget decision: ${summary.discoverySummary.tavily?.budgetDecision ?? 'not_evaluated'}

## Top Candidates

${summary.topThreeCandidates.map((lead) => `- ${lead.business}: ${lead.score}/100, ${lead.decision}; next action: ${lead.nextAction}`).join('\n') || '- No eligible candidates.'}

## Evidence Gaps

${summary.evidenceGaps.map((lead) => `- ${lead.leadId}: ${lead.gaps.join('; ') || 'none recorded'}`).join('\n') || '- No eligible candidates.'}

## Recommended Manual Actions

${summary.recommendedManualActions.map((item) => `- ${item.leadId}: ${item.action}`).join('\n') || '- Manual review.'}

Manual review required: **yes**. No messages were generated or sent.
`;
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  return args.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

void main();
