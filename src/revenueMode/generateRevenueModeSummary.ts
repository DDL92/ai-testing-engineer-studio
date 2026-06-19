import { buildRevenueModeReport, writeRevenueModeOutputs } from './revenueModeRules';

const report = buildRevenueModeReport();
const outputs = writeRevenueModeOutputs(report);
console.log(`Revenue Mode summary generated: ${outputs.length} report(s).`);
console.log(`Status: ${report.status}; top action: ${report.topAction}`);
