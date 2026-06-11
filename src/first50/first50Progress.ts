import fs = require('fs');
import path = require('path');
import { Lead } from '../leads/types';

export type First50TierName = 'Tier A' | 'Tier B' | 'Tier C';

export interface First50TierSummary {
  tier: First50TierName;
  criteria: string;
  count: number;
  leads: Lead[];
}

export interface First50ProgressSummary {
  generatedAt: string;
  totalLeads: number;
  tierA: First50TierSummary;
  tierB: First50TierSummary;
  tierC: First50TierSummary;
}

const outputPath = path.join(process.cwd(), 'output', 'discovery', 'first-50-progress.md');

export function buildFirst50ProgressFromLeads(leads: Lead[]): First50ProgressSummary {
  const tierA = leads.filter((lead) => getLeadTier(lead) === 'Tier A');
  const tierB = leads.filter((lead) => getLeadTier(lead) === 'Tier B');
  const tierC = leads.filter((lead) => getLeadTier(lead) === 'Tier C');

  return {
    generatedAt: new Date().toISOString(),
    totalLeads: leads.length,
    tierA: {
      tier: 'Tier A',
      criteria: 'Score 8+ and actionable. Highest priority for audit, proposal, or retainer review.',
      count: tierA.length,
      leads: tierA,
    },
    tierB: {
      tier: 'Tier B',
      criteria: 'Score 6-7 and actionable. Good candidates for research, audit angle, or starter package review.',
      count: tierB.length,
      leads: tierB,
    },
    tierC: {
      tier: 'Tier C',
      criteria: 'Score 0-5, paused, lost, or not-fit. Review only if better fit evidence appears.',
      count: tierC.length,
      leads: tierC,
    },
  };
}

export function writeFirst50ProgressReport(leads: Lead[]): First50ProgressSummary {
  const progress = buildFirst50ProgressFromLeads(leads);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderFirst50ProgressReport(progress), 'utf8');
  return progress;
}

export function getFirst50ProgressReportPath(): string {
  return path.relative(process.cwd(), outputPath);
}

export function renderFirst50ProgressLines(progress: First50ProgressSummary): string[] {
  return [
    `Total Leads: ${progress.totalLeads}`,
    `Tier A Leads: ${progress.tierA.count}`,
    `Tier B Leads: ${progress.tierB.count}`,
    `Tier C Leads: ${progress.tierC.count}`,
  ];
}

function renderFirst50ProgressReport(progress: First50ProgressSummary): string {
  return `# First 50 Progress

Generated at: ${progress.generatedAt}

## Summary

- Total Leads: ${progress.totalLeads}
- Tier A Leads: ${progress.tierA.count}
- Tier B Leads: ${progress.tierB.count}
- Tier C Leads: ${progress.tierC.count}

## Tier Definitions

- Tier A: ${progress.tierA.criteria}
- Tier B: ${progress.tierB.criteria}
- Tier C: ${progress.tierC.criteria}

## Tier A Leads

${renderLeadList(progress.tierA.leads)}

## Tier B Leads

${renderLeadList(progress.tierB.leads)}

## Tier C Leads

${renderLeadList(progress.tierC.leads)}

## Safety Rules

- Counts come from local data/leads.json only.
- No demo target file is used for First-50 progress.
- No scraping, APIs, credentials, browser automation, outreach, CRM integration, or message sending is performed.
- Daniel must manually review leads before outreach, audits, proposals, or client communication.
`;
}

function renderLeadList(leads: Lead[]): string {
  if (leads.length === 0) return '- None.';

  return leads
    .map((lead) => `- ${lead.companyName}: ${lead.score}/10, ${lead.recommendedOffer}, ${lead.status}`)
    .join('\n');
}

function getLeadTier(lead: Lead): First50TierName {
  if (lead.status === 'lost' || lead.status === 'paused' || lead.recommendedOffer === 'not-fit') {
    return 'Tier C';
  }

  if (lead.score >= 8) return 'Tier A';
  if (lead.score >= 6) return 'Tier B';
  return 'Tier C';
}
