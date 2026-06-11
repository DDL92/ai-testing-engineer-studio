import { getReportFiles } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { emptyState, layout } from './layout';

export function reportsView(): string {
  const files = getReportFiles();
  const body = `
    <h2>Audit Reports</h2>
    <div class="file-list">
      ${files.length ? files.map((file) => `<article class="file-row"><h3>${escapeHtml(file.areaLabel)} / ${escapeHtml(file.relativePath)}</h3><p class="muted">${escapeHtml(file.modifiedAt)} - ${file.size} bytes</p><a class="button" href="/file?area=${file.area}&path=${encodeURIComponent(file.relativePath)}">Open</a></article>`).join('') : emptyState('No audit report files found. Run npm run audit:sample or npm run lead:audit -- --id <leadId>.')}
    </div>
  `;
  return layout('Reports', body);
}
