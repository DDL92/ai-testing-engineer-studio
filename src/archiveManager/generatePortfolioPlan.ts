import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderPortfolioPlan } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'portfolio-plan.md'), renderPortfolioPlan(report), 'utf8');
console.log(`Portfolio plan generated for ${report.portfolio.length} asset(s).`);
