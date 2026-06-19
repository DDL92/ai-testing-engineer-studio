import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderRetentionPolicy } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'retention-policy.md'), renderRetentionPolicy(report), 'utf8');
console.log('Retention policy generated for all six archive classifications.');
