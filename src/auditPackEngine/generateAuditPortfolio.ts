import path = require('path');
import { buildAuditPortfolio, writeAuditPortfolio } from './auditPackRules';

function main(): void {
  const portfolio = buildAuditPortfolio();
  const outputPaths = writeAuditPortfolio(portfolio);

  console.log(`QA Audit Portfolio generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies: ${portfolio.packs.length}`);
  console.log(`Best first client: ${portfolio.bestFirstClient?.companyName ?? 'none'}`);
  console.log('No outreach, invoices, contracts, payment instructions, or external actions were generated.');
}

main();
