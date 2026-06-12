import path = require('path');
import {
  buildProposalCenterReport,
  loadProposalCenterInput,
  writeSowCenterOutput,
} from './proposalCenterRules';

function main(): void {
  const input = loadProposalCenterInput();
  const report = buildProposalCenterReport(input);
  const outputPath = writeSowCenterOutput(report);

  console.log(`SOW readiness report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top 5 analyzed: ${report.topFive.length}`);
  console.log(`SOW-ready leads: ${report.topFive.filter((opportunity) => opportunity.sowReadiness === 'READY').length}`);
  console.log('No SOWs were sent. Human approval is required before using any SOW externally.');
}

main();
