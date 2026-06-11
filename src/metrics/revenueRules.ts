import { Client, ClientServiceType, ClientStatus } from '../clientReports/types';
import { Lead, LeadStatus, RecommendedOffer } from '../leads/types';
import { CurrencyRange, RevenueAction, RevenueSummary, offerRanges } from './types';

const leadStatuses: LeadStatus[] = ['new', 'reviewing', 'audit-ready', 'contacted', 'call-booked', 'proposal-sent', 'won', 'lost', 'paused'];
const clientServiceTypes: ClientServiceType[] = ['qa-audit', 'playwright-starter-pack', 'qa-automation-retainer', 'agency-partner-retainer'];
const clientStatuses: ClientStatus[] = ['active', 'paused', 'completed', 'at-risk'];

export function buildRevenueSummary(leads: Lead[], clients: Client[]): RevenueSummary {
  const activeClients = clients.filter((client) => client.status === 'active');
  const topScoredLeads = topLeads(leads);
  const retainerOpportunities = topLeads(leads).filter((lead) => isRetainerOffer(lead.recommendedOffer));

  return {
    generatedAt: new Date().toISOString(),
    totalLeads: leads.length,
    leadsByStatus: countByValues(leads, leadStatuses, (lead) => lead.status),
    topScoredLeads,
    activeClients,
    clientsByServiceType: countByValues(clients, clientServiceTypes, (client) => client.serviceType),
    clientsByStatus: countByValues(clients, clientStatuses, (client) => client.status),
    estimatedMrr: estimateMrr(activeClients),
    oneTimeOpportunityEstimate: sumLeadOpportunityRanges(leads, 'one-time'),
    retainerOpportunityEstimate: sumLeadOpportunityRanges(leads, 'monthly'),
    retainerOpportunities,
    atRiskClients: clients.filter((client) => client.status === 'at-risk'),
    nextBestRevenueActions: buildRevenueActions(topScoredLeads, activeClients, retainerOpportunities),
  };
}

function topLeads(leads: Lead[]): Lead[] {
  return actionableLeads(leads)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.companyName.localeCompare(b.companyName);
    })
    .slice(0, 5);
}

function actionableLeads(leads: Lead[]): Lead[] {
  return leads.filter((lead) => lead.status !== 'lost' && lead.status !== 'paused' && lead.recommendedOffer !== 'not-fit');
}

function estimateMrr(activeClients: Client[]): number {
  return activeClients
    .filter((client) => client.serviceType === 'qa-automation-retainer' || client.serviceType === 'agency-partner-retainer')
    .reduce((total, client) => total + (client.monthlyFee || 0), 0);
}

function sumLeadOpportunityRanges(leads: Lead[], cadence: CurrencyRange['cadence']): CurrencyRange {
  return actionableLeads(leads).reduce<CurrencyRange>(
    (total, lead) => {
      const range = offerRanges[lead.recommendedOffer];
      if (range.cadence !== cadence) return total;

      return {
        min: total.min + range.min,
        max: total.max + range.max,
        cadence,
      };
    },
    { min: 0, max: 0, cadence },
  );
}

function buildRevenueActions(topScoredLeads: Lead[], activeClients: Client[], retainerOpportunities: Lead[]): RevenueAction[] {
  const actions: RevenueAction[] = [];
  const retainerClient = activeClients.find((client) => client.serviceType === 'qa-automation-retainer' || client.serviceType === 'agency-partner-retainer');
  const topRetainerLead = retainerOpportunities[0];
  const topLead = topScoredLeads[0];

  if (retainerClient) {
    actions.push({
      priority: actions.length + 1,
      title: `Protect active retainer: ${retainerClient.companyName}`,
      reason: 'Active MRR should get recurring proof of value and risk visibility.',
      suggestedCommand: `npm run client:report -- --id ${retainerClient.id}`,
    });
  }

  if (topRetainerLead) {
    actions.push({
      priority: actions.length + 1,
      title: `Move retainer opportunity forward: ${topRetainerLead.companyName}`,
      reason: `${topRetainerLead.companyName} has score ${topRetainerLead.score}/10 and ${topRetainerLead.recommendedOffer} fit.`,
      suggestedCommand: `npm run lead:pack -- --id ${topRetainerLead.id}`,
    });
  }

  if (topLead) {
    actions.push({
      priority: actions.length + 1,
      title: `Prepare proposal path: ${topLead.companyName}`,
      reason: 'Top scored leads should move from review to audit or SOW only after manual approval.',
      suggestedCommand: `npm run sow:generate -- --id ${topLead.id}`,
    });
  }

  actions.push({
    priority: actions.length + 1,
    title: 'Review daily revenue plan',
    reason: 'Daily planning keeps lead, audit, proposal, and retainer work sequenced.',
    suggestedCommand: 'npm run day:plan',
  });

  return actions.slice(0, 5);
}

function isRetainerOffer(offer: RecommendedOffer): boolean {
  return offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer';
}

function countByValues<T, K extends string>(items: T[], values: K[], getValue: (item: T) => K): Record<K, number> {
  const counts = Object.fromEntries(values.map((value) => [value, 0])) as Record<K, number>;

  for (const item of items) {
    counts[getValue(item)] += 1;
  }

  return counts;
}
