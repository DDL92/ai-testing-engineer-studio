import { buildRetainerOperationsReport, writeRetainerOperationsOutputs } from './retainerRules';

const report = buildRetainerOperationsReport();
writeRetainerOperationsOutputs(report);
console.log('Coverage roadmap generated: output/retainer-operations/coverage-roadmap.md');
console.log(`Coverage: ${report.metrics.coveragePercent}% automated`);
