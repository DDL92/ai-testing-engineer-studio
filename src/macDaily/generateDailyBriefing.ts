import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildTopDailyActions } from '../dayPlan/dayPlanRules';
import { Lead } from '../leads/types';
import { buildRevenueSummary } from '../metrics/revenueRules';
import { DailyBriefing } from './types';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const briefingPath = path.join(process.cwd(), 'output', 'daily', 'daily-briefing.md');

export function generateDailyBriefing(): DailyBriefing {
  const leads = readJson<Lead[]>(leadsPath, []);
  const clients = readJson<Client[]>(clientsPath, []);
  const topActions = buildTopDailyActions(leads, 5);
  const revenueSummary = buildRevenueSummary(leads, clients);
  const topLead = topActions[0];

  const briefing: DailyBriefing = {
    date: new Date().toISOString().slice(0, 10),
    revenueFocus: buildRevenueFocus(revenueSummary),
    topActions,
    revenueSummary,
    generatedFiles: [
      { label: 'Daily plan', path: 'output/daily-revenue/today-plan.md' },
      { label: 'Revenue summary', path: 'output/metrics/revenue-summary.md' },
      { label: 'Daily briefing', path: 'output/daily/daily-briefing.md' },
    ],
    suggestedManualActions: buildSuggestedManualActions(topActions),
    suggestedCommands: buildSuggestedCommands(topLead?.leadId),
    safetyRules: [
      'Do not auto-send outreach.',
      'Do not send proposals or client reports without Daniel approval.',
      'Do not use credentials, scrape, submit forms, or test payment flows from this runner.',
      'Use local files only unless Daniel explicitly approves more research.',
    ],
  };

  fs.mkdirSync(path.dirname(briefingPath), { recursive: true });
  fs.writeFileSync(briefingPath, renderDailyBriefing(briefing), 'utf8');
  return briefing;
}

export function dailyBriefingOutputPath(): string {
  return briefingPath;
}

function buildRevenueFocus(revenueSummary: DailyBriefing['revenueSummary']): string[] {
  return [
    `Protect current recorded MRR: ${formatCurrency(revenueSummary.estimatedMrr)}/month.`,
    `Move the strongest retainer opportunity forward: ${revenueSummary.retainerOpportunities[0]?.companyName ?? 'none available'}.`,
    'Use today for review, audit preparation, SOW preparation, or client reporting only after manual approval.',
  ];
}

function buildSuggestedManualActions(topActions: DailyBriefing['topActions']): string[] {
  if (topActions.length === 0) return ['Review local lead data and seed or qualify leads before taking revenue action.'];

  return topActions.map((action) => `Priority ${action.priority}: ${action.suggestedManualAction}`);
}

function buildSuggestedCommands(topLeadId?: string): string[] {
  const leadId = topLeadId ?? 'lead_id';

  return [
    'npm run day:plan',
    'npm run metrics:revenue',
    `npm run lead:pack -- --id ${leadId}`,
    'npm run audit:site -- --url https://example.com',
    'npm run sow:generate -- --company PushPress',
  ];
}

function renderDailyBriefing(briefing: DailyBriefing): string {
  return `# AI Studio OS Daily Briefing

Date: ${briefing.date}

## Today's Revenue Focus

${briefing.revenueFocus.map((item) => `- ${item}`).join('\n')}

## Top Actions

${briefing.topActions.length ? briefing.topActions.map((action) => `${action.priority}. ${action.companyName} - ${action.score}/10 - ${action.recommendedOffer} - ${action.actionType}\n   - ${action.reason}`).join('\n') : '- No top actions available from local lead data.'}

## Revenue Snapshot

- Estimated MRR from local client data: ${formatCurrency(briefing.revenueSummary.estimatedMrr)}/month
- Active clients: ${briefing.revenueSummary.activeClients.length}
- Total leads: ${briefing.revenueSummary.totalLeads}
- Retainer opportunity estimate: ${formatCurrency(briefing.revenueSummary.retainerOpportunityEstimate.min)}-${formatCurrency(briefing.revenueSummary.retainerOpportunityEstimate.max)}/month
- One-time opportunity estimate: ${formatCurrency(briefing.revenueSummary.oneTimeOpportunityEstimate.min)}-${formatCurrency(briefing.revenueSummary.oneTimeOpportunityEstimate.max)}

## Files Generated

${briefing.generatedFiles.map((file) => `- ${file.label}: ${file.path}`).join('\n')}

## Suggested Manual Actions

${briefing.suggestedManualActions.map((action) => `- ${action}`).join('\n')}

## Suggested Commands

${briefing.suggestedCommands.map((command) => `- ${command}`).join('\n')}

## Safety Rules

${briefing.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}
