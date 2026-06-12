import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById, listLeads } from '../leads/leadStore';
import { Lead, RecommendedOffer } from '../leads/types';
import { DiscoveredLeadCandidate, LeadDiscoveryEngineRun } from '../discovery/types';
import { buildLeadPack } from './leadPackRules';
import { LeadPack, LeadPackSection } from './types';

const outputDir = path.join(process.cwd(), 'output', 'lead-packs');
const outboundOutputDir = path.join(process.cwd(), 'output', 'outbound');
const leadEngineOutputDir = path.join(process.cwd(), 'output', 'leads');

function main(): void {
  const args = process.argv.slice(2);
  const id = parseLeadId(args);
  const company = parseCompany(args);

  if (!id && !company) {
    exitWithError('Missing required --id lead_id or --company "Company Name" argument. Examples: npm run lead:pack -- --id pushpress OR npm run lead:pack -- --company PushPress');
  }

  const lead = id ? getLeadById(id) : findLeadByCompany(company ?? '');
  if (!lead) {
    exitWithError(`Lead not found. Run npm run lead:discover -- --niche "gym management SaaS", then retry with --company or promote the candidate manually.`);
  }

  const score = scoreLead(lead);
  const scoredLead: Lead = {
    ...lead,
    score: score.score,
    recommendedOffer: score.recommendedOffer,
  };
  const leadPack = buildLeadPack({ lead: scoredLead, score });
  const outputPath = path.join(outputDir, `${lead.id}.md`);
  const outboundPath = path.join(outboundOutputDir, `${lead.id}-outbound-plan.md`);
  const enginePackPath = path.join(leadEngineOutputDir, `${lead.id}-lead-pack.md`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outboundOutputDir, { recursive: true });
  fs.mkdirSync(leadEngineOutputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderLeadPack(leadPack), 'utf8');
  fs.writeFileSync(outboundPath, renderOutboundPlan(leadPack), 'utf8');
  fs.writeFileSync(enginePackPath, renderLeadEnginePack(leadPack), 'utf8');

  console.log(`Lead pack generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Lead Discovery Engine pack generated: ${path.relative(process.cwd(), enginePackPath)}`);
  console.log(`Outbound plan generated: ${path.relative(process.cwd(), outboundPath)}`);
  console.log(`Lead: ${leadPack.companyName}`);
  console.log(`Score: ${leadPack.score.score}/10`);
  console.log(`Recommended offer: ${leadPack.recommendedOffer}`);
  console.log('No outreach was sent. Human approval is required before any contact.');
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function parseCompany(args: string[]): string | undefined {
  const companyFlagIndex = args.indexOf('--company');
  if (companyFlagIndex >= 0) return args[companyFlagIndex + 1];

  const companyValue = args.find((arg) => arg.startsWith('--company='));
  if (companyValue) return companyValue.slice('--company='.length);

  return undefined;
}

function findLeadByCompany(companyName: string): Lead | undefined {
  const normalizedCompany = normalize(companyName);
  const activeLead = listLeads().find((lead) => normalize(lead.companyName) === normalizedCompany || normalize(lead.id) === normalizedCompany);
  if (activeLead) return activeLead;

  const discovered = readDiscoveredLeadCandidates().find((candidate) => normalize(candidate.companyName) === normalizedCompany || normalize(candidate.id) === normalizedCompany);
  if (!discovered) return undefined;

  return leadFromDiscoveredCandidate(discovered);
}

function readDiscoveredLeadCandidates(): DiscoveredLeadCandidate[] {
  const discoveredPath = path.join(process.cwd(), 'data', 'leads', 'discovered-leads.json');
  if (!fs.existsSync(discoveredPath)) return [];
  const raw = fs.readFileSync(discoveredPath, 'utf8').trim();
  if (!raw) return [];
  const run = JSON.parse(raw) as LeadDiscoveryEngineRun;
  return run.candidates ?? [];
}

function leadFromDiscoveredCandidate(candidate: DiscoveredLeadCandidate): Lead {
  const now = new Date().toISOString();

  return {
    id: candidate.id,
    companyName: candidate.companyName,
    website: candidate.website,
    industry: candidate.industry,
    source: candidate.source,
    status: 'new',
    fitNotes: candidate.fitNotes,
    painPoints: candidate.painPoints,
    recommendedOffer: candidate.recommendedOffer as RecommendedOffer,
    score: candidate.score,
    createdAt: now,
    updatedAt: now,
    nextAction: candidate.nextAction,
    outreachStatus: 'not-started',
  };
}

function renderLeadPack(leadPack: LeadPack): string {
  return `# Lead Pack: ${leadPack.companyName}

${renderSection(getSection(leadPack, 'Lead Overview'))}
${renderScoreSection(leadPack)}
${renderSection(getSection(leadPack, 'Fit Assessment'))}
${renderSection(getSection(leadPack, 'Pain Points'))}
${renderSection(getSection(leadPack, 'Recommended Offer'))}
${renderSection(getSection(leadPack, 'Audit Angle'))}
${renderSection(getSection(leadPack, 'Outreach Angle'))}
${renderSection(getSection(leadPack, 'Outbound Status'))}
${renderSection(getSection(leadPack, 'Contact Information'))}
${renderSection(getSection(leadPack, 'Qualification Summary'))}
${renderSection(getSection(leadPack, 'Outreach Channel Recommendation'))}
${renderSection(getSection(leadPack, 'Manual Outreach Draft'))}
${renderSection(getSection(leadPack, 'Follow-Up Draft'))}
${renderSection(getSection(leadPack, 'Manual Outreach Checklist'))}
${renderSection(getSection(leadPack, 'Follow-Up Plan'))}
${renderSection(getSection(leadPack, 'Discovery Call Questions'))}
${renderSection(getSection(leadPack, 'Proposal/SOW Angle'))}
${renderSection(getSection(leadPack, 'Risks / Disqualifiers'))}
${renderSection(getSection(leadPack, 'Recommended Next Action'))}
${renderSection(getSection(leadPack, 'Updated Recommended Next Action'))}
${renderSection(getSection(leadPack, 'Suggested Next Commands'))}
${renderSection(getSection(leadPack, 'Safety Reminder'))}
`;
}

function renderScoreSection(leadPack: LeadPack): string {
  const reasons = leadPack.score.reasons.length > 0
    ? leadPack.score.reasons.map((reason) => `- ${reason}`).join('\n')
    : '- No scoring reasons were generated.';

  return `## Score

- Score: ${leadPack.score.score}/10
- Recommended offer from scorer: ${leadPack.score.recommendedOffer}

Scoring reasons:

${reasons}
`;
}

function renderSection(section: LeadPackSection): string {
  return `## ${section.title}

${section.body.map((line) => `- ${line}`).join('\n')}
`;
}

function renderOutboundPlan(leadPack: LeadPack): string {
  const plan = leadPack.outboundPlan;

  return `# Outbound Plan: ${leadPack.companyName}

## Channel

- Recommended channel: ${plan.recommendation.channel}

## Status

- Recommended status: ${plan.recommendation.status}
- Stored status: ${plan.lead.outreachStatus ?? 'not-started'}

## Manual Message

${plan.manualMessage}

## Follow-Up

- Timing: ${plan.recommendation.followUpTiming}
- Draft: ${plan.followUpMessage}

## Checklist

${plan.recommendation.checklist.map((item) => `- ${item}`).join('\n')}

## Next Action

${plan.recommendation.nextAction}

## Safety Reminder

${plan.safetyReminder.map((item) => `- ${item}`).join('\n')}
`;
}

function renderLeadEnginePack(leadPack: LeadPack): string {
  const leadOverview = getSection(leadPack, 'Lead Overview');
  const contactInformation = getSection(leadPack, 'Contact Information');
  const manualOutreach = getSection(leadPack, 'Manual Outreach Draft');
  const followUp = getSection(leadPack, 'Follow-Up Draft');
  const auditAngle = getSection(leadPack, 'Audit Angle');
  const nextAction = getSection(leadPack, 'Recommended Next Action');

  return [
    `# Lead Discovery Engine Pack: ${leadPack.companyName}`,
    '',
    `Generated: ${leadPack.generatedAt}`,
    '',
    '## Company Summary',
    renderBulletBody(leadOverview.body),
    '',
    '## Contact Recommendations',
    renderBulletBody([
      ...contactInformation.body,
      'Recommended contact roles: CTO, VP Engineering, Head of Engineering, QA Manager, Product Manager, Founder, Operations Lead.',
      'Use only public, manually verified contact details. Do not invent names, roles, URLs, or emails.',
    ]),
    '',
    '## Outreach Drafts',
    renderBulletBody([
      ...manualOutreach.body,
      ...followUp.body,
    ]),
    '',
    '## QA Opportunity Analysis',
    renderBulletBody([
      `Score: ${leadPack.score.score}/10`,
      `Recommended offer: ${leadPack.recommendedOffer}`,
      ...auditAngle.body,
      `Scoring reasons: ${leadPack.score.reasons.join('; ') || 'No scoring reasons generated.'}`,
    ]),
    '',
    '## Next Actions',
    renderBulletBody([
      ...nextAction.body,
      ...leadPack.suggestedNextCommands.map((command) => `Suggested command: ${command}`),
    ]),
    '',
    '## Human Approval Required',
    renderBulletBody(leadPack.safetyReminder),
    '',
  ].join('\n');
}

function renderBulletBody(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function getSection(leadPack: LeadPack, title: string): LeadPackSection {
  const section = leadPack.sections.find((candidate) => candidate.title === title);
  if (!section) {
    return {
      title,
      body: ['Section was not generated. Review lead pack rules.'],
    };
  }

  return section;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

main();
