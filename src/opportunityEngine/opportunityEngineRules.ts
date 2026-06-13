import fs = require('fs');
import path = require('path');
import { ChannelRecord } from '../channelResearch/types';
import { CompanyContactRecord, ContactRecord } from '../leadResearch/types';
import { listLeads } from '../leads/leadStore';
import { Lead } from '../leads/types';
import { lighthouseReportExists } from '../lighthouseEvidence/lighthouseRules';
import { PainResearchRecord } from '../painIntelligence/types';
import { SiteIntelligenceRecord } from '../siteIntelligence/types';
import {
  AuditDecision,
  AuditPriority,
  AutomationDecision,
  BestChannelDecision,
  BestContactDecision,
  IntelligenceAvailability,
  OpportunityCategory,
  OpportunityInputBundle,
  OpportunityReport,
  OpportunitySummary,
  OpportunityTarget,
  OutreachPriority,
  OutreachRecordForOpportunity,
  ScoredContact,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'opportunities', 'opportunities.json');
const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const outreachPath = path.join(process.cwd(), 'data', 'outreach', 'outreach.json');
const channelsPath = path.join(process.cwd(), 'data', 'channels', 'channels.json');
const painPath = path.join(process.cwd(), 'data', 'pain-intelligence', 'pain-research.json');
const sitePath = path.join(process.cwd(), 'data', 'site-intelligence', 'site-intelligence.json');
const outputDir = path.join(process.cwd(), 'output', 'opportunities');

export function loadOpportunityTargets(): OpportunityTarget[] {
  return readJson<OpportunityTarget[]>(targetsPath, []);
}

export function buildOpportunity(company: string): OpportunityReport {
  const bundle = buildInputBundle(company);
  return buildOpportunityFromBundle(bundle);
}

export function buildOpportunitySummary(): OpportunitySummary {
  const reports = loadOpportunityTargets()
    .filter((target) => target.status === 'active')
    .map((target) => buildOpportunity(target.companyName));

  const commercialPriorities = [...reports].sort((left, right) => {
    return right.confidenceScore - left.confidenceScore || left.companyName.localeCompare(right.companyName);
  });

  return {
    generatedAt: new Date().toISOString(),
    reports,
    commercialPriorities,
    outreachPriorities: reports.flatMap((report) => report.outreachPriorities).sort(sortOutreachPriority),
    auditPriorities: reports.map((report) => report.auditPriority).sort((left, right) => right.confidence - left.confidence || left.company.localeCompare(right.company)),
  };
}

export function writeOpportunityReport(report: OpportunityReport): string {
  const outputPath = path.join(outputDir, `${report.companyId}-opportunity.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderOpportunityReport(report), 'utf8');
  return outputPath;
}

export function writeOpportunitySummary(summary: OpportunitySummary): string[] {
  const outputs = [
    ['best-opportunities.md', renderBestOpportunities(summary.commercialPriorities)],
    ['audit-priorities.md', renderAuditPriorities(summary.auditPriorities)],
    ['commercial-priorities.md', renderCommercialPriorities(summary.commercialPriorities)],
    ['outreach-priorities.md', renderOutreachPriorities(summary.outreachPriorities)],
    ['opportunity-summary.md', renderOpportunitySummary(summary)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

function buildInputBundle(company: string): OpportunityInputBundle {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/opportunities/opportunities.json: ${company}`);
  }

  const lead = findLead(target);
  const contacts = findContacts(target, lead);
  const outreach = findOutreach(target, lead);
  const channels = findChannels(target, lead);
  const pain = findPain(target, lead);
  const site = findSite(target, lead);

  return {
    target,
    lead,
    contacts,
    outreach,
    channels,
    pain,
    site,
    availability: buildAvailability(target.companyId),
  };
}

