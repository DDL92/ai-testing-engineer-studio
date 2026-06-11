import fs = require('fs');
import path = require('path');
import { scoreLead } from '../leads/leadScorer';
import { getLeadById } from '../leads/leadStore';
import { buildClientOnboardingDocuments, eligibilityFailureReason, isEligibleForClientWorkflow } from './clientWorkflowRules';
import { ClientWorkflowInput, LocalWorkflowSource } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'client-workflows');

function main(): void {
  const id = parseLeadId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run client:onboard -- --id pushpress');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const score = scoreLead(lead);
  if (!isEligibleForClientWorkflow(lead, score)) {
    exitWithError(eligibilityFailureReason(lead, score));
  }

  const input = buildInput(lead, score);
  const documents = buildClientOnboardingDocuments(input);
  const outputDir = path.join(outputRoot, lead.id);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const document of documents) {
    fs.writeFileSync(path.join(outputDir, document.fileName), document.body, 'utf8');
  }

  console.log(`Client onboarding workflow generated: ${path.relative(process.cwd(), outputDir)}`);
  for (const document of documents) {
    console.log(`- ${path.relative(process.cwd(), path.join(outputDir, document.fileName))}`);
  }
  console.log(`Lead: ${lead.companyName}`);
  console.log(`Score: ${score.score}/10`);
  console.log(`Recommended offer: ${score.recommendedOffer}`);
  console.log('No outreach, invoices, payment integrations, calls, APIs, scraping, browsing, credentials, or CRM actions were used.');
  console.log('Human approval is required before onboarding or delivery work starts.');
}

function buildInput(lead: NonNullable<ReturnType<typeof getLeadById>>, score: ReturnType<typeof scoreLead>): ClientWorkflowInput {
  return {
    lead: { ...lead, score: score.score, recommendedOffer: score.recommendedOffer },
    score,
    researchPack: readLocalSource('Research pack', path.join('output', 'research', `${lead.id}-research-pack.md`)),
    auditPack: readLocalSource('Audit pack', path.join('output', 'audit-packs', lead.id)),
    outreachPack: readLocalSource('Outreach pack', path.join('output', 'outreach-packs', lead.id)),
    contactReview: readLocalSource('Contact review', path.join('output', 'contact-reviews', lead.id, 'contact-review.md')),
  };
}

function readLocalSource(label: string, relativePath: string): LocalWorkflowSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);

  return {
    label,
    path: relativePath,
    exists,
    content: exists && fs.statSync(absolutePath).isFile() ? fs.readFileSync(absolutePath, 'utf8') : undefined,
  };
}

function parseLeadId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
