import { buildRevenueModeReport, revenueModeOutputDir, renderPriorityReview } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'priority-review.md'), renderPriorityReview(report), 'utf8');
console.log(`Priority review generated. Top action: ${report.topAction}`);
