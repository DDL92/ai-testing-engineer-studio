import path = require('path');
import {
  buildExecutivePortfolio,
  writeExecutivePortfolioOutputs,
} from './executiveRules';

function main(): void {
  const portfolio = buildExecutivePortfolio();
  const outputPaths = writeExecutivePortfolioOutputs(portfolio);

  console.log('Executive business risk generated.');
  for (const outputPath of outputPaths.filter((item) => item.endsWith('business-risk.md'))) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log('Business risk uses local evidence only and does not claim confirmed incidents.');
}

main();
