import path = require('path');
import {
  buildProposalCenterReport,
  loadProposalCenterInput,
  writeProposalCenterOutputs,
} from './proposalCenterRules';

function main(): void {
  const input = loadProposalCenterInput();
  const report = buildProposalCenterReport(input);
  const outputPaths = writeProposalCenterOutputs(report);

  console.log('Proposal Command Center generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Commercial leads: ${report.commercialLeads}`);
  console.log(`Proposal-ready leads: ${report.proposalReady.length}`);
  console.log(`Top proposal opportunity: ${report.topFive[0]?.lead.companyName ?? 'none'}`);
  console.log('No proposals or SOWs were sent. No clients, findings, metrics, ROI, or approvals were invented.');
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email sending, payments, credentials, or external databases were used.');
}

main();
