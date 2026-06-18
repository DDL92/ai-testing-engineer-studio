import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Client health generated: output/retainer-operations/client-health.md');
console.log(`Health: ${report.health.status}`);
