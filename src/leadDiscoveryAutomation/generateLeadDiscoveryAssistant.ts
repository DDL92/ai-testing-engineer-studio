import fs = require('fs');
import path = require('path');
import {
  buildDiscoveryAssistant,
  buildLeadApprovalChecklist,
  buildLeadInventorySummary,
  buildSearchPlaybook,
  searchQueryGroups,
} from './discoveryAutomationRules';
import { LeadDiscoveryAutomationInput, LocalContextSource } from './types';
import { Lead } from '../leads/types';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery-automation');
const leadsPath = path.join(process.cwd(), 'data', 'leads.json');

function main(): void {
  const input = buildInput();
  const discoveryAssistantPath = path.join(outputDir, 'discovery-assistant.md');
  const searchPlaybookPath = path.join(outputDir, 'search-playbook.md');
  const approvalChecklistPath = path.join(outputDir, 'lead-approval-checklist.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(discoveryAssistantPath, buildDiscoveryAssistant(input), 'utf8');
  fs.writeFileSync(searchPlaybookPath, buildSearchPlaybook(input), 'utf8');
  fs.writeFileSync(approvalChecklistPath, buildLeadApprovalChecklist(input), 'utf8');

  const totalQueries = searchQueryGroups().reduce((sum, group) => sum + group.queries.length, 0);

  console.log(`Lead discovery assistant generated: ${path.relative(process.cwd(), discoveryAssistantPath)}`);
  console.log(`Search playbook generated: ${path.relative(process.cwd(), searchPlaybookPath)}`);
  console.log(`Lead approval checklist generated: ${path.relative(process.cwd(), approvalChecklistPath)}`);
  console.log(`Current leads: ${input.inventory.totalLeads}`);
  console.log(`Search queries: ${totalQueries}`);
  console.log('No companies were invented. No scraping, APIs, browser automation, CRM, outreach automation, email, LinkedIn automation, payments, credentials, or external services were used.');
  console.log('Human approval remains required before adding leads or taking external action.');
}

function buildInput(): LeadDiscoveryAutomationInput {
  const leads = readJson<Lead[]>(leadsPath, []);

  return {
    generatedAt: new Date().toISOString(),
    leads,
    inventory: buildLeadInventorySummary(leads),
    contextSources: [
      readContextSource('First 50 progress', path.join('output', 'discovery', 'first-50-progress.md')),
      readContextSource('Daily command center', path.join('output', 'operator', 'daily-command-center.md')),
      readContextSource('Dashboard', path.join('output', 'dashboard', 'dashboard.md')),
    ],
  };
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): LocalContextSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

main();
