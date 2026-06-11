import { getSourceQualityData, SourceQualityRecordData } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { commandsBlock, emptyState, layout } from './layout';

export function sourcesView(): string {
  const report = getSourceQualityData();
  const records = report.records ?? [];
  const summary = report.summary ?? {};
  const best = [...records].sort((a, b) => b.sourceQualityScore - a.sourceQualityScore).slice(0, 5);
  const worst = [...records].sort((a, b) => a.sourceQualityScore - b.sourceQualityScore).slice(0, 5);
  const body = `
    <div class="grid">
      ${metric('Enabled', summary.enabledSources ?? 0)}
      ${metric('Excellent', summary.excellentSources ?? 0)}
      ${metric('Good', summary.goodSources ?? 0)}
      ${metric('Low Priority', summary.lowPrioritySources ?? 0)}
    </div>
    <section class="card">
      <h2>Summary</h2>
      <p><strong>Best:</strong> ${escapeHtml(summary.bestSource ?? 'Not generated.')}</p>
      <p><strong>Worst:</strong> ${escapeHtml(summary.worstSource ?? 'Not generated.')}</p>
    </section>
    ${sourceSection('Best Sources', best)}
    ${sourceSection('Worst Sources', worst)}
    <section>
      <h2>Source Metrics</h2>
      ${records.length ? `<div class="card"><table><thead><tr><th>Source</th><th>Category</th><th>Status</th><th>Score</th><th>Hot/Warm</th><th>Low/Ignored</th><th>Recommendation</th></tr></thead><tbody>${records.map(row).join('')}</tbody></table></div>` : emptyState('No source quality report found. Run npm run sources:report.')}
    </section>
    <section>
      <h2>Recommendations</h2>
      ${report.recommendations?.length ? `<div class="card"><ul>${report.recommendations.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : emptyState('No recommendations found.')}
    </section>
    ${commandsBlock([
      'npm run sources:report',
      'npm run lead:auto',
      'npm run lead:daily',
      'npm run actions:cockpit',
    ])}
  `;
  return layout('Source Quality', body);
}

function metric(label: string, value: number): string {
  return `<section class="card"><h2>${escapeHtml(label)}</h2><div class="metric">${value}</div></section>`;
}

function sourceSection(title: string, records: SourceQualityRecordData[]): string {
  return `<section><h2>${escapeHtml(title)}</h2><div class="file-list">${records.length ? records.map(card).join('') : emptyState('No sources found.')}</div></section>`;
}

function card(record: SourceQualityRecordData): string {
  return `<article class="file-row"><h3>${escapeHtml(record.name)}</h3><p class="preview">${record.sourceQualityScore}/100 - ${escapeHtml(record.sourceQualityCategory)} - ${escapeHtml(record.recommendation)}</p><p>Hot: ${record.hotLeadsFound}, Warm: ${record.warmLeadsFound}, Low/Ignored: ${record.lowLeadsFound + record.ignoredLeadsFound}</p>${record.warnings.length ? `<p>Warnings: ${escapeHtml(record.warnings.join('; '))}</p>` : ''}</article>`;
}

function row(record: SourceQualityRecordData): string {
  return `<tr><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.category)}</td><td>${record.enabled ? 'enabled' : 'disabled'}</td><td>${record.sourceQualityScore}</td><td>${record.hotLeadsFound + record.warmLeadsFound}</td><td>${record.lowLeadsFound + record.ignoredLeadsFound}</td><td>${escapeHtml(record.recommendation)}</td></tr>`;
}
