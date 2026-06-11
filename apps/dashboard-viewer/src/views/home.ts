import { getDailyData, getMarkdownSummary } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { commandsBlock, emptyState, layout } from './layout';

export function homeView(): string {
  const daily = getMarkdownSummary('daily-lead-summary.md');
  const pipeline = getMarkdownSummary('pipeline-summary.md');
  const actions = getMarkdownSummary('action-cockpit.md');
  const revenue = getMarkdownSummary('revenue-summary.md');
  const weekly = getMarkdownSummary('weekly-executive-dashboard.md');
  const dailyData = getDailyData();

  const body = `
    <div class="grid">
      <section class="card"><h2>Daily Summary</h2>${daily.preview ? `<p>${escapeHtml(daily.preview)}</p><a class="button" href="/file?area=generated&path=daily-lead-summary.md">Open</a>` : '<p class="muted">No daily summary yet.</p>'}</section>
      <section class="card"><h2>Action Cockpit</h2>${actions.preview ? `<p>${escapeHtml(actions.preview)}</p><a class="button" href="/actions">Open</a>` : '<p class="muted">No action cockpit yet.</p>'}</section>
      <section class="card"><h2>Message Optimizer</h2><p>Optional AI-assisted copy review with deterministic fallback.</p><a class="button" href="/message-optimizer">Open</a></section>
      <section class="card"><h2>Message Queue</h2><p>Review, approve, reject, or mark messages sent from CLI-managed local metadata.</p><a class="button" href="/message-queue">Open</a></section>
      <section class="card"><h2>Source Quality</h2><p>Compare public and manual lead sources by lead quality and conversion signals.</p><a class="button" href="/sources">Open</a></section>
      <section class="card"><h2>Pipeline</h2>${pipeline.preview ? `<p>${escapeHtml(pipeline.preview)}</p><a class="button" href="/file?area=generated&path=pipeline-summary.md">Open</a>` : '<p class="muted">No pipeline summary yet.</p>'}</section>
      <section class="card"><h2>Revenue</h2>${revenue.preview ? `<p>${escapeHtml(revenue.preview)}</p><a class="button" href="/revenue">Open</a>` : '<p class="muted">No revenue summary yet.</p>'}</section>
      <section class="card"><h2>Weekly Dashboard</h2>${weekly.preview ? `<p>${escapeHtml(weekly.preview)}</p><a class="button" href="/weekly">Open</a>` : '<p class="muted">No weekly dashboard yet.</p>'}</section>
    </div>
    <section>
      <h2>Top Recommended Actions</h2>
      ${dailyData.topRecommendedActions?.length ? `<div class="card"><ul>${dailyData.topRecommendedActions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ul></div>` : emptyState('No top actions found. Run npm run lead:daily.')}
    </section>
    ${commandsBlock([
      'npm run lead:daily',
      'npm run actions:cockpit',
      'npm run lead:optimize -- --id <leadId> --type linkedin_dm',
      'npm run message:queue',
      'npm run sources:report',
      'npm run lead:pipeline',
      'npm run revenue:summary',
      'npm run business:weekly',
      'npm run lead:review -- --id <leadId>',
      'npm run lead:audit -- --id <leadId>',
      'npm run lead:enrich -- --id <leadId> --email "..."',
      'npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"',
      'npm run lead:convert -- --id <leadId> --offer monthly_qa_maintenance --amount 1000 --note "Closed client"',
      'npm run lead:close -- --id <leadId> --result lost --reason no_response --note "No response after follow-up sequence"',
    ])}
  `;
  return layout('Command Center', body);
}
