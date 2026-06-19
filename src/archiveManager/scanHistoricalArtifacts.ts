import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderArtifactReport } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'historical-artifacts.md'), renderArtifactReport('Historical Artifacts', report.historical, report), 'utf8');
console.log(`Historical artifacts inventoried: ${report.historical.length}.`);
