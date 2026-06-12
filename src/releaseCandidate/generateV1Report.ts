import path = require('path');
import { buildReleaseCandidateReport, writeV1ReportPackage } from './releaseCandidateRules';

function main(): void {
  const report = buildReleaseCandidateReport();
  const outputPaths = writeV1ReportPackage(report);

  console.log('AI Studio OS v1.0 candidate report package generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Release score: ${report.releaseScore.overall}/100`);
  console.log(`Release recommendation: ${report.releaseScore.recommendation}`);
  console.log(`Booked MRR: $${report.revenue.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Closest first-client lead: ${report.closestLead?.company ?? 'none'}`);
  console.log('No invented revenue, contacts, audit findings, proposals, payments, or outreach actions were created.');
  console.log('Human approval is required before external action.');
}

main();
