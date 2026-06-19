import { buildRevenueModeReport, revenueModeOutputDir, renderActionQueue } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'action-queue.md'), renderActionQueue(report), 'utf8');
console.log(`Revenue action queue generated: ${report.actionQueue.length} item(s).`);
