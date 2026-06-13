import fs = require('fs');
import path = require('path');

interface ReadinessItem {
  label: string;
  path: string;
  required: boolean;
}

interface ReadinessResult extends ReadinessItem {
  exists: boolean;
}

const requiredItems: ReadinessItem[] = [
  { label: 'Lead database', path: 'data/leads.json', required: true },
  { label: 'Client database', path: 'data/clients.json', required: true },
  { label: 'First 50 targets', path: 'data/first-50-targets.json', required: true },
  { label: 'Day plan', path: 'output/daily-revenue/today-plan.md', required: true },
  { label: 'Revenue summary', path: 'output/metrics/revenue-summary.md', required: true },
  { label: 'Action cockpit', path: 'output/cockpit/action-cockpit.md', required: true },
];

const outputPath = path.join(process.cwd(), 'output', 'system-readiness', 'readiness-report.md');

function main(): void {
  const results = requiredItems.map(checkItem);
  const missingRequired = results.filter((result) => result.required && !result.exists);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderReport(results, missingRequired.length === 0), 'utf8');

  console.log(`System readiness report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Status: ${missingRequired.length === 0 ? 'ready' : 'needs attention'}`);

  if (missingRequired.length > 0) {
    console.log('Missing required items:');
    for (const item of missingRequired) {
      console.log(`- ${item.path}`);
    }
    process.exitCode = 1;
  }
}

function checkItem(item: ReadinessItem): ReadinessResult {
  return {
    ...item,
    exists: fs.existsSync(path.join(process.cwd(), item.path)),
  };
}

function renderReport(results: ReadinessResult[], ready: boolean): string {
  const generatedAt = new Date().toISOString();

  return [
    '# System Readiness Report',
    '',
    `Generated at: ${generatedAt}`,
    `Status: ${ready ? 'Ready for local manual workflow review' : 'Needs attention before real lead workflow'}`,
    '',
    '## Required Files',
    '',
    ...results.map((result) => `- ${result.exists ? '[x]' : '[ ]'} ${result.label}: \`${result.path}\``),
    '',
    '## Recommended Recovery Commands',
    '',
    '- `npm run day:plan`',
    '- `npm run metrics:revenue`',
    '- `npm run cockpit`',
    '- `npm run outreach:queue`',
    '',
    '## Safety Notes',
    '',
    '- This check only verifies local files exist.',
    '- It does not send outreach, inspect websites, connect APIs, scrape, use credentials, or validate business quality.',
    '- Daniel must review all outreach, audits, proposals, and client communication before use.',
    '',
  ].join('\n');
}

main();
