import fs = require('fs');
import path = require('path');
import { listLeads } from '../leads/leadStore';
import { Lead } from '../leads/types';
import { CompanyContactRecord, ContactRecord } from '../leadResearch/types';
import {
  ChannelCompanyProfile,
  ChannelPlan,
  ChannelPlanItem,
  ChannelRecommendation,
  ChannelRecord,
  ChannelType,
  OutreachAngle,
} from './types';

const channelsPath = path.join(process.cwd(), 'data', 'channels', 'channels.json');
const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const discoveredLeadsPath = path.join(process.cwd(), 'data', 'leads', 'discovered-leads.json');
const outputDir = path.join(process.cwd(), 'output', 'channel-research');

interface DiscoveredLeadCandidate {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  score: number;
  painPoints: string[];
}

interface DiscoveredLeadRun {
  candidates?: DiscoveredLeadCandidate[];
}

export function loadChannels(): ChannelRecord[] {
  const raw = fs.readFileSync(channelsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as ChannelRecord[];
}

export function loadContacts(): CompanyContactRecord[] {
  if (!fs.existsSync(contactsPath)) return [];
  const raw = fs.readFileSync(contactsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as CompanyContactRecord[];
}

export function buildChannelProfile(company: string): ChannelCompanyProfile {
  const lead = findLead(company);
  const channels = findChannels(company, lead);
  const contacts = findContacts(company, lead, channels);

  if (!lead && channels.length === 0 && !contacts) {
    throw new Error(`Company not found in local lead, channel, or contact data: ${company}`);
  }

  const companyId = channels[0]?.companyId ?? contacts?.companyId ?? lead?.id ?? slug(company);
  const companyName = contacts?.companyName ?? channels[0]?.company ?? lead?.companyName ?? company;
  const safeLead = lead ?? {
    id: companyId,
    companyName,
    website: '',
    industry: 'Not recorded',
    score: 0,
    painPoints: [],
  };

  return {
    lead: safeLead,
    companyId,
    companyName,
    contacts,
    channels: channels.sort(sortChannels),
    recommendedOrder: recommendChannels(channels, contacts),
    outreachAngles: buildOutreachAngles(safeLead, contacts),
  };
}

export function writeChannelResearch(profile: ChannelCompanyProfile): string {
  const outputPath = path.join(outputDir, `${profile.companyId}.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderChannelResearch(profile), 'utf8');
  return outputPath;
}

export function buildChannelPlan(): ChannelPlan {
  const channels = loadChannels();
  const companies = uniqueCompanies(channels);
  const today = companies
    .map((company) => buildPlanItem(buildChannelProfile(company)))
    .sort((left, right) => right.priorityScore - left.priorityScore || left.companyName.localeCompare(right.companyName))
    .slice(0, 5);

  return {
    generatedAt: new Date().toISOString(),
    today,
    safetyNotes: safetyNotes(),
  };
}

export function writeChannelPlan(plan: ChannelPlan): string {
  const outputPath = path.join(outputDir, 'channel-plan.md');
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderChannelPlan(plan), 'utf8');
  return outputPath;
}

export function renderChannelResearch(profile: ChannelCompanyProfile): string {
  return `# Channel Research: ${profile.companyName}

## Company

${bullets([
    `Name: ${profile.companyName}`,
    `Website: ${profile.lead.website || 'Not recorded'}`,
    `Industry: ${profile.lead.industry || 'Not recorded'}`,
    `Score: ${profile.lead.score}/10`,
  ])}

## Available Channels

### LinkedIn

${renderLinkedIn(profile)}

### Website Contact Form

${renderChannelType(profile.channels, 'website-contact-form')}

### Demo Request

${renderChannelType(profile.channels, 'demo-request')}

### Public Support / Contact Email

${renderChannelType(profile.channels, 'public-email')}

### Partnership Channel

${renderChannelType(profile.channels, 'partnership', 'Exists?')}

### Community Channel

${renderCommunityChannels(profile.channels)}

### Recommended Order

${numbered(profile.recommendedOrder.map((recommendation) => `${recommendation.channel} - ${recommendation.reason}`))}

### Outreach Angle

${bullets(profile.outreachAngles.map((angle) => `${angle.department}: ${angle.angle}`))}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderChannelPlan(plan: ChannelPlan): string {
  return `# Multi-Channel Lead Research Plan

Generated: ${plan.generatedAt}

## Today

${plan.today.map((item, index) => `${index + 1}. ${item.companyName}

${item.recommendedChannels.slice(0, 3).map((recommendation) => `   * ${recommendation.channel}`).join('\n')}`).join('\n\n')}

## Priority Scores

${bullets(plan.today.map((item) => `${item.companyName}: ${item.priorityScore} (${item.recommendedChannels.map((recommendation) => recommendation.channel).join(', ') || 'no channels ready'})`))}

## Recommended Next Action

${plan.today[0] ? `Manually verify ${plan.today[0].companyName}'s top channel URL and message angle before taking any external action. Do not send or automate outreach from this plan.` : 'No channel plan items are available. Add local channel records first.'}

## Safety Notes

${bullets(plan.safetyNotes)}
`;
}

function buildPlanItem(profile: ChannelCompanyProfile): ChannelPlanItem {
  const contactCount = profile.contacts?.contacts.length ?? 0;
  const channelWeight = profile.recommendedOrder.reduce((total, recommendation) => total + Math.max(1, 8 - recommendation.priority), 0);
  const priorityScore = profile.lead.score * 10 + contactCount * 3 + channelWeight;

  return {
    companyId: profile.companyId,
    companyName: profile.companyName,
    score: profile.lead.score,
    priorityScore,
    recommendedChannels: profile.recommendedOrder,
    nextAction: `Manually verify ${profile.recommendedOrder[0]?.channel ?? 'a public channel'} for ${profile.companyName}; human approval required before outreach.`,
  };
}

function recommendChannels(channels: ChannelRecord[], contacts?: CompanyContactRecord): ChannelRecommendation[] {
  const recommendations: ChannelRecommendation[] = [];
  const contactCount = contacts?.contacts.length ?? 0;
  const linkedIn = channels.find((channel) => channel.type === 'linkedin');

  if (linkedIn && contactCount > 0) {
    recommendations.push({
      channel: 'LinkedIn',
      priority: linkedIn.priority,
      reason: `${contactCount} manually tracked contact${contactCount === 1 ? '' : 's'} available. Manual review only; no automation.`,
    });
  } else if (linkedIn) {
    recommendations.push({
      channel: 'LinkedIn',
      priority: linkedIn.priority,
      reason: 'Company channel is recorded, but no individual contacts are identified yet.',
    });
  }

  for (const type of ['demo-request', 'website-contact-form', 'product-contact', 'partnership', 'public-email'] as ChannelType[]) {
    const channel = channels.find((candidate) => candidate.type === type);
    if (!channel) continue;

    recommendations.push({
      channel: channel.channel,
      priority: channel.priority,
      reason: channel.url ? `Public URL recorded: ${channel.url}` : channel.notes,
    });
  }

  return recommendations
    .sort((left, right) => left.priority - right.priority || left.channel.localeCompare(right.channel))
    .slice(0, 3);
}

function buildOutreachAngles(lead: Pick<Lead, 'painPoints'>, contacts?: CompanyContactRecord): OutreachAngle[] {
  const painPoints = lead.painPoints.length > 0 ? lead.painPoints.join(', ') : 'recorded product workflow risk';
  const hasProduct = contacts?.contacts.some((contact) => contact.department === 'product' || contact.role.toLowerCase().includes('product')) ?? false;
  const hasEngineering = contacts?.contacts.some((contact) => contact.department === 'engineering' || contact.role.toLowerCase().includes('engineering') || contact.role.toLowerCase().includes('technology')) ?? false;
  const hasCustomerSuccess = contacts?.contacts.some((contact) => contact.department === 'customer-success') ?? false;

  return [
    {
      department: 'Product',
      angle: hasProduct ? `Discuss QA risk around ${painPoints}.` : `Product contact not identified yet; keep angle around ${painPoints} until a real contact is verified.`,
    },
    {
      department: 'Engineering',
      angle: hasEngineering ? 'Position Playwright smoke coverage around regression risk and release confidence.' : 'Engineering contact not identified yet; do not invent a technical owner.',
    },
    {
      department: 'Customer Success',
      angle: hasCustomerSuccess ? 'Tie QA coverage to customer-facing workflow reliability.' : 'Customer Success contact not identified yet; use only after manual research confirms a real owner.',
    },
    {
      department: 'Operations',
      angle: 'Use only if the public channel is a demo/contact path and Daniel approves an operations-focused message.',
    },
  ];
}

function renderLinkedIn(profile: ChannelCompanyProfile): string {
  const channel = profile.channels.find((candidate) => candidate.type === 'linkedin');
  const contacts = profile.contacts?.contacts ?? [];

  return bullets([
    `Contacts: ${contacts.length > 0 ? contacts.map(renderContact).join('; ') : 'Not identified yet.'}`,
    `Priority: ${channel?.priority ?? 'Not recorded'}`,
    `Notes: ${channel?.notes ?? 'LinkedIn channel not recorded for this company.'}`,
  ]);
}

function renderChannelType(channels: ChannelRecord[], type: ChannelType, label = 'URL'): string {
  const channel = channels.find((candidate) => candidate.type === type);
  if (!channel) {
    return bullets([
      `${label}: Not identified yet.`,
      'Notes: No local channel record exists. Manual research required; do not scrape, enrich, or automate.',
    ]);
  }

  return bullets([
    `${label}: ${channel.url || 'Not identified yet.'}`,
    `Priority: ${channel.priority}`,
    `Notes: ${channel.notes}`,
  ]);
}

function renderCommunityChannels(channels: ChannelRecord[]): string {
  const communityTypes: ChannelType[] = ['blog', 'community', 'events', 'podcast', 'webinar', 'public-slack-discord'];
  const labels: Record<ChannelType, string> = {
    linkedin: 'LinkedIn',
    'website-contact-form': 'Website Contact Form',
    'demo-request': 'Demo Request',
    'public-email': 'Public Support / Contact Email',
    partnership: 'Partnership',
    blog: 'Blog',
    community: 'Community',
    events: 'Events',
    podcast: 'Podcast',
    webinar: 'Webinar',
    'public-slack-discord': 'Public Slack/Discord',
    'product-contact': 'Product Contact',
    'support-contact': 'Support Contact',
  };

  return bullets(communityTypes.map((type) => {
    const channel = channels.find((candidate) => candidate.type === type);
    return `${labels[type]}: ${channel?.url || 'Not identified yet.'}${channel ? ` Notes: ${channel.notes}` : ''}`;
  }));
}

function findLead(company: string): Pick<Lead, 'id' | 'companyName' | 'website' | 'industry' | 'score' | 'painPoints'> | undefined {
  const normalized = normalize(company);
  const lead = listLeads().find((candidate) => matchesCompany(candidate.id, candidate.companyName, normalized));
  if (lead) return lead;

  const discovered = readDiscoveredLeads().find((candidate) => matchesCompany(candidate.id, candidate.companyName, normalized));
  if (!discovered) return undefined;

  return {
    id: discovered.id,
    companyName: discovered.companyName,
    website: discovered.website,
    industry: discovered.industry,
    score: discovered.score,
    painPoints: discovered.painPoints,
  };
}

function readDiscoveredLeads(): DiscoveredLeadCandidate[] {
  if (!fs.existsSync(discoveredLeadsPath)) return [];
  const raw = fs.readFileSync(discoveredLeadsPath, 'utf8').trim();
  if (!raw) return [];
  const run = JSON.parse(raw) as DiscoveredLeadRun;
  return run.candidates ?? [];
}

function findChannels(company: string, lead?: Pick<Lead, 'id' | 'companyName'>): ChannelRecord[] {
  const normalized = normalize(company);
  const leadId = lead ? normalize(lead.id) : '';
  const leadName = lead ? normalize(lead.companyName) : '';

  return loadChannels().filter((channel) => {
    const channelId = normalize(channel.companyId);
    const channelCompany = normalize(channel.company);

    return matchesNormalized(channelId, normalized)
      || matchesNormalized(channelCompany, normalized)
      || Boolean(leadId && matchesNormalized(channelId, leadId))
      || Boolean(leadName && matchesNormalized(channelCompany, leadName));
  });
}

function findContacts(company: string, lead: Pick<Lead, 'id' | 'companyName'> | undefined, channels: ChannelRecord[]): CompanyContactRecord | undefined {
  const normalized = normalize(company);
  const values = [
    normalized,
    lead ? normalize(lead.id) : '',
    lead ? normalize(lead.companyName) : '',
    ...channels.flatMap((channel) => [normalize(channel.companyId), normalize(channel.company)]),
  ].filter(Boolean);

  return loadContacts().find((record) => {
    const recordValues = [normalize(record.companyId), normalize(record.companyName)];
    return values.some((value) => recordValues.some((recordValue) => matchesNormalized(recordValue, value)));
  });
}

function uniqueCompanies(channels: ChannelRecord[]): string[] {
  const seen = new Set<string>();
  const companies: string[] = [];

  for (const channel of channels.sort(sortChannels)) {
    if (seen.has(channel.companyId)) continue;
    seen.add(channel.companyId);
    companies.push(channel.company);
  }

  return companies;
}

function renderContact(contact: ContactRecord): string {
  return `${contact.name} (${contact.role}, ${contact.status})`;
}

function sortChannels(left: ChannelRecord, right: ChannelRecord): number {
  return left.priority - right.priority || left.channel.localeCompare(right.channel);
}

function safetyNotes(): string[] {
  return [
    'Local-only channel research. No browser automation, scraping, paid APIs, CRM, credentials, external databases, or sending.',
    'Do not invent contacts, emails, URLs, partnerships, communities, events, or personalization.',
    'Blank URLs mean the path is not recorded yet and must be manually verified before use.',
    'Human approval is required before any outreach, follow-up, demo request, contact form submission, email, or LinkedIn action.',
  ];
}

function numbered(items: string[]): string {
  if (items.length === 0) return '1. No recommended channel is ready. Add local channel records after manual research.';
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesCompany(id: string, companyName: string, normalized: string): boolean {
  return matchesNormalized(normalize(id), normalized) || matchesNormalized(normalize(companyName), normalized);
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
