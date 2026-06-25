import fs = require('fs');
import { execFileSync } from 'child_process';
import path = require('path');

const commands = [
  'leads:targeted-plan',
  'leads:source-queries',
  'leads:rewrite-queries',
  'leads:conversation-queries',
  'leads:behavior-queries',
  'leads:dynamic-queries',
  'leads:queries',
  'leads:tavily-health',
  'leads:search',
  'leads:health',
  'leads:search-quality',
  'leads:enrich',
  'leads:quality',
  'leads:verification-review',
  'leads:verify',
  'leads:pilot',
  'leads:export',
  'leads:dashboard',
  'leads:performance',
  'leads:behavior-performance',
  'leads:query-learning',
  'leads:false-positive-learning',
];

function main(): void {
  console.log('Morning Lead Workflow: STARTED');
  const completed: string[] = [];
  try {
    for (const command of commands) {
      execFileSync('npm', ['run', command], {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf8',
      });
      completed.push(command);
      console.log(`Completed: ${command}`);
    }

    const delivery = readJson<{ deliveryCandidates: Array<{ clientId: string; excluded: boolean; sourceQuality: string; overallScore: number }> }>('output/lead-discovery/delivery-candidates/delivery-candidates.json');
    const floraDelivery = delivery.deliveryCandidates.filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001' && !candidate.excluded && candidate.sourceQuality !== 'low' && candidate.overallScore >= 6).length;
    const verificationSummary = fs.readFileSync(path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'verification-summary.md'), 'utf8');
    const floraVerification = Number(verificationSummary.match(/Flora verification candidates: (\d+)/)?.[1] ?? 0);
    const verificationReview = readJson<{ reviewItems: Array<{ clientId: string; verificationPromotionStatus: string }> }>('output/lead-discovery/verification/review-queue.json');
    const floraReview = verificationReview.reviewItems.filter((item) => item.clientId === 'flora_and_fauna_foods_001').length;

    console.log('Morning Lead Workflow: READY');
    console.log(`Commands completed: ${completed.join(', ')}`);
    console.log(`Flora delivery candidates: ${floraDelivery}`);
    console.log(`Flora verification review candidates: ${floraReview}`);
    console.log(`Flora verification candidates: ${floraVerification}`);
    console.log('Targeted plan path: output/lead-discovery/targeted-discovery/targeted-plan.md');
    console.log('Source query path: output/lead-discovery/targeted-discovery/source-queries.md');
    console.log('Rewrite path: output/lead-discovery/query-rewrites/rewritten-queries.json');
    console.log('Conversation path: output/lead-discovery/conversation-queries/conversation-queries.json');
    console.log('Behavior query path: output/lead-discovery/behavior-queries/behavior-query-summary.md');
    console.log('Dynamic query path: output/lead-discovery/dynamic-queries/dynamic-query-summary.md');
    console.log('Dashboard path: output/lead-discovery/dashboard/client-dashboard.md');
    console.log('Tavily health path: output/lead-discovery/diagnostics/tavily-health.md');
    console.log('Provider test path: output/lead-discovery/diagnostics/provider-test.md');
    console.log('Search quality report path: output/lead-discovery/search-quality/search-quality-summary.md');
    console.log('Provider health path: output/lead-discovery/diagnostics/provider-health.md');
    console.log('Query failures path: output/lead-discovery/diagnostics/query-failures.md');
    console.log('Search execution summary path: output/lead-discovery/diagnostics/search-execution-summary.md');
    console.log('Diagnostics recommendations path: output/lead-discovery/diagnostics/recommendations.md');
    console.log('Query quality report path: output/lead-discovery/search-quality/query-quality.md');
    console.log('Source performance preview path: output/lead-discovery/search-quality/source-performance-preview.md');
    console.log('Export path: output/lead-discovery/exports/flora-and-fauna-foods/delivery-export.csv');
    console.log('Performance report path: output/lead-discovery/source-performance/source-performance-summary.md');
    console.log('Recommendations path: output/lead-discovery/source-performance/recommendations.md');
    console.log('Behavior performance path: output/lead-discovery/search-quality/behavior-query-performance.md');
    console.log('Query learning path: output/lead-discovery/query-learning/query-learning.md');
    console.log('False positive learning path: output/lead-discovery/learning/false-positive-summary.md');
    console.log('Verification review queue path: output/lead-discovery/verification/review-queue.md');
    console.log('Verification learning path: output/lead-discovery/verification/verification-learning.md');
    console.log('Blocked query report path: output/lead-discovery/search-candidates/blocked-queries.md');
    console.log('Reminder: Daniel review required before delivery or contact. No outreach was performed.');
  } catch (error) {
    console.error('Morning Lead Workflow: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    console.error(`Commands completed before failure: ${completed.join(', ') || 'none'}`);
    process.exitCode = 1;
  }
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')) as T;
}

if (require.main === module) main();
