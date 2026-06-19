import { buildCommercialConsistencyReport, writeConsistencyOutputs } from './consistencyRules';
const report = buildCommercialConsistencyReport();
console.log(`Commercial consistency: ${report.status}; actionable lead: ${report.actionableLead}.`);
console.log(`${writeConsistencyOutputs(report).length} report(s) generated.`);
