import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import { estimateSuggestedOfferValue, getOffer } from './offers';
import { applyScoreToLead, opportunityToLead } from '../scoring/scorer';
import {
  readClients,
  readClosedLeads,
  readConversions,
  readLeads,
  readOpportunities,
  writeClients,
  writeClosedLeads,
  writeConversions,
  writeLeads,
  writeOpportunities,
  writeRevenueSummary,
} from '../storage/jsonStore';
import { ClientRecord, ClosedLeadRecord, CloseReason, CloseResult, ConversionRecord, Lead } from '../types/lead';
import { stableId } from '../utils/ids';

const closeResults: CloseResult[] = ['lost', 'ignored', 'not_fit'];
const closeReasons: CloseReason[] = ['no_budget', 'no_response', 'not_fit', 'wrong_timing', 'already_has_qa', 'too_small', 'too_enterprise', 'bad_contact_info', 'low_quality_lead', 'other'];

export function convertLead(input: { id?: string; offerType?: string; amount?: string; note?: string }): ConversionRecord {
  if (!input.id) throw new Error('Missing --id. Example: npm run lead:convert -- --id sample-lead --offer monthly_qa_maintenance --amount 1000');
  const offer = getOffer(input.offerType);
  const amount = parseAmount(input.amount ?? String(offer.defaultPrice));
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead));
  const lead = leads.find((item) => item.id === input.id);
  if (!lead) throw new Error(`Lead or opportunity not found: ${input.id}`);

  const convertedAt = new Date().toISOString();
  const conversion: ConversionRecord = {
    id: stableId(lead.id, offer.id, convertedAt),
    leadId: lead.id,
    companyName: lead.companyName,
    offerType: offer.id,
    amount,
    billingType: offer.billingType,
    convertedAt,
    projectedMonthlyRevenue: offer.billingType === 'monthly' ? amount : 0,
    projectedOneTimeRevenue: offer.billingType === 'one_time' ? amount : 0,
    note: input.note ?? '',
  };

  const updatedLead: Lead = {
    ...lead,
    status: 'won',
    notes: appendHistoryNote(lead.notes, 'conversion', input.note ?? `${offer.name} at $${amount}`, convertedAt),
    updatedAt: convertedAt,
    nextFollowUpAt: '',
  };

  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? { ...opportunity, status: 'won' as const, notes: appendHistoryNote(opportunity.notes ?? '', 'conversion', input.note, convertedAt), updatedAt: convertedAt }
    : opportunity));
  writeConversions(upsertConversion(readConversions(), conversion));
  writeClients(upsertClient(readClients(), updatedLead, conversion));

  return conversion;
}

export function closeLead(input: { id?: string; result?: string; reason?: string; note?: string }): ClosedLeadRecord {
  if (!input.id) throw new Error('Missing --id. Example: npm run lead:close -- --id sample-lead-close --result lost --reason other');
  const result = parseCloseResult(input.result);
  const reason = parseCloseReason(input.reason);
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead));
  const lead = leads.find((item) => item.id === input.id);
  if (!lead) throw new Error(`Lead or opportunity not found: ${input.id}`);

  const closedAt = new Date().toISOString();
  const record: ClosedLeadRecord = {
    id: stableId(lead.id, result, reason, closedAt),
    leadId: lead.id,
    companyName: lead.companyName,
    result,
    reason,
    closedAt,
    note: input.note ?? '',
  };
  const status = result === 'lost' ? 'lost' : 'ignored';
  const updatedLead: Lead = {
    ...lead,
    status,
    nextFollowUpAt: '',
    notes: appendHistoryNote(lead.notes, `closed:${result}:${reason}`, input.note, closedAt),
    updatedAt: closedAt,
  };

  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? { ...opportunity, status, notes: appendHistoryNote(opportunity.notes ?? '', `closed:${result}:${reason}`, input.note, closedAt), updatedAt: closedAt }
    : opportunity));
  writeClosedLeads([...readClosedLeads(), record]);

  return record;
}