function buildOpportunityFromBundle(bundle: OpportunityInputBundle): OpportunityReport {
  const bestContact = chooseBestContact(bundle);
  const bestChannel = chooseBestChannel(bundle);
  const bestAuditAngle = chooseBestAuditAngle(bundle);
  const bestAutomationOpportunity = chooseBestAutomation(bundle);
  const confidenceScore = calculateConfidence(bundle);
  const category = chooseCategory(bundle);
  const bestFirstOffer = confidenceScore >= 85 && !bundle.site?.findings.some((finding) => finding.confidence === 'low')
    ? 'Playwright Starter Pack ($900-$1500)'
    : 'QA Audit ($199-$500)';
  const researchRequired = confidenceScore < 90 || bestContact.researchRequired;
  const outreachPriorities = buildOutreachPriorities(bundle);
  const auditPriority = {
    company: bundle.target.companyName,
    auditOpportunity: bestAuditAngle.angle,
    confidence: confidenceScore,
    recommendedScope: bestAuditAngle.recommendedScope,
  };

  return {
    companyId: bundle.target.companyId,
    companyName: bundle.target.companyName,
    opportunityCategory: category,
    confidenceScore,
    researchRequired,
    bestContact,
    bestChannel,
    bestAuditAngle,
    bestAutomationOpportunity,
    bestFirstOffer,
    retainerPath: buildRetainerPath(category, confidenceScore),
    commercialReason: buildCommercialReason(bundle, category),
    recommendedNextAction: buildNextAction(bundle, bestContact, bestChannel),
    availability: bundle.availability,
    outreachPriorities,
    auditPriority,
    safetyNotes: safetyNotes(),
  };
}

function chooseBestContact(bundle: OpportunityInputBundle): BestContactDecision {
  const contacts = scoreContacts(bundle.contacts?.contacts ?? [], bundle.outreach);
  const best = contacts[0];

  if (!best) {
    return {
      name: 'Not identified yet',
      role: 'Not identified yet',
      status: 'research-required',
      reason: 'No approved contact is recorded in data/contacts/contacts.json. Do not invent a person.',
      researchRequired: true,
    };
  }

  return {
    name: best.name,
    role: best.role,
    status: best.mergedStatus,
    reason: `${best.role} is the strongest local contact match based on recorded department, priority, and outreach status.`,
    researchRequired: best.mergedStatus === 'invitation-sent' || best.mergedStatus === 'not-contacted',
  };
}

function scoreContacts(contacts: ContactRecord[], outreach: OutreachRecordForOpportunity[]): ScoredContact[] {
  return contacts.map((contact) => {
    const outreachRecord = outreach.find((record) => normalize(record.contactName) === normalize(contact.name));
    const mergedStatus = outreachRecord?.status ?? contact.status;
    const role = contact.role.toLowerCase();
    const departmentScore = contact.department === 'product' ? 35
      : contact.department === 'founder' ? 30
        : contact.department === 'engineering' ? 25
          : contact.department === 'customer-success' ? 20
            : 10;
    const statusScore = mergedStatus === 'connected' ? 35
      : mergedStatus === 'message-sent' ? 28
        : mergedStatus === 'replied' ? 40
          : mergedStatus === 'invitation-sent' ? 12
            : 5;
    const roleScore = role.includes('product') ? 12 : role.includes('founder') || role.includes('ceo') ? 10 : role.includes('engineering') || role.includes('technology') ? 8 : 0;

    return {
      ...contact,
      mergedStatus,
      score: departmentScore + statusScore + roleScore + Math.max(0, 10 - contact.priority),
    };
  }).sort((left, right) => right.score - left.score || left.priority - right.priority || left.name.localeCompare(right.name));
}

