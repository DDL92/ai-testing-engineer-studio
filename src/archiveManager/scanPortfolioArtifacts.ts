import fs = require('fs');
import path = require('path');
import { archiveOutputDir, buildArchiveReport, renderPortfolioArtifacts } from './archiveRules';
const report = buildArchiveReport();
fs.mkdirSync(archiveOutputDir, { recursive: true });
fs.writeFileSync(path.join(archiveOutputDir, 'portfolio-artifacts.md'), renderPortfolioArtifacts(report), 'utf8');
console.log(`Portfolio artifacts inventoried: ${report.portfolio.length}.`);
