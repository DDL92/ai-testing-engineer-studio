import path = require('path');
import { buildRevenueIntelligenceReport, writeUnifiedRecommendationOutput } from './revenueIntelligenceRules';

function main(): void {
  const report = buildRevenueIntelligenceReport();
  const outputs = writeUnifiedRecommendationOutput(report);
  console.log('Unified revenue recommendation generated.');
  for (const output of outputs) console.log(`- ${path.relative(process.cwd(), output)}`);
  console.log(`Recommended lead: ${report.topLead?.companyName ?? 'none'}`);
  console.log('Recommendation is planning-only. Human approval remains required.');
}

main();
