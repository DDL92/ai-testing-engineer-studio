import { scoreLead } from './leadScorer';
import { readLeads, writeLeads } from './leadStore';
import { parseLeadCliInput } from './leadInputParser';
import { createUniqueLeadId, normalizeCompanyName, normalizeWebsite } from './leadId';
import { Lead } from './types';

function main(): void {
  let input;

  try {
    input = parseLeadCliInput(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error('Example: npm run lead:add -- --company "Acme SaaS" --website "https://acme.com" --industry "SaaS" --source "LinkedIn" --notes "Signup and onboarding flow may benefit from smoke coverage"');
    process.exit(1);
  }

  const leads = readLeads();
  const duplicate = findDuplicateLead(leads, input.company, input.website);

  if (duplicate) {
    console.log('Duplicate lead detected. No new lead was added.');
    console.log(`Existing lead ID: ${duplicate.id}`);
    console.log(`Company: ${duplicate.companyName}`);
    console.log(`Website: ${duplicate.website}`);
    console.log('Review the existing lead or update it manually if needed.');
    return;
  }

  const id = createUniqueLeadId(input.company, leads);
  const scoreResult = scoreLead({
    companyName: input.company,
    website: input.website,
    industry: input.industry,
    source: input.source,
    fitNotes: input.notes,
    painPoints: input.painPoints,
    recommendedOffer: 'qa-audit',
  });
  const now = new Date().toISOString();
  const lead: Lead = {
    id,
    companyName: input.company,
    website: input.website,
    industry: input.industry,
    source: input.source,
    status: 'new',
    fitNotes: buildFitNotes(input),
    painPoints: input.painPoints,
    recommendedOffer: scoreResult.recommendedOffer,
    score: scoreResult.score,
    createdAt: now,
    updatedAt: now,
    nextAction: input.nextAction,
  };

  writeLeads([...leads, lead]);

  console.log('Lead added.');
  console.log(`Company: ${lead.companyName}`);
  console.log(`Lead ID: ${lead.id}`);
  console.log(`Score: ${lead.score}/10`);
  console.log(`Recommended offer: ${lead.recommendedOffer}`);
  console.log('Scoring reasons:');
  for (const reason of scoreResult.reasons) {
    console.log(`- ${reason}`);
  }
  console.log('Suggested next commands:');
  console.log(`- npm run lead:pack -- --id ${lead.id}`);
  console.log(`- npm run audit:site -- --url ${lead.website}`);
  console.log(`- npm run sow:generate -- --id ${lead.id}`);
  console.log('- npm run day:plan');
  console.log('- npm run cockpit');
  console.log('No outreach was sent. Human approval is required before contact.');
}

function findDuplicateLead(leads: Lead[], companyName: string, website: string): Lead | undefined {
  const normalizedCompany = normalizeCompanyName(companyName);
  const normalizedWebsite = normalizeWebsite(website);

  return leads.find((lead) => (
    normalizeCompanyName(lead.companyName) === normalizedCompany
    || normalizeWebsite(lead.website) === normalizedWebsite
  ));
}

function buildFitNotes(input: ReturnType<typeof parseLeadCliInput>): string {
  const details = [input.notes.trim()];

  if (input.contactName || input.contactRole || input.contactUrl) {
    details.push(`Manual contact context: ${[
      input.contactName && `name=${input.contactName}`,
      input.contactRole && `role=${input.contactRole}`,
      input.contactUrl && `url=${input.contactUrl}`,
    ].filter(Boolean).join(', ')}`);
  }

  return details.filter(Boolean).join(' ');
}

main();
