import fs = require('fs');
import { execFileSync } from 'child_process';
import path = require('path');
import { generateClientLeadPacks } from './generateClientLeadPacks';
import { generateDailyLeadPack } from './generateDailyLeadPack';
import { generateTargetedDiscoveryPlan } from './generateTargetedDiscoveryPlan';
import { buildSourceQueries } from './buildSourceQueries';
import { generateBehaviorQueries } from './generateBehaviorQueries';
import { generateDynamicQueries } from './generateDynamicQueries';
import { generateDiscoveryQueries } from './generateDiscoveryQueries';
import { validateTavilyConfig } from './validateTavilyConfig';
import { runSafePublicSearch } from './runSafePublicSearch';
import { generateProviderHealthReport } from './generateProviderHealthReport';
import { generateSearchQualityReport } from './generateSearchQualityReport';
import { enrichSearchCandidates } from './enrichSearchCandidates';
import { generateDeliveryCandidates } from './generateDeliveryCandidates';
import { promoteVerificationCandidates } from './promoteVerificationCandidates';
import { prepareInterestVerification } from './prepareInterestVerification';
import { generateFloraPilotPack } from './generateFloraPilotPack';
import { learnBehaviorQueries } from './learnBehaviorQueries';
import { updateQueryLearning } from './updateQueryLearning';

const rawSamplePath = path.join(process.cwd(), 'data', 'lead-discovery', 'raw-signals.sample.json');

