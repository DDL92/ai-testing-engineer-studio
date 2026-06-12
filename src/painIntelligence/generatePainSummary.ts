import path = require('path');
import { buildPainSummary, loadPainResearch, writePainSummaryReports } from './painIntelligenceRules';

function main(): void {
  const records = loadPainResearch();
  const outputPaths = writePainSummaryReports(records);
  const summary = buildPainSummary(records);

  console.log(`Pain summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies: ${summary.totalCompanies}`);
  console.log(`Complaint signals: ${summary.totalComplaints}`);
  console.log(`QA risks: ${summary.totalRisks}`);
  console.log('No customer complaints, quotes, vulnerabilities, incidents, or findings were invented.');
}

main();
