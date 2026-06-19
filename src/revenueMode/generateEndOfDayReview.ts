import { buildRevenueModeReport, revenueModeOutputDir, renderEndOfDayReview } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'end-of-day-review.md'), renderEndOfDayReview(report), 'utf8');
console.log(`End-of-day review generated from ${report.outcomeCount} recorded outcome(s).`);