function chooseBestChannel(bundle: OpportunityInputBundle): BestChannelDecision {
  const sortedChannels = [...bundle.channels].sort((left, right) => left.priority - right.priority || left.channel.localeCompare(right.channel));
  const hasContacts = Boolean(bundle.contacts?.contacts.length);
  const nonLinkedInChannel = sortedChannels.find((channel) => channel.type !== 'linkedin');
  const primary = hasContacts && sortedChannels.some((channel) => channel.type === 'linkedin')
    ? 'LinkedIn'
    : nonLinkedInChannel?.channel ?? sortedChannels[0]?.channel ?? 'Research required';
  const secondary = sortedChannels.find((channel) => channel.channel !== primary)?.channel ?? 'Research required';

  return {
    primary,
    secondary,
    reason: primary === 'LinkedIn' && hasContacts
      ? 'LinkedIn is the strongest local channel because approved contacts already exist. Manual outreach only.'
      : 'No approved contact path exists yet, so the best channel must be manually verified before use.',
  };
}

function chooseBestAuditAngle(bundle: OpportunityInputBundle): AuditDecision {
  const siteAngle = bundle.site?.auditRecommendations[0];
  const painAngle = bundle.pain?.auditAngles[0];
  const selected = siteAngle ?? painAngle;

  if (!selected) {
    return {
      angle: 'Research Required',
      reason: 'No site or pain intelligence audit angle is available yet.',
      recommendedScope: ['Manual research required before audit scope is proposed.'],
    };
  }

  return {
    angle: selected.focus,
    reason: bundle.site ? 'Selected from Site Intelligence audit recommendations and supported by local pain/lead signals.' : 'Selected from Pain Intelligence audit recommendations.',
    recommendedScope: selected.review,
  };
}

function chooseBestAutomation(bundle: OpportunityInputBundle): AutomationDecision {
  const siteOpportunity = bundle.site?.automationOpportunities[0];
  const painOpportunity = bundle.pain?.automationOpportunities[0];

  if (siteOpportunity) {
    return {
      title: `Playwright ${siteOpportunity.opportunity}`,
      coverage: siteOpportunity.coverage,
      reason: 'Selected from Site Intelligence automation opportunities.',
    };
  }

  if (painOpportunity) {
    return {
      title: painOpportunity.title,
      coverage: painOpportunity.coverage,
      reason: 'Selected from Pain Intelligence automation opportunities.',
    };
  }

  return {
    title: 'Research Required',
    coverage: ['Manual research required before recommending test coverage.'],
    reason: 'No automation opportunity is available yet.',
  };
}

function chooseCategory(bundle: OpportunityInputBundle): OpportunityCategory {
  const joined = [
    ...(bundle.site?.findings.map((finding) => `${finding.category} ${finding.finding}`) ?? []),
    ...(bundle.pain?.qaRisks.map((risk) => `${risk.category} ${risk.risk}`) ?? []),
  ].join(' ').toLowerCase();

  if (joined.includes('checkout') || joined.includes('payment')) return 'checkout-quality';
  if (joined.includes('booking') || joined.includes('scheduling')) return 'booking-quality';
  if (joined.includes('onboarding') || joined.includes('signup')) return 'onboarding-quality';
  if (joined.includes('mobile')) return 'mobile-quality';
  if (joined.includes('release')) return 'release-confidence';
  return 'qa-audit';
}

function calculateConfidence(bundle: OpportunityInputBundle): number {
  const contactCoverage = bundle.contacts?.contacts.length ? Math.min(25, 10 + bundle.contacts.contacts.length * 3) : 0;
  const connectedBonus = bundle.outreach.some((record) => record.status === 'connected') ? 5 : 0;
  const channelCoverage = bundle.channels.length ? Math.min(25, 10 + bundle.channels.length * 4) : 0;
  const painCoverage = bundle.pain ? Math.min(25, 10 + bundle.pain.qaRisks.length * 3 + bundle.pain.automationOpportunities.length * 2) : 0;
  const siteCoverage = bundle.site ? Math.min(25, 10 + bundle.site.findings.length * 3 + bundle.site.automationOpportunities.length * 3) : 0;
  const lighthouseCoverage = bundle.availability.lighthouseEvidence ? 10 : 0;

  return Math.min(100, contactCoverage + connectedBonus + channelCoverage + painCoverage + siteCoverage + lighthouseCoverage);
}

