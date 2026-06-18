import { buildRevenueLearningReport, writeRevenueLearningOutputs } from './learningRules';

const report = buildRevenueLearningReport();
writeRevenueLearningOutputs(report);
console.log('Offer performance generated: output/revenue-learning/offer-performance.md');
