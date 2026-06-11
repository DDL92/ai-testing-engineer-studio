import { getApprovalDrafts } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { emptyState, layout } from './layout';

export function approvalQueueView(): string {
  const drafts = getApprovalDrafts();
  const body = `
    <h2>Approval Queue</h2>
    <p class="muted">Review-only. This dashboard does not send messages.</p>
    <div class="file-list">
      ${drafts.length ? drafts.map((file) => `<article class="file-row"><h3>${escapeHtml(file.relativePath)}</h3><p class="preview">${escapeHtml(file.preview)}</p><a class="button" href="/file?area=${file.area}&path=${encodeURIComponent(file.relativePath)}">Open full draft</a></article>`).join('') : emptyState('No approval queue drafts found.')}
    </div>
  `;
  return layout('Approval Queue', body);
}
