import fs = require('fs');
import path = require('path');
import { buildCandidateQueue, buildLeadInventorySummary } from './discoveryAutomationRules';
import { LeadDiscoveryAutomationInput, LocalContextSource } from './types';
import { Lead } from '../leads/types';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery-automation');
const leadsPath = path.join(process.cwd(), 'data', 'leads.json');

function main(): void {
  const input = buildInput();
  const candidateQueuePath = path.join(outputDir, 'candidate-queue.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(candidateQueuePath, buildCandidateQueue(input), 'utf8');

  console.log(`Lead candidate queue generated: ${path.relative(process.cwd(), candidateQueuePath)}`);
  console.log(`Current leads: ${input.inventory.totalLeads}`);
  console.log(`Tier A/B/C: ${input.inventory.tierCounts.A}/${input.inventory.tierCounts.B}/${input.inventory.tierCounts.C}`);
  console.log('Candidate queue is a manual-entry template. No companies were invented or added.');
  console.log('No scraping, APIs, browser automation, CRM, outreach automation, email, LinkedIn automation, payments, credentials, or external services were used.');
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