function buildOutreachPriorities(bundle: OpportunityInputBundle): OutreachPriority[] {
  const scoredContacts = scoreContacts(bundle.contacts?.contacts ?? [], bundle.outreach);
  const bestChannel = chooseBestChannel(bundle);

  if (scoredContacts.length === 0) {
    return [{
      contact: 'Research required',
      company: bundle.target.companyName,
      priority: 1,
      reason: 'No approved contact exists. Add a verified contact before outreach.',
      channel: bestChannel.primary,
      status: 'research-required',
    }];
  }

  return scoredContacts.slice(0, 3).map((contact, index) => ({
    contact: contact.name,
    company: bundle.target.companyName,
    priority: index + 1,
    reason: `${contact.role}; ${contact.reason}`,
    channel: 'LinkedIn',
    status: contact.mergedStatus,
  }));
}

function buildCommercialReason(bundle: OpportunityInputBundle, category: OpportunityCategory): string {
  const parts = [
    bundle.contacts?.contacts.length ? `${bundle.contacts.contacts.length} approved contact records` : 'contact research still required',
    bundle.channels.length ? `${bundle.channels.length} channel records` : 'channel research still required',
    bundle.pain ? `${bundle.pain.qaRisks.length} pain-intelligence QA risk signals` : 'pain intelligence missing',
    bundle.site ? `${bundle.site.findings.length} site-intelligence potential findings` : 'site intelligence missing',
    bundle.availability.lighthouseEvidence ? 'Lighthouse homepage evidence is available' : 'Lighthouse evidence missing',
  ];

  return `${category} is the strongest current category because the local intelligence shows ${parts.join(', ')}.`;
}

function buildNextAction(bundle: OpportunityInputBundle, bestContact: BestContactDecision, bestChannel: BestChannelDecision): string {
  if (bestContact.researchRequired) {
    return `Manually verify the best contact before outreach. Current recommended path: ${bestChannel.primary}.`;
  }

  return `Review ${bestContact.name} and the ${bestChannel.primary} path manually, then approve or reject a QA Audit outreach angle before any external action.`;
}

function buildRetainerPath(category: OpportunityCategory, confidenceScore: number): string {
  if (confidenceScore < 70) return 'Retainer path is not ready. Complete missing research and validate the audit opportunity first.';
  if (category === 'agency-partner-retainer') return 'After a paid audit, position a partner retainer only if recurring cross-client QA demand is confirmed.';
  return 'Start with a paid QA Audit, convert validated workflow risk into a Playwright Starter Pack, then propose QA Automation Retainer ($1500-$3000/month) only after evidence and fit are confirmed.';
}

function buildAvailability(companyId: string): IntelligenceAvailability {
  return {
    leadResearch: fs.existsSync(path.join(process.cwd(), 'output', 'contact-research', `${companyId}-contact-research.md`)),
    channelResearch: fs.existsSync(path.join(process.cwd(), 'output', 'channel-research', `${companyId}.md`)),
    painIntelligence: fs.existsSync(path.join(process.cwd(), 'output', 'pain-research', `${companyId}-pain-research.md`)),
    siteIntelligence: fs.existsSync(path.join(process.cwd(), 'output', 'site-intelligence', `${companyId}-site-intelligence.md`)),
    lighthouseEvidence: lighthouseReportExists(companyId),
  };
}

