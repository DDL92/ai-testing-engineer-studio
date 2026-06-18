import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Renewal plan generated: output/retainer-operations/renewal-plan.md');
console.log(`Renewal readiness: ${report.renewal.status}`);
