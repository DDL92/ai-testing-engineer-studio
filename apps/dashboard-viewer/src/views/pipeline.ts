import { getLeadData, getMarkdownSummary } from '../data/dashboardData';
import { layout } from './layout';

interface LeadRecord {
  status: string;
  scoreBreakdown: { category: string };
}

export function pipelineView(): string {
  const leads = getLeadData<LeadRecord[]>('leads.json', []);
  const markdown = getMarkdownSummary('pipeline-summary.md');
  const countsByStatus = countBy(leads.map((lead) => lead.status));
  const countsByCategory = countBy(leads.map((lead) => lead.scoreBreakdown?.category ?? 'unknown'));
  const body = `
    <div class="grid">
      ${metric('Hot Leads', String(countsByCategory.hot ?? 0))}
      ${metric('Warm Leads', String(countsByCategory.warm ?? 0))}
      ${metric('Low Leads', String(countsByCategory.low ?? 0))}
      ${metric('Ignored Leads', String((countsByCategory.ignore ?? 0) + (countsByStatus.ignored ?? 0)))}
    </div>
    <section><h2>Lead Counts By Status</h2><div class="card"><ul>${Object.entries(countsByStatus).map(([status, count]) => `<li>${status}: ${count}</li>`).join('')}</ul></div></section>
    <section><h2>Lead Counts By Category</h2><div class="card"><ul>${Object.entries(countsByCategory).map(([category, count]) => `<li>${category}: ${count}</li>`).join('')}</ul></div></section>
    <section><h2>Pipeline Summary</h2>${markdown.html ? `<article class="markdown">${markdown.html}</article>` : '<div class="card"><p class="muted">No pipeline summary found.</p></div>'}</section>
  `;
  return layout('Pipeline', body);
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function metric(label: string, value: string): string {
  return `<section class="card"><p class="muted">${label}</p><div class="metric">${value}</div></section>`;
}
