import path = require('path');
import { buildCommercialUxView, writeRevenueHeroOutput } from './commercialUxRules';

function main(): void {
  const outputs = writeRevenueHeroOutput(buildCommercialUxView());
  console.log('Commercial UX revenue hero generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
  console.log('Read-only UX output. No outreach, email, CRM, meeting, invoice, payment, outcome, or revenue action was performed.');
}

main();
