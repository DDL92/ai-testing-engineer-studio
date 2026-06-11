import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { Lead } from '../leads/types';
import { buildLeadPack } from './leadPackRules';
import { LeadPack, LeadPackSection } from './types';

const outputDir = path.join(process.cwd(), 'output', 'lead-packs');
const outboundOutputDir = path.join(process.cwd(), 'output', 'outbound');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run lead:pack -- --id sample-bookingflow-ai');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Run npm run leads:seed or check data/leads.json for the correct id.`);
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

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(outboundOutputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderLeadPack(leadPack), 'utf8');
  fs.writeFileSync(outboundPath, renderOutboundPlan(leadPack), 'utf8');

  console.log(`Lead pack generated: ${path.relative(process.cwd(), outputPath)}`);
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

main();