export function renderOpportunityReport(report: OpportunityReport): string {
  return `# QA Opportunity: ${report.companyName}

## Decision Summary

${bullets([
    `Opportunity category: ${report.opportunityCategory}`,
    `Confidence Score: ${report.confidenceScore}/100`,
    `Research Required: ${report.researchRequired ? 'Yes' : 'No'}`,
    `Best First Offer: ${report.bestFirstOffer}`,
    `Retainer Path: ${report.retainerPath}`,
  ])}

## Source Intelligence

${bullets([
    `Lead Research: ${report.availability.leadResearch ? 'available' : 'missing'}`,
    `Channel Research: ${report.availability.channelResearch ? 'available' : 'missing'}`,
    `Pain Intelligence: ${report.availability.painIntelligence ? 'available' : 'missing'}`,
    `Site Intelligence: ${report.availability.siteIntelligence ? 'available' : 'missing'}`,
    `Lighthouse Evidence: ${report.availability.lighthouseEvidence ? 'available' : 'missing'}`,
  ])}

## Best Contact

${bullets([
    `Best Contact: ${report.bestContact.name}`,
    `Role: ${report.bestContact.role}`,
    `Status: ${report.bestContact.status}`,
    `Reason: ${report.bestContact.reason}`,
    `Research Required: ${report.bestContact.researchRequired ? 'Yes' : 'No'}`,
  ])}

## Best Channel

${bullets([
    `Best Channel: ${report.bestChannel.primary}`,
    `Secondary: ${report.bestChannel.secondary}`,
    `Reason: ${report.bestChannel.reason}`,
  ])}

## Best Audit Angle

${bullets([
    `Audit Angle: ${report.bestAuditAngle.angle}`,
    `Reason: ${report.bestAuditAngle.reason}`,
    'Recommended Scope:',
  ])}
${report.bestAuditAngle.recommendedScope.map((item) => `  - ${item}`).join('\n')}

## Best Automation Opportunity

${bullets([
    `Opportunity: ${report.bestAutomationOpportunity.title}`,
    `Reason: ${report.bestAutomationOpportunity.reason}`,
    'Coverage:',
  ])}
${report.bestAutomationOpportunity.coverage.map((item) => `  - ${item}`).join('\n')}

## Commercial Reason

- ${report.commercialReason}

## Outreach Priorities

${renderOutreachPriorityItems(report.outreachPriorities)}

## Recommended Next Action

- ${report.recommendedNextAction}

## Safety Notes

${bullets(report.safetyNotes)}
`;
}

