import fs = require('fs');
import path = require('path');
import { generatePilotDeliveryPack } from './generatePilotDeliveryPack';

const outputDir = path.join(process.cwd(), 'output', 'pilot-pack', 'simulation');
const summaryMdPath = path.join(outputDir, 'simulation-summary.md');
const summaryJsonPath = path.join(outputDir, 'simulation-summary.json');

export function runPilotSimulation(now = new Date()): { summaryPath: string; jsonPath: string } {
  const pack = generatePilotDeliveryPack(now, [], false);
  const simulation = {
    generatedAt: now.toISOString(),
    scenario: '0 approved leads',
    totalReviewedLeads: pack.metrics.leadsReviewed,
    approvedLeads: pack.metrics.leadsApproved,
    status: pack.summary.status,
    estimatedOpportunityValue: pack.metrics.estimatedOpportunityValue,
    expectedResult: 'NO_DELIVERY',
    passed: pack.summary.status === 'NO_DELIVERY' && pack.metrics.leadsApproved === 0,
    safetyRules: pack.deliveryPackage.safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryMdPath, renderSimulationSummary(simulation), 'utf8');
  fs.writeFileSync(summaryJsonPath, `${JSON.stringify(simulation, null, 2)}\n`, 'utf8');

  return {
    summaryPath: path.relative(process.cwd(), summaryMdPath),
    jsonPath: path.relative(process.cwd(), summaryJsonPath),
  };
}

function renderSimulationSummary(simulation: {
  generatedAt: string;
  scenario: string;
  totalReviewedLeads: number;
  approvedLeads: number;
  status: string;
  estimatedOpportunityValue: number;
  expectedResult: string;
  passed: boolean;
  safetyRules: string[];
}): string {
  return `# Pilot Simulation Summary

Generated: ${simulation.generatedAt}

## Scenario

- ${simulation.scenario}

## Result

- Total reviewed leads: ${simulation.totalReviewedLeads}
- Approved leads: ${simulation.approvedLeads}
- Status: ${simulation.status}
- Expected result: ${simulation.expectedResult}
- Estimated opportunity value: $${simulation.estimatedOpportunityValue.toFixed(0)}
- Passed: ${simulation.passed ? 'yes' : 'no'}

## Safety Rules

${simulation.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

if (require.main === module) {
  const result = runPilotSimulation();
  console.log(`Generated pilot simulation: ${result.summaryPath}, ${result.jsonPath}`);
}
