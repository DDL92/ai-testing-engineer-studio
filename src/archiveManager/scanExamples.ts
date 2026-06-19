import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderArtifactReport } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'example-artifacts.md'), renderArtifactReport('Example Artifacts', report.examples, report), 'utf8');
console.log(`Example artifacts inventoried: ${report.examples.length}.`);
