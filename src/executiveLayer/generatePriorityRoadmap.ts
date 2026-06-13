import path = require('path');
import {
  buildExecutivePortfolio,
  writeExecutivePortfolioOutputs,
} from './executiveRules';

function main(): void {
  const portfolio = buildExecutivePortfolio();
  const outputPaths = writeExecutivePortfolioOutputs(portfolio);

  console.log('Executive priority roadmap generated.');
  for (const outputPath of outputPaths.filter((item) => item.endsWith('executive-priorities.md') || item.endsWith('executive-roadmap.md'))) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log('Priorities are ranked by business impact first, then technical importance.');
}

main();
