import { buildEvidenceReadinessDecision, writeEvidenceReadinessDecisionOutput } from './evidenceRules';

function main(): void {
  const decision = buildEvidenceReadinessDecision();
  writeEvidenceReadinessDecisionOutput(decision);
  console.log('Evidence readiness decision generated: output/evidence/evidence-readiness.md');
  console.log(`Company: ${decision.target.companyName}`);
  console.log(`Readiness Status: ${decision.status}`);
  console.log(`GO / NO GO: ${decision.goNoGo}`);
}

main();
