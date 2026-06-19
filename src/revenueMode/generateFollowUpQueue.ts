import { buildRevenueModeReport, revenueModeOutputDir, renderFollowUpQueue } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'follow-up-queue.md'), renderFollowUpQueue(report), 'utf8');
console.log(`Manual follow-up queue generated: ${report.followUpQueue.length} item(s).`);
