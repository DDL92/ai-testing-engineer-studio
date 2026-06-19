import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderTemporaryArtifacts } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'temporary-artifacts.md'), renderTemporaryArtifacts(report), 'utf8');
console.log(`Temporary artifacts inventoried: ${report.temporary.length}.`);
