import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import type { SourceQualityRecord, SourceQualityReport } from './sourceTypes';

export function writeSourceQualityMarkdown(report: SourceQualityReport): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'source-quality-report.md');
  fs.writeFileSync(filePath, `${formatSourceQualityReport(report).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatSourceQualityReport(report: SourceQualityReport): string {
  const enabled = report.records.filter((record) => record.enabled);
  const disabled = report.records.filter((record) => !record.enabled);
  return `# Source Quality Report

Generated: ${report.generatedAt}

## Summary

- Total sources: ${report.summary.totalSources}
- Enabled sources: ${report.summary.enabledSources}
- Disabled sources: ${report.summary.disabledSources}
- Excellent sources: ${report.summary.excellentSources}
- Good sources: ${report.summary.goodSources}
- Experimental sources: ${report.summary.experimentalSources}
- Low priority sources: ${report.summary.lowPrioritySources}
- Best source: ${report.summary.bestSource}
- Worst source: ${report.summary.worstSource}

## Enabled Sources

${formatSourceList(enabled)}

## Disabled Sources

${formatSourceList(disabled)}

## Best Sources

${formatSourceList([...report.records].sort((a, b) => b.sourceQualityScore - a.sourceQualityScore).slice(0, 5))}

## Worst Sources

${formatSourceList([...report.records].sort((a, b) => a.sourceQualityScore - b.sourceQualityScore).slice(0, 5))}

## Sources With No Recent Results

${formatSourceList(report.records.filter((record) => record.totalOpportunitiesFound === 0))}

## Sources Producing Hot/Warm Leads

${formatSourceList(report.records.filter((record) => record.hotLeadsFound > 0 || record.warmLeadsFound > 0))}

## Sources Producing Low/Ignored Leads

${formatSourceList(report.records.filter((record) => record.lowLeadsFound > 0 || record.ignoredLeadsFound > 0))}

## Recommendations

${report.recommendations.length ? report.recommendations.map((item) => `- ${item}`).join('\n') : '- No recommendations yet. Run npm run lead:auto and npm run sources:report after source changes.'}

## Suggested Commands

- npm run sources:report
- npm run lead:auto
- npm run lead:daily
- npm run actions:cockpit
- Dashboard: http://localhost:4173/sources
`;
}

function formatSourceList(records: SourceQualityRecord[]): string {
  return records.length
    ? records.map((record) => `- ${record.name} (${record.id}): ${record.sourceQualityScore}/100, ${record.sourceQualityCategory}, ${record.recommendation}. Hot: ${record.hotLeadsFound}, Warm: ${record.warmLeadsFound}, Low/Ignored: ${record.lowLeadsFound + record.ignoredLeadsFound}. ${record.warnings.length ? `Warnings: ${record.warnings.join('; ')}` : ''}`).join('\n')
    : '- None.';
}
