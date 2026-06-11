import { ActionCockpitAction, getActionCockpitData, getMarkdownSummary } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { commandsBlock, emptyState, layout } from './layout';

export function actionCockpitView(): string {
  const cockpit = getActionCockpitData();
  const markdown = getMarkdownSummary('action-cockpit.md');
  const summary = cockpit.summary ?? {};
  const actionGroups = Object.entries(cockpit.actionsByType ?? {}).filter(([, actions]) => actions.length > 0);

  const body = `
    <div class="grid">
      ${metric('Actionable', String(summary.actionableActions ?? 0))}
      ${metric('Blocked', String(summary.blockedActions ?? 0))}
      ${metric('Revenue Impact', `$${summary.totalExpectedRevenueImpact ?? 0}`)}
      ${metric('Total Actions', String(summary.totalActions ?? 0))}
    </div>
    <section class="card">
      <h2>Executive Summary</h2>
      <p><strong>Highest priority:</strong> ${escapeHtml(summary.highestPriorityAction ?? 'No action cockpit generated.')}</p>
      <p><strong>Main bottleneck:</strong> ${escapeHtml(summary.mainBottleneck ?? 'Run npm run actions:cockpit.')}</p>
      <p><strong>Best revenue opportunity:</strong> ${escapeHtml(summary.bestRevenueOpportunity ?? 'No active opportunity detected.')}</p>
      <div class="toolbar">
        <a class="button" href="/file?area=generated&path=action-cockpit.md">Markdown</a>
        <a class="button" href="/file?area=leadData&path=action-cockpit.json">JSON</a>
        <a class="button" href="/pipeline">Pipeline</a>
        <a class="button" href="/revenue">Revenue</a>
      </div>
    </section>
    <section>
      <h2>Top 10 Actions</h2>
      ${cockpit.topActions?.length ? `<div class="file-list">${cockpit.topActions.slice(0, 10).map(actionCard).join('')}</div>` : emptyState('No action cockpit found. Run npm run actions:cockpit.')}
    </section>
    <section>
      <h2>Action Groups</h2>
      ${actionGroups.length ? actionGroups.map(([type, actions]) => `<section class="card"><h3>${escapeHtml(type)}</h3><ul>${actions.slice(0, 8).map((action) => `<li>${escapeHtml(action.companyName)} - ${escapeHtml(action.priority)} - $${action.expectedRevenueImpact}. <code>${escapeHtml(action.suggestedCommand)}</code></li>`).join('')}</ul></section>`).join('') : emptyState('No grouped actions available.')}
    </section>
    <section>
      <h2>Blocked Leads</h2>
      ${cockpit.blockedLeads?.length ? `<div class="file-list">${cockpit.blockedLeads.map(actionCard).join('')}</div>` : emptyState('No blocked leads.')}
    </section>
    <section>
      <h2>Daily Operating Sequence</h2>
      ${cockpit.dailyOperatingSequence?.length ? `<div class="card"><ol>${cockpit.dailyOperatingSequence.map((step) => `<li><strong>${escapeHtml(step.title)}</strong><br><code>${escapeHtml(step.command)}</code><br><span class="muted">${escapeHtml(step.reason)}</span></li>`).join('')}</ol></div>` : emptyState('No operating sequence found.')}
    </section>
    <section><h2>Markdown Report</h2>${markdown.html ? `<article class="markdown">${markdown.html}</article>` : emptyState('No action cockpit markdown found.')}</section>
    ${commandsBlock([
      'npm run actions:cockpit',
      'npm run lead:review -- --id <leadId>',
      'npm run lead:enrich -- --id <leadId> --email "founder@example.com"',
      'npm run lead:audit -- --id <leadId>',
      'npm run lead:proposal -- --id <leadId>',
      'npm run lead:followups:due',
      'npm run lead:convert -- --id <leadId> --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"',
      'npm run lead:close -- --id <leadId> --result lost --reason no_response --note "No response after follow-up sequence"',
    ])}
  `;

  return layout('Action Cockpit', body);
}

function metric(label: string, value: string): string {
  return `<section class="card"><h2>${escapeHtml(label)}</h2><div class="metric">${escapeHtml(value)}</div></section>`;
}

function actionCard(action: ActionCockpitAction): string {
  const links = [
    action.relatedReviewPath ? `<a class="button" href="/file?area=generated&path=${encodeURIComponent(action.relatedReviewPath.replace('sales-marketing-engine/operator/generated/', ''))}">Review</a>` : '',
    action.relatedDraftPath ? `<a class="button" href="/file?area=approvalQueue&path=${encodeURIComponent(action.relatedDraftPath.replace('sales-marketing-engine/operator/approval-queue/', ''))}">Draft</a>` : '',
    action.relatedAuditPath ? `<a class="button" href="/file?area=leadReports&path=${encodeURIComponent(action.relatedAuditPath.replace('reports/leads/', ''))}">Audit</a>` : '',
  ].filter(Boolean).join('');

  return `<article class="file-row">
    <h3>${escapeHtml(action.companyName)} (${escapeHtml(action.leadId)})</h3>
    <p class="preview">${escapeHtml(action.priority)} - ${escapeHtml(action.actionType)} - ${action.score}/${escapeHtml(action.category)} - expected $${action.expectedRevenueImpact}</p>
    <p>${escapeHtml(action.reason)}</p>
    ${action.blockedReason ? `<p><strong>Blocked:</strong> ${escapeHtml(action.blockedReason)}</p>` : ''}
    <pre><code>${escapeHtml(action.suggestedCommand)}</code></pre>
    ${action.optimizeCommand ? `<p class="muted">Optional optimizer:</p><pre><code>${escapeHtml(action.optimizeCommand)}</code></pre>` : ''}
    ${action.messageQueueCommand ? `<p class="muted">Message queue${action.messageQueueStatus ? ` (${escapeHtml(action.messageQueueStatus)})` : ''}:</p><pre><code>${escapeHtml(action.messageQueueCommand)}</code></pre><p class="preview">${escapeHtml(action.messageQueueReason ?? '')}</p>` : ''}
    <div class="toolbar">${links}<a class="button" href="/pipeline">Pipeline</a><a class="button" href="/revenue">Revenue</a></div>
  </article>`;
}
