import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Expansion opportunities generated: output/retainer-operations/expansion-opportunities.md');
