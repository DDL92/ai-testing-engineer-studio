import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderArchivePlan, renderPortfolioPlan } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'archive-plan.md'), renderArchivePlan(report), 'utf8');
fs.writeFileSync(path.join(archiveOutputDir, 'portfolio-plan.md'), renderPortfolioPlan(report), 'utf8');
console.log(`Archive plan generated for ${report.archiveCandidates.length} manual candidate(s).`);
