import { getRevenueData, getMarkdownSummary } from '../data/dashboardData';
import { escapeHtml } from '../rendering/markdown';
import { layout } from './layout';

export function revenueView(): string {
  const revenue = getRevenueData();
  const markdown = getMarkdownSummary('revenue-summary.md');
  const lostReasons = revenue.lostLeadsByReason ?? {};
  const body = `
    <div class="grid">
      ${metric('Projected MRR', `$${revenue.projectedMonthlyRecurringRevenue ?? 0}`)}
      ${metric('Progress to $3,000', `${revenue.progressTo3000 ?? 0}%`)}
      ${metric('Progress to $5,000', `${revenue.progressTo5000 ?? 0}%`)}
      ${metric('One-Time This Month', `$${revenue.projectedOneTimeRevenueThisMonth ?? 0}`)}
    </div>
    <div class="grid">
      ${metric('Clients Needed at $500/mo', String(revenue.clientsNeededAt500 ?? 0))}
      ${metric('Clients Needed at $1,000/mo', String(revenue.clientsNeededAt1000 ?? 0))}
      ${metric('Clients Needed at $1,500/mo', String(revenue.clientsNeededAt1500 ?? 0))}
    </div>
    <section><h2>Won Clients</h2><div class="card">${revenue.wonClients?.length ? `<ul>${revenue.wonClients.map((client) => `<li>${escapeHtml(client.companyName)} - $${client.projectedMonthlyRevenue}/month, $${client.projectedOneTimeRevenue} one-time</li>`).join('')}</ul>` : '<p class="muted">No won clients recorded.</p>'}</div></section>
    <section><h2>Lost Reasons</h2><div class="card">${Object.keys(lostReasons).length ? `<ul>${Object.entries(lostReasons).map(([reason, count]) => `<li>${escapeHtml(reason)}: ${count}</li>`).join('')}</ul>` : '<p class="muted">No lost reasons recorded.</p>'}</div></section>
    <section><h2>Full Revenue Summary</h2>${markdown.html ? `<article class="markdown">${markdown.html}</article>` : '<div class="card"><p class="muted">No revenue summary found.</p></div>'}</section>
  `;
  return layout('Revenue', body);
}

function metric(label: string, value: string): string {
  return `<section class="card"><p class="muted">${escapeHtml(label)}</p><div class="metric">${escapeHtml(value)}</div></section>`;
}