export function renderOpportunitySummary(summary: OpportunitySummary): string {
  return `# Unified QA Opportunity Summary

Generated: ${summary.generatedAt}

## Totals

${bullets([
    `Companies: ${summary.reports.length}`,
    `Outreach priority rows: ${summary.outreachPriorities.length}`,
    `Audit priorities: ${summary.auditPriorities.length}`,
  ])}

## Commercial Ranking

${numbered(summary.commercialPriorities.map((report) => `${report.companyName} - ${report.confidenceScore}/100 - ${report.opportunityCategory} - ${report.recommendedNextAction}`))}

## Recommended Next Action

- Start with ${summary.commercialPriorities[0]?.companyName ?? 'the highest-confidence company'} only after Daniel reviews the contact, channel, audit angle, and first offer manually.

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderBestOpportunities(reports: OpportunityReport[]): string {
  return `# Best Opportunities

${reports.map((report, index) => `## ${index + 1}. ${report.companyName}

${bullets([
    `Score: ${report.confidenceScore}/100`,
    `Category: ${report.opportunityCategory}`,
    `Best Contact: ${report.bestContact.name}`,
    `Best Channel: ${report.bestChannel.primary}`,
    `Best Audit Angle: ${report.bestAuditAngle.angle}`,
    `Best First Offer: ${report.bestFirstOffer}`,
    `Reason: ${report.commercialReason}`,
    `Recommended next action: ${report.recommendedNextAction}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderCommercialPriorities(reports: OpportunityReport[]): string {
  return `# Commercial Priorities

${numbered(reports.map((report) => `${report.companyName} - Score ${report.confidenceScore}/100 - ${report.commercialReason} Recommended next action: ${report.recommendedNextAction}`))}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderOutreachPriorities(priorities: OutreachPriority[]): string {
  return `# Outreach Priorities

| Contact | Company | Priority | Reason | Channel | Status |
| --- | --- | --- | --- | --- | --- |
${priorities.map((priority) => `| ${priority.contact} | ${priority.company} | ${priority.priority} | ${priority.reason} | ${priority.channel} | ${priority.status} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditPriorities(priorities: AuditPriority[]): string {
  return `# Audit Priorities

| Company | Audit Opportunity | Confidence | Recommended Scope |
| --- | --- | --- | --- |
${priorities.map((priority) => `| ${priority.company} | ${priority.auditOpportunity} | ${priority.confidence}/100 | ${priority.recommendedScope.join('; ')} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function findTarget(company: string): OpportunityTarget | undefined {
  const normalized = normalize(company);
  return loadOpportunityTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function findLead(target: OpportunityTarget): Lead | undefined {
  const normalizedId = normalize(target.companyId);
  const normalizedName = normalize(target.companyName);
  return listLeads().find((lead) => matchesNormalized(normalize(lead.id), normalizedId) || matchesNormalized(normalize(lead.companyName), normalizedName));
}

function findContacts(target: OpportunityTarget, lead?: Lead): CompanyContactRecord | undefined {
  const contacts = readJson<CompanyContactRecord[]>(contactsPath, []);
  const values = matchingValues(target, lead);
  return contacts.find((record) => values.some((value) => matchesNormalized(normalize(record.companyId), value) || matchesNormalized(normalize(record.companyName), value)));
}

function findOutreach(target: OpportunityTarget, lead?: Lead): OutreachRecordForOpportunity[] {
  const values = matchingValues(target, lead);
  return readJson<OutreachRecordForOpportunity[]>(outreachPath, []).filter((record) => values.some((value) => matchesNormalized(normalize(record.companyId), value) || matchesNormalized(normalize(record.companyName), value)));
}

function findChannels(target: OpportunityTarget, lead?: Lead): ChannelRecord[] {
  const values = matchingValues(target, lead);
  return readJson<ChannelRecord[]>(channelsPath, []).filter((record) => values.some((value) => matchesNormalized(normalize(record.companyId), value) || matchesNormalized(normalize(record.company), value)));
}

function findPain(target: OpportunityTarget, lead?: Lead): PainResearchRecord | undefined {
  const values = matchingValues(target, lead);
  return readJson<PainResearchRecord[]>(painPath, []).find((record) => values.some((value) => matchesNormalized(normalize(record.companyId), value) || matchesNormalized(normalize(record.companyName), value)));
}

function findSite(target: OpportunityTarget, lead?: Lead): SiteIntelligenceRecord | undefined {
  const values = matchingValues(target, lead);
  return readJson<SiteIntelligenceRecord[]>(sitePath, []).find((record) => values.some((value) => matchesNormalized(normalize(record.companyId), value) || matchesNormalized(normalize(record.companyName), value)));
}

function matchingValues(target: OpportunityTarget, lead?: Lead): string[] {
  return [
    normalize(target.companyId),
    normalize(target.companyName),
    lead ? normalize(lead.id) : '',
    lead ? normalize(lead.companyName) : '',
  ].filter(Boolean);
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderOutreachPriorityItems(priorities: OutreachPriority[]): string {
  return priorities.map((priority) => bullets([
    `Contact: ${priority.contact}`,
    `Company: ${priority.company}`,
    `Priority: ${priority.priority}`,
    `Reason: ${priority.reason}`,
    `Channel: ${priority.channel}`,
    `Status: ${priority.status}`,
  ])).join('\n\n');
}

function sortOutreachPriority(left: OutreachPriority, right: OutreachPriority): number {
  return left.priority - right.priority || left.company.localeCompare(right.company) || left.contact.localeCompare(right.contact);
}

function safetyNotes(): string[] {
  return [
    'Local-only decision support. No outreach is sent and no external systems are contacted.',
    'Do not invent contacts, complaints, bugs, vulnerabilities, incidents, customer feedback, or metrics.',
    'Use approved pricing only: QA Audit ($199-$500), Playwright Starter Pack ($900-$1500), QA Automation Retainer ($1500-$3000/month).',
    'Human approval is required before any outreach, proposal, audit, or retainer action.',
  ];
}

function numbered(items: string[]): string {
  if (items.length === 0) return '1. No opportunities available.';
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
