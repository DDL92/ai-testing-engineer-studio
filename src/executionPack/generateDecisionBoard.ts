import fs = require('fs');
import path = require('path');
import {
  buildFirstRevenueExecutionPack,
  FirstRevenueExecutionPack,
} from './generateFirstRevenueChecklist';

const outputRoot = path.join(process.cwd(), 'output', 'execution');

function main(): void {
  const pack = buildFirstRevenueExecutionPack();
  const outputPath = writeDecisionBoard(pack);

  console.log(`Decision board generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`GO / NO GO: ${pack.recommendation}`);
  console.log(`Remaining blockers: ${pack.remainingBlockers.length}`);
  console.log('Decision board is review-only and creates no external actions.');
}

function writeDecisionBoard(pack: FirstRevenueExecutionPack): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'decision-board.md');
  fs.writeFileSync(outputPath, renderDecisionBoard(pack), 'utf8');
  return outputPath;
}

function renderDecisionBoard(pack: FirstRevenueExecutionPack): string {
  return [
    '# Decision Board',
    '',
    `Generated: ${pack.generatedAt}`,
    '',
    '## GO / NO GO',
    pack.recommendation,
    '',
    '## Exact Reasons',
    renderList(pack.exactReasons),
    '',
    '## Remaining Blockers',
    renderList(pack.remainingBlockers),
    '',
    '## Manual Next Action',
    pack.manualNextAction,
    '',
    '## Execution Estimate',
    renderList([
      `Time to execute: ${pack.timeToExecute}`,
      `Estimated revenue value: ${pack.estimatedRevenueValue}`,
      `Estimated confidence score: ${pack.estimatedConfidenceScore}/100`,
    ]),
    '',
    '## Safety Rules',
    renderList(pack.safetyRules),
    '',
  ].join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

main();
