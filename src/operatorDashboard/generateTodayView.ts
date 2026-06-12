import path = require('path');
import {
  buildOperatorDashboardReport,
  loadOperatorDashboardInput,
  writeTodayViewOutput,
} from './operatorDashboardRules';

function main(): void {
  const input = loadOperatorDashboardInput();
  const report = buildOperatorDashboardReport(input);
  const outputPath = writeTodayViewOutput(report);

  console.log(`Today view generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top actions: ${report.actionCockpit.topActions.length}`);
  console.log(`Next recommended command: ${report.nextRecommendedCommand}`);
  console.log('Today view is local-only and does not send, approve, schedule, invoice, or update external systems.');
}

main();
