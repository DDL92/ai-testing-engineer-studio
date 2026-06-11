import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { Lead } from '../leads/types';
import { buildSowDraft } from './sowRules';
import { SowDraft, SowSection } from './types';

const outputDir = path.join(process.cwd(), 'output', 'sows');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run sow:generate -- --id sample-bookingflow-ai');
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
  const draft = buildSowDraft({
    lead: scoredLead,
    score: score.score,
    recommendedOffer: score.recommendedOffer,
  });
  const outputPath = path.join(outputDir, `${lead.id}-sow.md`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderSowDraft(draft), 'utf8');

  console.log(`SOW draft generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Lead: ${draft.companyName}`);
  console.log(`Recommended offer: ${draft.recommendedSowOffer}`);
  console.log('No proposal was sent. Human approval is required before sending.');
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function renderSowDraft(draft: SowDraft): string {
  return `# Proposal / SOW: ${draft.companyName}

${renderSection(getSection(draft, 'Executive Summary'))}
${renderSection(getSection(draft, 'Why This Matters'))}
${renderSection(getSection(draft, 'Current QA Opportunity'))}
${renderSection(getSection(draft, 'Recommended Service Path'))}
${renderSection(getSection(draft, 'Pricing Options'))}
${renderSection(getSection(draft, 'Recommended Package'))}
${renderSection(getSection(draft, 'Scope of Work'))}
${renderSection(getSection(draft, 'Deliverables'))}
${renderSection(getSection(draft, 'Timeline'))}
${renderSection(getSection(draft, 'Success Criteria'))}
${renderSection(getSection(draft, 'Upgrade Path'))}
${renderSection(getSection(draft, 'Assumptions'))}
${renderSection(getSection(draft, 'Out of Scope'))}
${renderSection(getSection(draft, 'Client Responsibilities'))}
${renderSection(getSection(draft, 'Terms Notes'))}
${renderSection(getSection(draft, 'Next Step'))}
${renderSection(getSection(draft, 'Manual Review Note'))}
`;
}

function renderSection(section: SowSection): string {
  return `## ${section.title}

${section.body.map((line) => `- ${line}`).join('\n')}
`;
}

function getSection(draft: SowDraft, title: string): SowSection {
  const section = draft.sections.find((candidate) => candidate.title === title);
  if (!section) {
    return {
      title,
      body: ['Section was not generated. Review SOW rules.'],
    };
  }

  return section;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
