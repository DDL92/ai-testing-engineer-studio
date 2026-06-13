import path = require('path');
import { buildProposalPortfolio, writeProposalPortfolio } from './proposalRules';

function main(): void {
  const portfolio = buildProposalPortfolio();
  const outputPaths = writeProposalPortfolio(portfolio);

  console.log(`Proposal portfolio generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies summarized: ${portfolio.proposals.length}`);
  console.log('Portfolio reads local proposal packages only. It does not send proposals, emails, outreach, contracts, invoices, or payment requests.');
}

main();
