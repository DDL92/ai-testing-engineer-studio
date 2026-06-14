import fs = require('fs');
import http = require('http');
import os = require('os');
import path = require('path');
import { buildPwaDashboardData, writeDashboardData } from './dashboardDataBuilder';
import { renderPwaDashboardHealth, renderPwaDashboardSummary } from './dashboardRules';
import { resolveDashboardAsset } from '../securityBoundary/securityRules';

const outputDir = path.join(process.cwd(), 'output', 'dashboard');
const dashboardDir = path.join(process.cwd(), 'dashboard');

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--preview') || args.includes('--mobile')) {
    buildDashboard();
    startDashboardServer(args.includes('--mobile') ? 'mobile' : 'preview');
    return;
  }

  const mode = args.includes('--build') ? 'built' : 'generated';
  const outputPaths = buildDashboard();
  console.log(`Dashboard ${mode}:`);
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log('Read-only PWA dashboard. No outreach, emails, proposals, invoices, payments, data edits, or external actions were performed.');
}

function buildDashboard(): string[] {
  const data = buildPwaDashboardData();
  const dataPaths = writeDashboardData(data);
  const summaryPath = path.join(outputDir, 'dashboard-summary.md');
  const healthPath = path.join(outputDir, 'dashboard-health.md');
  const legacyMarkdownPath = path.join(outputDir, 'dashboard.md');
  const legacyHtmlPath = path.join(outputDir, 'dashboard.html');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderPwaDashboardSummary(data), 'utf8');
  fs.writeFileSync(healthPath, renderPwaDashboardHealth(data), 'utf8');
  fs.writeFileSync(legacyMarkdownPath, renderLegacyDashboardMarkdown(data), 'utf8');
  fs.writeFileSync(legacyHtmlPath, renderLegacyDashboardHtml(data), 'utf8');
  ensureFrontendFiles();

  return [
    ...dataPaths,
    summaryPath,
    healthPath,
    legacyMarkdownPath,
    legacyHtmlPath,
  ];
}

function renderLegacyDashboardMarkdown(data: ReturnType<typeof buildPwaDashboardData>): string {
  const topAction = data.today.topActions[0];

  return [
    '# Studio Dashboard',
    '',
    `Generated: ${data.generatedAt}`,
    '',
    '## Revenue Intelligence Source Of Truth',
    renderList([
      `Today Focus: ${data.commercialUx.todayFocus}`,
      `Revenue Hero: ${data.commercialUx.revenueHero}`,
      `Potential Value: ${data.commercialUx.potentialValue}`,
      `Next Action: ${data.commercialUx.nextAction}`,
      `Top Lead: ${data.revenueIntelligence.currentTopLead}`,
      `Recommended Offer: ${data.revenueIntelligence.recommendedOffer}`,
      `Revenue Target: ${data.revenueIntelligence.revenueTarget}`,
      `Execution Priority: ${data.revenueIntelligence.executionPriority}`,
      `Next Action: ${data.leadIntelligence.recommendedNextAction}`,
      `Top Lead Audit Status: ${data.topLeadAudit.topLeadAuditStatus}`,
      `Evidence Status: ${data.topLeadAudit.evidenceStatus}`,
      `Proposal Status: ${data.topLeadAudit.proposalStatus}`,
      `Execution Readiness: ${data.topLeadAudit.executionReadiness}`,
      `Evidence Engine Status: ${data.evidenceEngine.evidenceStatus}`,
      `Lighthouse Status: ${data.evidenceEngine.lighthouseStatus}`,
      `Screenshot Status: ${data.evidenceEngine.screenshotStatus}`,
      `Readiness Status: ${data.evidenceEngine.readinessStatus}`,
      `Outcomes Recorded: ${data.outcomeLearning.outcomesRecorded}`,
      `Reply Rate: ${data.outcomeLearning.replyRate}`,
      `Proposal Rate: ${data.outcomeLearning.proposalRate}`,
      `Win Rate: ${data.outcomeLearning.winRate}`,
      `Top Performing Offer: ${data.outcomeLearning.topPerformingOffer}`,
      `Adaptive Learning Status: ${data.adaptiveRevenue.adaptiveLearningStatus}`,
      `Best Performing Category: ${data.adaptiveRevenue.bestPerformingCategory}`,
      `Best Performing Offer: ${data.adaptiveRevenue.bestPerformingOffer}`,
      `Learning Influence: ${data.adaptiveRevenue.learningInfluence}`,
    ]),
    '',
    '## Today',
    renderList([
      `Top Action: ${topAction?.title ?? 'No action found'}`,
      `Why: ${topAction?.whyItMatters ?? 'No reason found'}`,
      `Next Step: ${topAction?.nextStep ?? 'No next step found'}`,
    ]),
    '',
    '## Safety',
    renderList([
      'Read-only dashboard.',
      'No outreach, emails, proposals, invoices, payments, meetings, outcomes, or revenue were created.',
      'Human approval remains required before external action.',
    ]),
    '',
  ].join('\n');
}

