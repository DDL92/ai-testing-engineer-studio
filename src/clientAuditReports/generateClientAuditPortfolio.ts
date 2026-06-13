import path = require('path');
import { buildClientAuditPortfolio, writeClientAuditPortfolio } from './clientAuditReportRules';

function main(): void {
  const portfolio = buildClientAuditPortfolio();
  const outputPaths = writeClientAuditPortfolio(portfolio);

  console.log(`Client audit portfolio generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies summarized: ${portfolio.reports.length}`);
  console.log('Portfolio reads generated client audit artifacts only. It does not send reports, browse, scan, authenticate, or generate proposals.');
}

main();
