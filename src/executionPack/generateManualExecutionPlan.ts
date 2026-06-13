import fs = require('fs');
import path = require('path');
import {
  buildFirstRevenueExecutionPack,
  renderManualExecutionPlan,
} from './generateFirstRevenueChecklist';

const outputRoot = path.join(process.cwd(), 'output', 'execution');

function main(): void {
  const pack = buildFirstRevenueExecutionPack();
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'manual-execution-plan.md');
  fs.writeFileSync(outputPath, renderManualExecutionPlan(pack), 'utf8');

  console.log(`Manual execution plan generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Time to execute: ${pack.timeToExecute}`);
  console.log('Manual execution support only. No external action was created.');
}

main();
