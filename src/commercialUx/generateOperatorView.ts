import path = require('path');
import { buildCommercialUxView, writeOperatorViewOutput } from './commercialUxRules';

function main(): void {
  const outputs = writeOperatorViewOutput(buildCommercialUxView());
  console.log('Commercial UX operator view generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
  console.log('Read-only UX output. No outreach, email, CRM, meeting, invoice, payment, outcome, or revenue action was performed.');
}

main();
