import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildFirst50ProgressFromLeads } from '../first50/first50Progress';
import { Lead } from '../leads/types';
import { ActionCockpit, GeneratedOutputReference } from './types';

export function buildActionCockpit(leads: Lead[], clients: Client[]): ActionCockpit {
  const topLeads = actionableLeads(leads).slice(0, 5);
  const first50Progress = buildFirst50ProgressFromLeads(leads);
  const activeClients = clients.filter((client) => client.status === 'active');
  const topRetainerOpportunities = topLeads.filter((lead) => lead.recommendedOffer === 'qa-automation-retainer' || lead.recommendedOffer === 'agency-partner-retainer');
  const estimatedMrr = activeClients
    .filter((client) => client.serviceType === 'qa-automation-retainer' || client.serviceType === 'agency-partner-retainer')
    .reduce((total, client) => total + (client.monthlyFee || 0), 0);
  const topLeadId = topLeads[0]?.id ?? 'lead_id';
  const activeClientId = activeClients[0]?.id ?? 'client_id';

  return {
    date: new Date().toISOString().slice(0, 10),
    todayFocus: [
      `Protect current recorded MRR: ${formatCurrency(estimatedMrr)}/month.`,
      `Move top lead forward: ${topLeads[0]?.companyName ?? 'No actionable lead available'}.`,
      'Use the cockpit for review, not automatic outreach.',
    ],
    revenueSnapshot: {
      estimatedMrr,
      activeClientCount: activeClients.length,
      totalLeadCount: leads.length,
      first50Progress,
      topRetainerOpportunities,
    },
    topLeads,
    activeClients,
    generatedFiles: existingOutputReferences(),
    nextManualActions: nextManualActions(topLeads, activeClients),
    recommendedCommands: [
      'npm run mac:daily',
      'npm run day:plan',
      'npm run metrics:revenue',
      `npm run lead:pack -- --id ${topLeadId}`,
      'npm run audit:site -- --url https://example.com',
      `npm run sow:generate -- --id ${topLeadId}`,
      `npm run client:report -- --id ${activeClientId}`,
    ],
    safetyRules: [
      'Do not auto-send outreach.',
      'Daniel approves all client communication.',
      'Do not use credentials, scrape, submit forms, or test payment flows from this cockpit.',
      'Revenue values come only from local data and lead opportunity estimates are not booked revenue.',
      'No APIs, dashboards, servers, auth, databases, or external services are used.',
    ],
  };
}

function actionableLeads(leads: Lead[]): Lead[] {
  return leads
    .filter((lead) => lead.status !== 'lost' && lead.status !== 'paused' && lead.recommendedOffer !== 'not-fit')
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.companyName.localeCompare(b.companyName);
    });
}

function nextManualActions(topLeads: Lead[], activeClients: Client[]): string[] {
  const actions: string[] = [];

  if (activeClients[0]) {
    actions.push(`Review client report needs for ${activeClients[0].companyName}.`);
  }

  if (topLeads[0]) {
    actions.push(`Review lead pack or audit angle for ${topLeads[0].companyName}.`);
  }

  if (topLeads[1]) {
    actions.push(`Prepare a manual next step for ${topLeads[1].companyName}.`);
  }

  actions.push('Run or review the daily briefing before any outreach or proposal work.');
  return actions;
}

function existingOutputReferences(): GeneratedOutputReference[] {
  const candidates: GeneratedOutputReference[] = [
    { label: 'Daily briefing', path: 'output/daily/daily-briefing.md', type: 'file' },
    { label: 'Day plan', path: 'output/day-plan.md', type: 'file' },
    { label: 'Revenue summary', path: 'output/metrics/revenue-summary.md', type: 'file' },
    { label: 'First 50 progress', path: 'output/discovery/first-50-progress.md', type: 'file' },
    { label: 'Lead packs', path: 'output/lead-packs', type: 'directory' },
    { label: 'Audits', path: 'output/audits', type: 'directory' },
    { label: 'SOWs', path: 'output/sows', type: 'directory' },
    { label: 'Client reports', path: 'output/client-reports', type: 'directory' },
  ];

  return candidates.filter((candidate) => fs.existsSync(path.join(process.cwd(), candidate.path)));
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}