function renderLegacyDashboardHtml(data: ReturnType<typeof buildPwaDashboardData>): string {
  const topAction = data.today.topActions[0];
  const rows = [
    ['Today Focus', data.commercialUx.todayFocus],
    ['Revenue Hero', data.commercialUx.revenueHero],
    ['Potential Value', data.commercialUx.potentialValue],
    ['Next Action', data.commercialUx.nextAction],
    ['Top Lead', data.revenueIntelligence.currentTopLead],
    ['Recommended Offer', data.revenueIntelligence.recommendedOffer],
    ['Revenue Target', data.revenueIntelligence.revenueTarget],
    ['Execution Priority', data.revenueIntelligence.executionPriority],
    ['Next Action', data.leadIntelligence.recommendedNextAction],
    ['Top Lead Audit Status', data.topLeadAudit.topLeadAuditStatus],
    ['Evidence Status', data.topLeadAudit.evidenceStatus],
    ['Proposal Status', data.topLeadAudit.proposalStatus],
    ['Execution Readiness', data.topLeadAudit.executionReadiness],
    ['Evidence Engine Status', data.evidenceEngine.evidenceStatus],
    ['Lighthouse Status', data.evidenceEngine.lighthouseStatus],
    ['Screenshot Status', data.evidenceEngine.screenshotStatus],
    ['Readiness Status', data.evidenceEngine.readinessStatus],
    ['Outcomes Recorded', String(data.outcomeLearning.outcomesRecorded)],
    ['Reply Rate', data.outcomeLearning.replyRate],
    ['Proposal Rate', data.outcomeLearning.proposalRate],
    ['Win Rate', data.outcomeLearning.winRate],
    ['Top Performing Offer', data.outcomeLearning.topPerformingOffer],
    ['Adaptive Learning Status', data.adaptiveRevenue.adaptiveLearningStatus],
    ['Best Performing Category', data.adaptiveRevenue.bestPerformingCategory],
    ['Best Performing Offer', data.adaptiveRevenue.bestPerformingOffer],
    ['Learning Influence', data.adaptiveRevenue.learningInfluence],
    ['Top Action', topAction?.title ?? 'No action found'],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Studio Dashboard</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 2rem; color: #172026; background: #f7f8fa; }
    main { max-width: 880px; margin: 0 auto; background: white; border: 1px solid #d8dee4; border-radius: 8px; padding: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #d8dee4; padding: 0.75rem; text-align: left; vertical-align: top; }
    th { width: 34%; color: #475569; }
  </style>
</head>
<body>
  <main>
    <h1>Studio Dashboard</h1>
    <p>Generated: ${escapeHtml(data.generatedAt)}</p>
    <h2>Revenue Intelligence Source Of Truth</h2>
    <table>
      <tbody>
        ${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('\n        ')}
      </tbody>
    </table>
    <h2>Safety</h2>
    <p>Read-only dashboard. Human approval remains required before external action.</p>
  </main>
</body>
</html>
`;
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function startDashboardServer(mode: 'preview' | 'mobile'): void {
  const preferredPort = Number(process.env.DASHBOARD_PORT ?? 4177);
  const host = mode === 'mobile' ? '0.0.0.0' : '127.0.0.1';
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);

    // Security boundary: the mobile server exposes only static assets from dashboard/.
    // It must never serve process.cwd(), data/, output/, dotfiles, package files, or source files.
    const asset = resolveDashboardAsset(dashboardDir, requestUrl.pathname);

    if (!asset.allowed || !asset.filePath || !asset.contentType) {
      response.writeHead(asset.status, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(asset.reason);
      return;
    }

    response.writeHead(200, { 'content-type': asset.contentType });
    fs.createReadStream(asset.filePath).pipe(response);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      server.listen(0, host);
      return;
    }
    throw error;
  });

  server.on('listening', () => {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : preferredPort;
    if (mode === 'mobile') {
      console.log('Dashboard mobile server:');
      for (const ip of localNetworkIps()) {
        console.log(`- http://${ip}:${port}/dashboard/index.html`);
      }
      console.log(`- http://127.0.0.1:${port}/dashboard/index.html`);
      console.log('Trusted Wi-Fi only. Connect phone to the same trusted network. Press Ctrl+C to stop.');
      return;
    }
    console.log(`Dashboard preview: http://127.0.0.1:${port}/dashboard/index.html`);
    console.log('Press Ctrl+C to stop the preview server.');
  });

  server.listen(preferredPort, host);
}

function ensureFrontendFiles(): void {
  const required = ['index.html', 'styles.css', 'app.js', 'manifest.json'];
  const missing = required.filter((fileName) => !fs.existsSync(path.join(dashboardDir, fileName)));
  if (missing.length > 0) {
    throw new Error(`Dashboard frontend files are missing: ${missing.join(', ')}`);
  }
}

function localNetworkIps(): string[] {
  const interfaces = os.networkInterfaces();
  return Object.values(interfaces)
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === 'IPv4' && !item.internal)
    .map((item) => item.address);
}

main();
