import http = require('http');
import { URL } from 'url';
import { dashboardPort } from './config/paths';
import { readLocalBinaryFile, readLocalFile } from './data/fileLoader';
import { renderMarkdown, escapeHtml } from './rendering/markdown';
import { approvalQueueView } from './views/approvalQueue';
import { actionCockpitView } from './views/actionCockpit';
import { homeView } from './views/home';
import { layout } from './views/layout';
import { leadReviewsView } from './views/leadReviews';
import { messageOptimizerView } from './views/messageOptimizer';
import { messageQueueView } from './views/messageQueue';
import { pipelineView } from './views/pipeline';
import { reportsView } from './views/reports';
import { revenueView } from './views/revenue';
import { sourcesView } from './views/sources';
import { weeklyView } from './views/weekly';
import { getActionCockpitData, getApprovalDrafts, getLeadReviewFiles, getMessageReviewQueueData, getReportFiles, getRevenueData, getSourceQualityData } from './data/dashboardData';

function main(): void {
  if (process.argv.includes('--check')) {
    runCheck();
    return;
  }

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? `localhost:${dashboardPort}`}`);
    const html = route(requestUrl);
    response.writeHead(html.status, { 'content-type': html.contentType });
    response.end(html.body);
  });

  server.listen(dashboardPort, () => {
    console.log(`Dashboard running at http://localhost:${dashboardPort}`);
    console.log('Local-only viewer. No outreach is sent.');
  });
}

function route(url: URL): { status: number; contentType: string; body: string | Buffer } {
  if (url.pathname === '/') return html(homeView());
  if (url.pathname === '/actions') return html(actionCockpitView());
  if (url.pathname === '/message-optimizer') return html(messageOptimizerView());
  if (url.pathname === '/message-queue') return html(messageQueueView());
  if (url.pathname === '/sources') return html(sourcesView());
  if (url.pathname === '/revenue') return html(revenueView());
  if (url.pathname === '/pipeline') return html(pipelineView());
  if (url.pathname === '/approval-queue') return html(approvalQueueView());
  if (url.pathname === '/lead-reviews') return html(leadReviewsView());
  if (url.pathname === '/weekly') return html(weeklyView());
  if (url.pathname === '/reports') return html(reportsView());
  if (url.pathname === '/file') return fileView(url);
  if (url.pathname === '/file-image') return fileImage(url);
  return html(layout('Not Found', '<div class="card"><h2>Not Found</h2><p class="muted">The requested page does not exist.</p></div>'), 404);
}

function fileView(url: URL): { status: number; contentType: string; body: string } {
  const file = readLocalFile(url.searchParams.get('area') ?? undefined, url.searchParams.get('path') ?? undefined);
  if (!file) {
    return html(layout('File Not Found', '<div class="card"><h2>File Not Found</h2><p class="muted">The requested local file is not available or is outside allowed dashboard directories.</p></div>'), 404);
  }

  if (file.extension === '.md') {
    return html(layout(file.name, `<article class="markdown">${renderMarkdown(file.content)}</article>`));
  }

  if (file.extension === '.json') {
    return html(layout(file.name, `<article class="markdown"><h2>${escapeHtml(file.relativePath)}</h2><pre><code>${escapeHtml(formatJson(file.content))}</code></pre></article>`));
  }

  if (file.extension === '.png') {
    const imagePath = `/file-image?area=${encodeURIComponent(file.area)}&path=${encodeURIComponent(file.relativePath)}`;
    return html(layout(file.name, `<article class="card"><h2>${escapeHtml(file.relativePath)}</h2><img src="${imagePath}" alt="${escapeHtml(file.name)}" style="max-width:100%;border:1px solid var(--line);border-radius:8px"></article>`));
  }

  return html(layout(file.name, `<article class="markdown"><h2>${escapeHtml(file.relativePath)}</h2><pre><code>${escapeHtml(file.content)}</code></pre></article>`));
}

function fileImage(url: URL): { status: number; contentType: string; body: string | Buffer } {
  const file = readLocalBinaryFile(url.searchParams.get('area') ?? undefined, url.searchParams.get('path') ?? undefined);
  if (!file) return { status: 404, contentType: 'text/plain; charset=utf-8', body: 'Image not found or not allowed.' };
  return { status: 200, contentType: file.contentType, body: file.content };
}

function html(body: string, status = 200): { status: number; contentType: string; body: string } {
  return { status, contentType: 'text/html; charset=utf-8', body };
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function runCheck(): void {
  const revenue = getRevenueData();
  const actionCockpit = getActionCockpitData();
  const messageQueue = getMessageReviewQueueData();
  const sourceQuality = getSourceQualityData();
  const approvalDrafts = getApprovalDrafts();
  const leadReviews = getLeadReviewFiles();
  const reports = getReportFiles();

  console.log('Dashboard check passed.');
  console.log(`Projected MRR: $${revenue.projectedMonthlyRecurringRevenue ?? 0}`);
  console.log(`Action cockpit actions: ${actionCockpit.summary?.totalActions ?? 0}`);
  console.log(`Message queue pending: ${messageQueue.summary?.pending_review ?? 0}`);
  console.log(`Source quality sources: ${sourceQuality.summary?.totalSources ?? 0}`);
  console.log(`Approval drafts: ${approvalDrafts.length}`);
  console.log(`Lead reviews: ${leadReviews.length}`);
  console.log(`Report files: ${reports.length}`);
}

main();
