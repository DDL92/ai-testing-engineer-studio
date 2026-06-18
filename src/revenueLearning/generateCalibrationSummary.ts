import { buildRevenueLearningReport, writeRevenueLearningOutputs } from './learningRules';

const report = buildRevenueLearningReport();
writeRevenueLearningOutputs(report);
console.log('Calibration summary generated: output/revenue-learning/calibration-summary.md');
console.log(`Status: ${report.status}`);
console.log(`Influence: ${report.calibrationInfluence}%`);
