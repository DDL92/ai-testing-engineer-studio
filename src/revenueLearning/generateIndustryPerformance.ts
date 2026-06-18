import { buildRevenueLearningReport, writeRevenueLearningOutputs } from './learningRules';

const report = buildRevenueLearningReport();
writeRevenueLearningOutputs(report);
console.log('Industry performance generated: output/revenue-learning/industry-performance.md');
