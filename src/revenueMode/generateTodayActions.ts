import { buildRevenueModeReport, revenueModeOutputDir, renderTodayActions } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'today-actions.md'), renderTodayActions(report), 'utf8');
console.log(`${report.todayActions.length} revenue-priority action(s) generated.`);
