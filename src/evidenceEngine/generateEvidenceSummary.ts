import { buildDynamicEvidenceSummary, writeEvidenceSummaryOutput } from './evidenceRules';

function main(): void {
  const summary = buildDynamicEvidenceSummary();
  writeEvidenceSummaryOutput(summary);
  console.log('Evidence summary generated: output/evidence/evidence-summary.md');
  console.log(`Company: ${summary.target.companyName}`);
  console.log(`Page: ${summary.page?.evidenceStatus ?? 'MISSING'}`);
  console.log(`Flows: ${summary.flows?.evidenceStatus ?? 'MISSING'}`);
  console.log(`Screenshots: ${summary.screenshots?.evidenceStatus ?? 'MISSING'}`);
  console.log(`Lighthouse: ${summary.lighthouse?.evidenceStatus ?? 'MISSING'}`);
}

main();
