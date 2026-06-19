import { buildRevenueModeReport, revenueModeOutputDir, renderRevenueGoals } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'revenue-goals.md'), renderRevenueGoals(report), 'utf8');
console.log(`Revenue goals generated from booked MRR: $${report.goals.currentMrr}.`);
