import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Retainer plan generated: output/retainer-operations/retainer-plan.md');
console.log(`Client: ${report.client.clientName}`);
console.log(`Status: ${report.retainerStatus}`);
