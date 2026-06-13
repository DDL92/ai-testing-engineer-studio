import fs = require('fs');
import path = require('path');
import {
  buildFirstRevenueExecutionPack,
  FirstRevenueExecutionPack,
} from './generateFirstRevenueChecklist';

const outputRoot = path.join(process.cwd(), 'output', 'execution');

function main(): void {
  const pack = buildFirstRevenueExecutionPack();
  const outputPath = writeOutreachReview(pack);

  console.log(`Outreach review generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top target: ${pack.topTarget.companyName}`);
  console.log('Review only. No outreach or email was sent.');
}

function writeOutreachReview(pack: FirstRevenueExecutionPack): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'outreach-review.md');
  fs.writeFileSync(outputPath, renderOutreachReview(pack), 'utf8');
  return outputPath;
}

function renderOutreachReview(pack: FirstRevenueExecutionPack): string {
  return [
    '# Outreach Review',
    '',
    `Generated: ${pack.generatedAt}`,
    '',
    '## Target',
    renderList([
      `Company: ${pack.topTarget.companyName}`,
      `Best contact: ${pack.topTarget.bestContact}`,
      `Best offer: ${pack.topTarget.bestOffer}`,
      `Confidence: ${pack.estimatedConfidenceScore}/100`,
    ]),
    '',
    '## Review Decision',
    renderList([
      `GO / NO GO: ${pack.recommendation}`,
      `Manual next action: ${pack.manualNextAction}`,
      'No message is generated or sent by this report.',
    ]),
    '',
    '## Do Not Do',
    renderList([
      'Do not send outreach from Studio.',
      'Do not send email.',
      'Do not create a meeting.',
      'Do not claim revenue or client interest.',
    ]),
    '',
    '## Remaining Blockers',
    renderList(pack.remainingBlockers),
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
