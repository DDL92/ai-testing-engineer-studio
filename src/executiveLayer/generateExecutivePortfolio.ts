import path = require('path');
import {
  buildExecutivePortfolio,
  writeExecutivePortfolioOutputs,
} from './executiveRules';

function main(): void {
  const portfolio = buildExecutivePortfolio();
  const outputPaths = writeExecutivePortfolioOutputs(portfolio);

  console.log('Executive portfolio generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top executive priority: ${portfolio.topExecutivePriority?.companyName ?? 'none'}`);
  console.log('Executive layer is local-only and review-only.');
}

main();
