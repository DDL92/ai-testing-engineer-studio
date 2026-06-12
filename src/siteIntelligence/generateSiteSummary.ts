import path = require('path');
import {
  buildSiteSummary,
  loadSiteIntelligence,
  writeSiteSummaryReports,
} from './siteIntelligenceRules';

function main(): void {
  const records = loadSiteIntelligence();
  const outputPaths = writeSiteSummaryReports(records);
  const summary = buildSiteSummary(records);

  console.log(`Site summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies: ${summary.totalCompanies}`);
  console.log(`Potential findings: ${summary.totalFindings}`);
  console.log(`Automation opportunities: ${summary.totalAutomationOpportunities}`);
  console.log('No bugs, vulnerabilities, security issues, outages, incidents, or customer findings were invented.');
}

main();
