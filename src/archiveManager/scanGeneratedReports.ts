import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderGeneratedReports } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'generated-reports.md'), renderGeneratedReports(report), 'utf8');
console.log(`Generated reports inventoried: ${report.generatedReports.length}.`);
