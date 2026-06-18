import { buildRevenueLearningReport, writeRevenueLearningOutputs } from './learningRules';

const report = buildRevenueLearningReport();
writeRevenueLearningOutputs(report);
console.log('Revenue learning recommendations generated: output/revenue-learning/recommendations.md');
