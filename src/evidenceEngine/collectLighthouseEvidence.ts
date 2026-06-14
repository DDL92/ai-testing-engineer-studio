import { collectLighthouseEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectLighthouseEvidence();
  console.log('Lighthouse evidence generated: output/evidence/lighthouse-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log(`Performance: ${score(report.scores.performance)}`);
  console.log(`Accessibility: ${score(report.scores.accessibility)}`);
  console.log(`Best Practices: ${score(report.scores.bestPractices)}`);
  console.log(`SEO: ${score(report.scores.seo)}`);
  console.log('Observed Lighthouse scores only. No business, revenue, customer-impact, or vulnerability claims were made.');
}

function score(value: number | null): string {
  if (value === null) return 'Not Available';
  return `${Math.round(value * 100)}/100`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
