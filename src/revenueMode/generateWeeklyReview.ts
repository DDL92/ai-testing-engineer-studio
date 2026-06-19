import { buildRevenueModeReport, revenueModeOutputDir, renderWeeklyReview } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'weekly-review.md'), renderWeeklyReview(report), 'utf8');
console.log(`Weekly review generated from ${report.outcomeCount} recorded outcome(s).`);