export function generateRevenueSummary(): RevenueSummary {
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead)).map(applyScoreToLead);
  const conversions = readConversions();
  const clients = readClients();
  const closedLeads = readClosedLeads();
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const projectedMonthlyRecurringRevenue = conversions.reduce((sum, conversion) => sum + conversion.projectedMonthlyRevenue, 0);
  const projectedOneTimeRevenueThisMonth = conversions
    .filter((conversion) => conversion.convertedAt.startsWith(currentMonth))
    .reduce((sum, conversion) => sum + conversion.projectedOneTimeRevenue, 0);
  const lostLeadsByReason = countByReason(closedLeads);
  const hotPipelineValue = pipelineValue(leads, 'hot');
  const warmPipelineValue = pipelineValue(leads, 'warm');
  const summary: RevenueSummary = {
    generatedAt: now.toISOString(),
    projectedMonthlyRecurringRevenue,
    projectedOneTimeRevenueThisMonth,
    progressTo3000: progress(projectedMonthlyRecurringRevenue, 3000),
    progressTo5000: progress(projectedMonthlyRecurringRevenue, 5000),
    clientsNeededAt500: clientsNeeded(projectedMonthlyRecurringRevenue, 3000, 500),
    clientsNeededAt1000: clientsNeeded(projectedMonthlyRecurringRevenue, 3000, 1000),
    clientsNeededAt1500: clientsNeeded(projectedMonthlyRecurringRevenue, 3000, 1500),
    wonClients: clients,
    oneTimeOffersSold: conversions.filter((conversion) => conversion.billingType === 'one_time'),
    activeMonthlyOffers: conversions.filter((conversion) => conversion.billingType === 'monthly'),
    lostLeadsByReason,
    pipelineValueEstimate: {
      hotLeads: hotPipelineValue,
      warmLeads: warmPipelineValue,
      total: hotPipelineValue + warmPipelineValue,
    },
    topRevenueOpportunities: leads
      .filter((lead) => !['won', 'lost', 'ignored'].includes(lead.status))
      .sort((a, b) => estimateSuggestedOfferValue(b.suggestedOffer) - estimateSuggestedOfferValue(a.suggestedOffer) || b.score - a.score)
      .slice(0, 10)
      .map((lead) => ({
        leadId: lead.id,
        companyName: lead.companyName,
        status: lead.status,
        score: lead.score,
        suggestedOffer: lead.suggestedOffer,
        estimatedValue: estimateSuggestedOfferValue(lead.suggestedOffer),
        command: `npm run lead:review -- --id ${lead.id}`,
      })),
    recommendedNextActions: [
      'Review top revenue opportunities before sending outreach.',
      'Convert won leads immediately with lead:convert so MRR stays accurate.',
      'Close bad-fit or no-response leads so follow-up lists stay clean.',
      'Prioritize monthly_qa_maintenance offers for MRR progress.',
    ],
  };

  writeRevenueSummary(summary);
  writeRevenueSummaryMarkdown(summary);
  return summary;
}

