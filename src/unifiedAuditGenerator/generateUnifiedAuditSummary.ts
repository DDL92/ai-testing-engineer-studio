import path = require('path');
import { buildUnifiedAuditPortfolio, writeUnifiedAuditSummary } from './unifiedAuditRules';

function main(): void {
  const portfolio = buildUnifiedAuditPortfolio();
  const outputPaths = writeUnifiedAuditSummary(portfolio);

  console.log(`Unified audit summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies summarized: ${portfolio.reports.length}`);
  console.log('Summary reads local audit and evidence outputs only. It does not browse, scan, authenticate, send outreach, or generate proposals.');
}

main();
