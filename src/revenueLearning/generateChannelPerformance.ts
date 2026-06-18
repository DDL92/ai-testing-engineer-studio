import { buildRevenueLearningReport, writeRevenueLearningOutputs } from './learningRules';

const report = buildRevenueLearningReport();
writeRevenueLearningOutputs(report);
console.log('Channel performance generated: output/revenue-learning/channel-performance.md');