function parseAmount(rawAmount: string): number {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid amount: ${rawAmount}`);
  return amount;
}

function parseCloseResult(raw: string | undefined): CloseResult {
  if (!raw || !closeResults.includes(raw as CloseResult)) {
    throw new Error(`Invalid result. Supported results: ${closeResults.join(', ')}`);
  }
  return raw as CloseResult;
}

function parseCloseReason(raw: string | undefined): CloseReason {
  if (!raw || !closeReasons.includes(raw as CloseReason)) {
    throw new Error(`Invalid reason. Supported reasons: ${closeReasons.join(', ')}`);
  }
  return raw as CloseReason;
}

function upsertConversion(conversions: ConversionRecord[], conversion: ConversionRecord): ConversionRecord[] {
  return [...conversions.filter((item) => !(item.leadId === conversion.leadId && item.offerType === conversion.offerType)), conversion];
}

function upsertClient(clients: ClientRecord[], lead: Lead, conversion: ConversionRecord): ClientRecord[] {
  const now = conversion.convertedAt;
  const existing = clients.find((client) => client.leadId === lead.id);
  const activeOffers = [...(existing?.activeOffers.filter((offer) => offer.offerType !== conversion.offerType) ?? []), conversion];
  const client: ClientRecord = {
    id: existing?.id ?? stableId('client', lead.id),
    leadId: lead.id,
    companyName: lead.companyName,
    website: lead.website,
    contactName: lead.contactName,
    contactEmail: lead.contactEmail,
    linkedinUrl: lead.linkedinUrl,
    activeOffers,
    projectedMonthlyRevenue: activeOffers.reduce((sum, offer) => sum + offer.projectedMonthlyRevenue, 0),
    projectedOneTimeRevenue: activeOffers.reduce((sum, offer) => sum + offer.projectedOneTimeRevenue, 0),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    notes: lead.notes,
  };
  return [...clients.filter((item) => item.leadId !== lead.id), client];
}

function countByReason(closedLeads: ClosedLeadRecord[]): Record<CloseReason, number> {
  return closeReasons.reduce<Record<CloseReason, number>>((counts, reason) => {
    counts[reason] = closedLeads.filter((record) => record.reason === reason).length;
    return counts;
  }, {} as Record<CloseReason, number>);
}

function pipelineValue(leads: Lead[], category: 'hot' | 'warm'): number {
  return leads
    .filter((lead) => lead.scoreBreakdown.category === category && !['won', 'lost', 'ignored'].includes(lead.status))
    .reduce((sum, lead) => sum + estimateSuggestedOfferValue(lead.suggestedOffer), 0);
}

function progress(value: number, target: number): number {
  return Math.min(100, Math.round((value / target) * 100));
}

function clientsNeeded(currentMrr: number, target: number, monthlyPrice: number): number {
  return Math.max(0, Math.ceil((target - currentMrr) / monthlyPrice));
}

function writeRevenueSummaryMarkdown(summary: RevenueSummary): void {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'revenue-summary.md');
  fs.writeFileSync(filePath, `${formatRevenueSummary(summary).trim()}\n`, 'utf8');
}

export function formatRevenueSummary(summary: RevenueSummary): string {
  return `# Revenue Summary

Generated: ${summary.generatedAt}

## Revenue Snapshot

- Projected monthly recurring revenue: $${summary.projectedMonthlyRecurringRevenue}
- Projected one-time revenue this month: $${summary.projectedOneTimeRevenueThisMonth}
- Progress to $3,000/month: ${summary.progressTo3000}%
- Progress to $5,000/month: ${summary.progressTo5000}%

## Clients Needed For $3,000/month

- At $500/month: ${summary.clientsNeededAt500}
- At $1,000/month: ${summary.clientsNeededAt1000}
- At $1,500/month: ${summary.clientsNeededAt1500}

## Won Clients

${summary.wonClients.length ? summary.wonClients.map((client) => `- ${client.companyName}: $${client.projectedMonthlyRevenue}/month, $${client.projectedOneTimeRevenue} one-time`).join('\n') : '- None.'}

## One-Time Offers Sold

${summary.oneTimeOffersSold.length ? summary.oneTimeOffersSold.map((conversion) => `- ${conversion.companyName}: ${conversion.offerType}, $${conversion.amount}`).join('\n') : '- None.'}

## Active Monthly Offers

${summary.activeMonthlyOffers.length ? summary.activeMonthlyOffers.map((conversion) => `- ${conversion.companyName}: ${conversion.offerType}, $${conversion.amount}/month`).join('\n') : '- None.'}

## Lost Leads By Reason

${Object.entries(summary.lostLeadsByReason).map(([reason, count]) => `- ${reason}: ${count}`).join('\n')}

## Pipeline Value Estimate

- Hot leads: $${summary.pipelineValueEstimate.hotLeads}
- Warm leads: $${summary.pipelineValueEstimate.warmLeads}
- Total: $${summary.pipelineValueEstimate.total}

## Top Revenue Opportunities

${summary.topRevenueOpportunities.length ? summary.topRevenueOpportunities.map((lead) => `- ${lead.companyName}: ${lead.suggestedOffer}, estimated $${lead.estimatedValue}, ${lead.status}. Review: ${lead.command}`).join('\n') : '- None.'}

## Recommended Next Actions

${summary.recommendedNextActions.map((action) => `- ${action}`).join('\n')}
`;
}

function appendHistoryNote(existingNotes: string, label: string, note: string | undefined, timestamp: string): string {
  const message = note?.trim() || 'No note provided';
  return [existingNotes.trim(), `[${timestamp}] ${label}: ${message}`].filter(Boolean).join('\n');
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}

export interface RevenueSummary {
  generatedAt: string;
  projectedMonthlyRecurringRevenue: number;
  projectedOneTimeRevenueThisMonth: number;
  progressTo3000: number;
  progressTo5000: number;
  clientsNeededAt500: number;
  clientsNeededAt1000: number;
  clientsNeededAt1500: number;
  wonClients: ClientRecord[];
  oneTimeOffersSold: ConversionRecord[];
  activeMonthlyOffers: ConversionRecord[];
  lostLeadsByReason: Record<CloseReason, number>;
  pipelineValueEstimate: {
    hotLeads: number;
    warmLeads: number;
    total: number;
  };
  topRevenueOpportunities: Array<{
    leadId: string;
    companyName: string;
    status: string;
    score: number;
    suggestedOffer: string;
    estimatedValue: number;
    command: string;
  }>;
  recommendedNextActions: string[];
}
