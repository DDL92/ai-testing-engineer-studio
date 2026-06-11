import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { buildResearchPack } from './researchRules';
import { LeadResearchPack, LeadResearchSection } from './types';

const outputDir = path.join(process.cwd(), 'output', 'research');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run lead:research -- --id acme-saas-demo');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const score = scoreLead(lead);
  const researchPack = buildResearchPack(lead, score);
  const outputPath = path.join(outputDir, `${lead.id}-research-pack.md`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderResearchPack(researchPack), 'utf8');

  console.log(`Lead research pack generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Lead: ${researchPack.lead.companyName}`);
  console.log(`Score: ${researchPack.score.score}/10`);
  console.log(`Recommended offer: ${researchPack.score.recommendedOffer}`);
  console.log('No external research, scraping, browsing, APIs, or outreach were used.');
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function renderResearchPack(pack: LeadResearchPack): string {
  return `# Lead Research Pack

${renderSection(getSection(pack, 'Lead Summary'))}
${renderSection(getSection(pack, 'Why This May Be A Good Fit'))}
${renderSection(getSection(pack, 'Potential QA Risk Areas'))}
${renderSection(getSection(pack, 'Potential Audit Angles'))}
${renderSection(getSection(pack, 'Potential Automation Opportunities'))}
${renderSection(getSection(pack, 'Discovery Call Questions'))}
${renderSection(getSection(pack, 'Suggested Proposal Angle'))}
${renderSection(getSection(pack, 'Recommended Offer'))}
${renderSection(getSection(pack, 'Revenue Potential'))}
${renderSection(getSection(pack, 'Suggested Next Commands'))}
${renderSection(getSection(pack, 'Assumptions & Limitations'))}
`;
}

function renderSection(section: LeadResearchSection): string {
  return `## ${section.title}

${section.body.map((line) => `- ${line}`).join('\n')}
`;
}

function getSection(pack: LeadResearchPack, title: string): LeadResearchSection {
  const section = pack.sections.find((candidate) => candidate.title === title);
  if (!section) {
    return {
      title,
      body: ['Section was not generated. Review research rules.'],
    };
  }

  return section;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
