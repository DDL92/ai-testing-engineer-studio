import fs = require('fs');
import path = require('path');
import { scoreLead } from './leadScorer';
import { Lead, LeadUpdateInput, NewLeadInput } from './types';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');

export function readLeads(): Lead[] {
  ensureLeadFile();
  const raw = fs.readFileSync(leadsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as Lead[];
}

export function writeLeads(leads: Lead[]): void {
  fs.mkdirSync(path.dirname(leadsPath), { recursive: true });
  fs.writeFileSync(leadsPath, `${JSON.stringify(leads, null, 2)}\n`, 'utf8');
}

export function addLead(input: NewLeadInput): Lead {
  const leads = readLeads();
  const existing = leads.find((lead) => lead.id === input.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const scoreResult = scoreLead({
    companyName: input.companyName,
    website: input.website,
    industry: input.industry,
    source: input.source,
    fitNotes: input.fitNotes,
    painPoints: input.painPoints,
    recommendedOffer: input.recommendedOffer,
  });

  const lead: Lead = {
    ...input,
    score: input.score ?? scoreResult.score,
    recommendedOffer: scoreResult.recommendedOffer,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };

  writeLeads([...leads, lead]);
  return lead;
}

export function updateLead(id: string, updates: LeadUpdateInput): Lead | undefined {
  const leads = readLeads();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return undefined;

  const updatedLead: Lead = {
    ...leads[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const scoreResult = scoreLead({
    companyName: updatedLead.companyName,
    website: updatedLead.website,
    industry: updatedLead.industry,
    source: updatedLead.source,
    fitNotes: updatedLead.fitNotes,
    painPoints: updatedLead.painPoints,
    recommendedOffer: updatedLead.recommendedOffer,
  });

  updatedLead.score = updates.score ?? scoreResult.score;
  updatedLead.recommendedOffer = scoreResult.recommendedOffer;

  leads[index] = updatedLead;
  writeLeads(leads);
  return updatedLead;
}

export function getLeadById(id: string): Lead | undefined {
  return readLeads().find((lead) => lead.id === id);
}

export function listLeads(): Lead[] {
  return readLeads();
}

export function getTopLeads(limit = 5): Lead[] {
  return [...readLeads()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.companyName.localeCompare(b.companyName);
    })
    .slice(0, limit);
}

function ensureLeadFile(): void {
  if (fs.existsSync(leadsPath)) return;
  writeLeads([]);
}
