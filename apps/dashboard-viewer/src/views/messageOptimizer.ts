import { getMessageOptimizerStatus, getOptimizedDrafts } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { commandsBlock, emptyState, layout } from './layout';

export function messageOptimizerView(): string {
  const status = getMessageOptimizerStatus();
  const drafts = getOptimizedDrafts();
  const body = `
    <div class="grid">
      <section class="card"><h2>Mode</h2><div class="metric">${escapeHtml(status.mode)}</div><p class="muted">Provider: ${escapeHtml(status.provider)}</p></section>
      <section class="card"><h2>AI Copy Enabled</h2><div class="metric">${status.aiEnabled ? 'true' : 'false'}</div><p class="muted">Fallback mode keeps workflows running without an API key.</p></section>
    </div>
    <section class="card">
      <h2>Safety Reminders</h2>
      <ul>
        <li>Review every optimized draft before sending.</li>
        <li>Do not overclaim audit findings, private access, or revenue impact.</li>
        <li>Do not automate sending, LinkedIn login, or Upwork proposals.</li>
      </ul>
      ${status.warnings.length ? `<h3>Warnings</h3><ul>${status.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}</ul>` : ''}
    </section>
    <section>
      <h2>Recent Optimized Drafts</h2>
      <div class="file-list">
        ${drafts.length ? drafts.slice(0, 12).map((file) => `<article class="file-row"><h3>${escapeHtml(file.relativePath)}</h3><p class="preview">${escapeHtml(file.preview)}</p><a class="button" href="/file?area=${file.area}&path=${encodeURIComponent(file.relativePath)}">Open draft</a></article>`).join('') : emptyState('No optimized drafts found. Run npm run lead:optimize or npm run message:optimize.')}
      </div>
    </section>
    ${commandsBlock([
      'npm run lead:optimize -- --id <leadId> --type linkedin_dm',
      'npm run lead:optimize -- --id <leadId> --type follow_up',
      'npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/<draft>.md --type follow_up',
    ])}
  `;
  return layout('Message Optimizer', body);
}
