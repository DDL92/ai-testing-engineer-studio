import path = require('path');
import {
  buildOutreachSummary,
  loadOutreachContext,
  loadOutreachRecords,
  writeOutreachStatusOutputs,
} from './outreachTrackingRules';

function main(): void {
  const records = loadOutreachRecords();
  const context = loadOutreachContext();
  const outputPaths = writeOutreachStatusOutputs(records, undefined, context);
  const summary = buildOutreachSummary(records, undefined, context);

  console.log(`Outreach status generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies contacted: ${summary.totalCompaniesContacted}`);
  console.log(`Contacts: ${summary.totalContacts}`);
  console.log(`Follow-ups due: ${summary.followUpsDue}`);
  console.log('Read-only local reporting completed. No outreach or follow-up was sent.');
}

main();
