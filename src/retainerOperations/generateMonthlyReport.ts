import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Monthly report template generated: output/retainer-operations/monthly-report-template.md');
