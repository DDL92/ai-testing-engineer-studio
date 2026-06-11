import { getLeadReviewFiles } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { emptyState, layout } from './layout';

export function leadReviewsView(): string {
  const files = getLeadReviewFiles();
  const body = `
    <h2>Lead Reviews</h2>
    <div class="file-list">
      ${files.length ? files.map((file) => `<article class="file-row"><h3>${escapeHtml(file.relativePath)}</h3><p class="preview">${escapeHtml(file.preview)}</p><a class="button" href="/file?area=${file.area}&path=${encodeURIComponent(file.relativePath)}">Open review</a></article>`).join('') : emptyState('No lead review files found. Run npm run lead:review -- --id <leadId>.')}
    </div>
  `;
  return layout('Lead Reviews', body);
}
