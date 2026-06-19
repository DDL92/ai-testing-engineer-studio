import { buildRevenueModeReport, revenueModeOutputDir, renderMorningBrief } from './revenueModeRules';
import fs = require('fs');
import path = require('path');

const report = buildRevenueModeReport();
fs.mkdirSync(revenueModeOutputDir, { recursive: true });
fs.writeFileSync(path.join(revenueModeOutputDir, 'morning-brief.md'), renderMorningBrief(report), 'utf8');
console.log(`Morning brief generated for ${report.actionableLead}.`);
