import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { renderFirst50ProgressLines, writeFirst50ProgressReport } from '../first50/first50Progress';
import { Lead } from '../leads/types';
import { buildActionCockpit } from './cockpitRules';
import { ActionCockpit } from './types';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputDir = path.join(process.cwd(), 'output', 'cockpit');
const markdownPath = path.join(outputDir, 'action-cockpit.md');
const htmlPath = path.join(outputDir, 'action-cockpit.html');

function main(): void {
  const leads = readJson<Lead[]>(leadsPath, []);
  const clients = readJson<Client[]>(clientsPath, []);
  writeFirst50ProgressReport(leads);
  const cockpit = buildActionCockpit(leads, clients);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(cockpit), 'utf8');
  fs.writeFileSync(htmlPath, renderHtml(cockpit), 'utf8');

  console.log(`Action cockpit generated: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Static HTML generated: ${path.relative(process.cwd(), htmlPath)}`);
  console.log(`Estimated MRR: ${formatCurrency(cockpit.revenueSnapshot.estimatedMrr)}/month`);
  console.log(`Top leads: ${cockpit.topLeads.length}`);
  console.log('No APIs, server, auth, dashboards, outreach, scraping, or credentials were used.');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderMarkdown(cockpit: ActionCockpit): string {
  return `# AI Studio OS Action Cockpit

Date: ${cockpit.date}

## Today's Focus

${cockpit.todayFocus.map((item) => `- ${item}`).join('\n')}

## Revenue Snapshot

- Estimated MRR from active retainer clients: ${formatCurrency(cockpit.revenueSnapshot.estimatedMrr)}/month
- Active clients: ${cockpit.revenueSnapshot.activeClientCount}
- Total leads: ${cockpit.revenueSnapshot.totalLeadCount}
- ${renderFirst50ProgressLines(cockpit.revenueSnapshot.first50Progress).join('\n- ')}
- Top retainer opportunities: ${cockpit.revenueSnapshot.topRetainerOpportunities.length}

${cockpit.revenueSnapshot.topRetainerOpportunities.length ? cockpit.revenueSnapshot.topRetainerOpportunities.map((lead) => `- ${lead.companyName}: ${lead.score}/10, ${lead.recommendedOffer}`).join('\n') : '- No retainer opportunities available.'}

## Top Leads

${cockpit.topLeads.length ? cockpit.topLeads.map((lead, index) => `${index + 1}. ${lead.companyName} - ${lead.score}/10 - ${lead.recommendedOffer} - ${lead.status}\n   - Next action: ${lead.nextAction}`).join('\n') : '- No actionable leads available.'}

## Active Clients

${cockpit.activeClients.length ? cockpit.activeClients.map((client) => `- ${client.companyName}: ${client.serviceType}, ${client.status}, ${formatCurrency(client.monthlyFee || 0)}/month\n  - Current focus: ${client.currentFocus}`).join('\n') : '- No active clients available.'}

## Generated Files

${cockpit.generatedFiles.length ? cockpit.generatedFiles.map((file) => `- ${file.label}: ${file.path}`).join('\n') : '- No generated files found.'}

## Next Manual Actions

${cockpit.nextManualActions.map((action) => `- ${action}`).join('\n')}

## Recommended Commands

${cockpit.recommendedCommands.map((command) => `- ${command}`).join('\n')}

## Safety Rules

${cockpit.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderHtml(cockpit: ActionCockpit): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Studio OS Action Cockpit</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 32px; line-height: 1.5; color: #202124; background: #f7f7f4; }
    main { max-width: 980px; margin: 0 auto; background: #fff; padding: 28px; border: 1px solid #ddd; }
    h1, h2 { color: #111; }
    code { background: #f0f0f0; padding: 2px 5px; border-radius: 4px; }
    .metric { font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>AI Studio OS Action Cockpit</h1>
    <p>Date: ${escapeHtml(cockpit.date)}</p>
    <h2>Today's Focus</h2>
    ${htmlList(cockpit.todayFocus)}
    <h2>Revenue Snapshot</h2>
    <ul>
      <li><span class="metric">Estimated MRR:</span> ${formatCurrency(cockpit.revenueSnapshot.estimatedMrr)}/month</li>
      <li><span class="metric">Active clients:</span> ${cockpit.revenueSnapshot.activeClientCount}</li>
      <li><span class="metric">Total leads:</span> ${cockpit.revenueSnapshot.totalLeadCount}</li>
      <li><span class="metric">Tier A leads:</span> ${cockpit.revenueSnapshot.first50Progress.tierA.count}</li>
      <li><span class="metric">Tier B leads:</span> ${cockpit.revenueSnapshot.first50Progress.tierB.count}</li>
      <li><span class="metric">Tier C leads:</span> ${cockpit.revenueSnapshot.first50Progress.tierC.count}</li>
      <li><span class="metric">Top retainer opportunities:</span> ${cockpit.revenueSnapshot.topRetainerOpportunities.length}</li>
    </ul>
    <h2>Top Leads</h2>
    ${htmlList(cockpit.topLeads.map((lead) => `${lead.companyName} - ${lead.score}/10 - ${lead.recommendedOffer} - ${lead.status}`))}
    <h2>Active Clients</h2>
    ${htmlList(cockpit.activeClients.map((client) => `${client.companyName} - ${client.serviceType} - ${formatCurrency(client.monthlyFee || 0)}/month`))}
    <h2>Generated Files</h2>
    ${htmlList(cockpit.generatedFiles.map((file) => `${file.label}: ${file.path}`))}
    <h2>Next Manual Actions</h2>
    ${htmlList(cockpit.nextManualActions)}
    <h2>Recommended Commands</h2>
    ${htmlList(cockpit.recommendedCommands.map((command) => `<code>${escapeHtml(command)}</code>`), false)}
    <h2>Safety Rules</h2>
    ${htmlList(cockpit.safetyRules)}
  </main>
</body>
</html>
`;
}

function htmlList(items: string[], shouldEscape = true): string {
  if (items.length === 0) return '<p>None.</p>';
  return `<ul>${items.map((item) => `<li>${shouldEscape ? escapeHtml(item) : item}</li>`).join('')}</ul>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

main();
