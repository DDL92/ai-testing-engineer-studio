import fs = require('fs');
import http = require('http');
import os = require('os');
import path = require('path');
import { buildPwaDashboardData, writeDashboardData } from './dashboardDataBuilder';
import { renderPwaDashboardHealth, renderPwaDashboardSummary } from './dashboardRules';

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

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderPwaDashboardSummary(data), 'utf8');
  fs.writeFileSync(healthPath, renderPwaDashboardHealth(data), 'utf8');
  ensureFrontendFiles();

  return [
    ...dataPaths,
    summaryPath,
    healthPath,
  ];
}

function startDashboardServer(mode: 'preview' | 'mobile'): void {
  const preferredPort = Number(process.env.DASHBOARD_PORT ?? 4177);
  const host = mode === 'mobile' ? '0.0.0.0' : '127.0.0.1';
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === '/' ? 'dashboard/index.html' : pathname.replace(/^\/+/, '');
    const filePath = safeResolve(process.cwd(), relativePath);

    if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }

    response.writeHead(200, { 'content-type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(response);
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
      console.log('Local network only. Connect phone to the same WiFi. Press Ctrl+C to stop.');
      return;
    }
    console.log(`Dashboard preview: http://127.0.0.1:${port}/dashboard/index.html`);
    console.log('Press Ctrl+C to stop the preview server.');
  });

  server.listen(preferredPort, host);
}

function safeResolve(root: string, relativePath: string): string | undefined {
  const resolved = path.resolve(root, relativePath);
  return resolved.startsWith(root) ? resolved : undefined;
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.md')) return 'text/markdown; charset=utf-8';
  return 'application/octet-stream';
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