async function main(): Promise<void> {
  const modulesExecuted: string[] = [];
  const warnings: string[] = [];

  try {
    if (fs.existsSync(rawSamplePath)) {
      execFileSync('npm', ['run', 'leads:intake'], {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
      });
      modulesExecuted.push('manual raw signal normalization');
    } else {
      warnings.push('Raw sample file not found; skipped normalization and used existing normalized/sample leads.');
    }

    const pack = generateDailyLeadPack();
    modulesExecuted.push('daily lead pack generation');
    const clientRouting = generateClientLeadPacks();
    modulesExecuted.push('client lead pack routing');
    const targetedPlan = generateTargetedDiscoveryPlan();
    modulesExecuted.push('targeted discovery planning');
    const sourceQueries = buildSourceQueries();
    modulesExecuted.push('source-specific query generation');
    const behaviorQueries = generateBehaviorQueries();
    modulesExecuted.push('behavioral buyer intent query generation');
    const dynamicQueries = generateDynamicQueries();
    modulesExecuted.push('dynamic buyer signal query generation');
    const queryBatch = generateDiscoveryQueries();
    modulesExecuted.push('discovery query generation');
    const tavilyHealth = validateTavilyConfig();
    modulesExecuted.push('Tavily provider health validation');
    const searchBatch = await runSafePublicSearch();
    modulesExecuted.push('safe public search candidate collection');
    const providerHealth = generateProviderHealthReport();
    modulesExecuted.push('search diagnostics and provider health reporting');
    const searchQuality = generateSearchQualityReport();
    modulesExecuted.push('search quality classification');
    const enrichmentBatch = enrichSearchCandidates();
    modulesExecuted.push('lead signal enrichment');
    const deliveryBatch = generateDeliveryCandidates();
    modulesExecuted.push('lead quality and delivery candidate generation');
    const verificationReview = promoteVerificationCandidates();
    modulesExecuted.push('evidence-based verification review promotion');
    const verificationBatch = prepareInterestVerification();
    modulesExecuted.push('interest verification preparation');
    const pilotPack = generateFloraPilotPack();
    modulesExecuted.push('Flora pilot package generation');
    const behaviorPerformance = learnBehaviorQueries();
    modulesExecuted.push('behavior query performance learning');
    const queryLearning = updateQueryLearning();
    modulesExecuted.push('dynamic query learning');

    console.log('Daily Lead Discovery Workflow: READY');
    console.log(`Modules executed: ${modulesExecuted.join(', ')}`);
    console.log(`Files generated: ${[...pack.filesGenerated, ...clientRouting.filesGenerated].join(', ')}`);
    console.log(`Targeted discovery plan generated: ${targetedPlan.filesGenerated.join(', ')}`);
    console.log(`Source queries generated: output/lead-discovery/targeted-discovery/source-queries.md, output/lead-discovery/targeted-discovery/source-queries.csv (${sourceQueries.rows.length} source queries)`);
    console.log(`Behavior queries generated: output/lead-discovery/behavior-queries/behavior-query-summary.md, output/lead-discovery/behavior-queries/behavior-queries.json (${behaviorQueries.totalQueries} queries)`);
    console.log(`Dynamic queries generated: output/lead-discovery/dynamic-queries/dynamic-query-summary.md, output/lead-discovery/dynamic-queries/dynamic-queries.json (${dynamicQueries.totalQueries} queries)`);
    console.log(`Discovery queries generated: output/lead-discovery/discovery-queries/discovery-query-summary.md, output/lead-discovery/discovery-queries/discovery-queries.json (${queryBatch.totalQueries} queries)`);
    console.log(`Tavily health generated: output/lead-discovery/diagnostics/tavily-health.md (${tavilyHealth.healthStatus})`);
    console.log(`Search candidates generated: output/lead-discovery/search-candidates/search-summary.md, output/lead-discovery/search-candidates/search-candidates.json (${searchBatch.totalCandidates} candidates)`);
    console.log(`Search diagnostics generated: ${providerHealth.filesGenerated.join(', ')}`);
    console.log(`Search quality generated: output/lead-discovery/search-quality/search-quality-summary.md, output/lead-discovery/search-quality/query-quality.md (${searchQuality.rows.length} query rows)`);
    console.log(`Enriched candidates generated: output/lead-discovery/enriched-leads/enrichment-summary.md, output/lead-discovery/enriched-leads/enriched-leads.json (${enrichmentBatch.enrichedCandidates.length} candidates)`);
    console.log(`Delivery candidates generated: output/lead-discovery/delivery-candidates/delivery-summary.md, output/lead-discovery/delivery-candidates/delivery-candidates.json (${deliveryBatch.deliveryCandidates.filter((candidate) => !candidate.excluded && candidate.overallScore >= 6 && candidate.sourceQuality !== 'low').length} active candidates)`);
    console.log(`Verification review generated: output/lead-discovery/verification/review-queue.md, output/lead-discovery/verification/verification-learning.md (${verificationReview.reviewItems.length} promoted for review)`);
    console.log(`Verification prep generated: output/lead-discovery/verification/verification-summary.md, output/lead-discovery/verification/flora_and_fauna_foods_001-verification-queue.md (${verificationBatch.totalVerificationCandidates} candidates)`);
    console.log(`Flora pilot package generated: ${pilotPack.outputPaths.join(', ')}`);
    console.log(`Behavior query learning generated: ${behaviorPerformance.filesGenerated.join(', ')} (${behaviorPerformance.rows.length} rows)`);
    console.log(`Query learning generated: ${queryLearning.filesGenerated.join(', ')} (${queryLearning.rows.length} rows)`);
    console.log(`Total leads: ${pack.totalLeads}`);
    console.log(`Included leads: ${pack.includedLeads}`);
    console.log(`Top verticals: ${pack.topVerticals.map((item) => `${item.vertical} (${item.count})`).join(', ') || 'none'}`);
    console.log(`Review count: ${pack.reviewCount}`);
    console.log(`Client routing: ${clientRouting.activeClients} active clients; ${clientRouting.zeroMatchClients.length} zero-match clients`);
    console.log(`Client routing summary: ${clientRouting.filesGenerated[0] ?? 'not generated'}`);
    console.log(`Warnings: ${warnings.join('; ') || 'none'}`);
    console.log('No scraping, page crawling, browser automation, AI calls, contact extraction, outreach, email, DM, calls, or form submission was performed.');
  } catch (error) {
    console.error('Daily Lead Discovery Workflow: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
