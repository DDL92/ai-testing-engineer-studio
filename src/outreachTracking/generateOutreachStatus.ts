import path = require('path');
import {
  buildOutreachSummary,
  loadOutreachRecords,
  writeOutreachStatusOutputs,
} from './outreachTrackingRules';

function main(): void {
  const records = loadOutreachRecords();
  const outputPaths = writeOutreachStatusOutputs(records);
  const summary = buildOutreachSummary(records);

  console.log(`Outreach status generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies contacted: ${summary.totalCompaniesContacted}`);
  console.log(`Contacts: ${summary.totalContacts}`);
  console.log(`Follow-ups due: ${summary.followUpsDue}`);
  console.log('No outreach was sent. No scraping, APIs, CRM, credentials, or external databases were used.');
}

main();
