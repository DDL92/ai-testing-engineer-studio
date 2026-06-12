import path = require('path');
import { buildEvidencePortfolio, writeEvidencePortfolio } from './evidenceRules';

function main(): void {
  const portfolio = buildEvidencePortfolio();
  const outputPaths = writeEvidencePortfolio(portfolio);

  console.log(`Evidence portfolio generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies: ${portfolio.reports.length}`);
  console.log(`Highest readiness: ${portfolio.highestReadiness?.companyName ?? 'none'}`);
  console.log(`Largest evidence gap: ${portfolio.largestEvidenceGap?.companyName ?? 'none'}`);
  console.log('No browser automation, Playwright execution, Lighthouse execution, APIs, scraping, screenshots, credentials, or invented evidence were used.');
}

main();
