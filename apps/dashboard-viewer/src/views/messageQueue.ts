import { getMessageReviewQueueData, MessageReviewItemData } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { commandsBlock, emptyState, layout } from './layout';

export function messageQueueView(): string {
  const queue = getMessageReviewQueueData();
  const items = queue.items ?? [];
  const summary = queue.summary ?? {};
  const recent = items
    .flatMap((item) => item.statusHistory.map((history) => ({ item, history })))
    .sort((a, b) => b.history.changedAt.localeCompare(a.history.changedAt))
    .slice(0, 10);

  const body = `
    <div class="grid">
      ${metric('Pending', summary.pending_review ?? 0)}
      ${metric('Approved', summary.approved ?? 0)}
      ${metric('Needs Edit', summary.needs_edit ?? 0)}
      ${metric('Rejected', summary.rejected ?? 0)}
      ${metric('Sent', summary.sent ?? 0)}
      ${metric('Archived', summary.archived ?? 0)}
    </div>
    ${section('Pending Review', items.filter((item) => item.status === 'pending_review'))}
    ${section('Approved But Not Sent', items.filter((item) => item.status === 'approved'))}
    ${section('Needs Edit', items.filter((item) => item.status === 'needs_edit'))}
    ${section('Sent', items.filter((item) => item.status === 'sent').slice(0, 20))}
    <section>
      <h2>Recent Status Changes</h2>
      ${recent.length ? `<div class="card"><ul>${recent.map(({ item, history }) => `<li>${escapeHtml(history.changedAt)} - ${escapeHtml(item.fileName)} -> ${escapeHtml(history.status)}. ${escapeHtml(history.note || 'No note.')}</li>`).join('')}</ul></div>` : emptyState('No status changes found.')}
    </section>
    ${commandsBlock([
      'npm run message:queue',
      'npm run message:review -- --file <draft-file> --status approved --note "Reviewed"',
      'npm run message:review -- --file <draft-file> --status needs_edit --note "Shorten CTA"',
      'npm run message:sent -- --file <draft-file> --channel linkedin --note "Sent manually"',
      'npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/<draft-file> --type follow_up',
      'npm run lead:optimize -- --id <leadId> --type linkedin_dm',
    ])}
  `;
  return layout('Message Review Queue', body);
}

function metric(label: string, value: number): string {
  return `<section class="card"><h2>${escapeHtml(label)}</h2><div class="metric">${value}</div></section>`;
}

function section(title: string, items: MessageReviewItemData[]): string {
  return `<section><h2>${escapeHtml(title)}</h2><div class="file-list">${items.length ? items.map(itemCard).join('') : emptyState(`No ${title.toLowerCase()} messages.`)}</div></section>`;
}

function itemCard(item: MessageReviewItemData): string {
  return `<article class="file-row">
    <h3>${escapeHtml(item.fileName)}</h3>
    <p class="preview">${escapeHtml(item.messageType)} / ${escapeHtml(item.channel)}${item.leadId ? ` / ${escapeHtml(item.leadId)}` : ''}</p>
    <p>Status: <strong>${escapeHtml(item.status)}</strong>. Warnings: ${item.qualityWarnings.length}. Note: ${escapeHtml(item.note || 'None.')}</p>
    <div class="toolbar">
      <a class="button" href="/file?area=approvalQueue&path=${encodeURIComponent(item.fileName)}">Open draft</a>
    </div>
    <pre><code>npm run message:review -- --file ${escapeHtml(item.fileName)} --status approved --note "Reviewed"</code></pre>
    <pre><code>npm run message:sent -- --file ${escapeHtml(item.fileName)} --channel ${item.channel === 'unknown' ? 'linkedin' : escapeHtml(item.channel)} --note "Sent manually"</code></pre>
  </article>`;
}
