import { buildArchiveReport, writeArchiveOutputs } from './archiveRules';
const report = buildArchiveReport();
console.log(`Archive summary generated: ${writeArchiveOutputs(report).length} report(s).`);
console.log(`Archive score: ${report.score.score}/100 (${report.score.status}).`);
