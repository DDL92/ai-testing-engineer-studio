import { getMarkdownSummary } from '../data/dashboardData';
import { layout } from './layout';

export function weeklyView(): string {
  const weekly = getMarkdownSummary('weekly-executive-dashboard.md');
  const body = `
    <h2>Weekly Executive Dashboard</h2>
    ${weekly.html ? `<article class="markdown">${weekly.html}</article>` : '<div class="card"><p class="muted">No weekly dashboard found. Run npm run business:weekly.</p></div>'}
  `;
  return layout('Weekly Dashboard', body);
}
