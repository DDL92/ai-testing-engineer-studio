import path = require('path');
import { buildMacDailyData, writeMacSummaryOutputs } from './macAutomationRules';

function main(): void {
  const data = buildMacDailyData(new Date().toISOString());
  const outputPaths = writeMacSummaryOutputs(data);

  console.log(`Mac daily summary generated: ${relative(outputPaths.summary)}`);
  console.log(`System health generated: ${relative(outputPaths.systemHealth)}`);
  console.log(`Action cockpit generated: ${relative(outputPaths.actionCockpit)}`);
  console.log('Summary-only mode: existing reports were read; daily report commands were not rerun.');
  console.log(`Commercial leads: ${data.commercialLeads.length}`);
  console.log(`Demo leads: ${data.demoLeadCount}`);
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payments, credentials, or external databases were used.');
  console.log('Human approval remains required before external action.');
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

main();
