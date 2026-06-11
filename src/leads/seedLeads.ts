import { scoreLead } from './leadScorer';
import { addLead, getTopLeads, readLeads } from './leadStore';
import { NewLeadInput } from './types';

const sampleLeads: NewLeadInput[] = [
  {
    id: 'sample-cloudcart',
    companyName: 'CloudCart Demo',
    website: 'https://cloudcart.example',
    industry: 'SaaS e-commerce',
    source: 'manual-sample',
    status: 'new',
    fitNotes: 'Subscription storefront with checkout and mobile purchase flows that would benefit from Playwright smoke coverage.',
    painPoints: ['checkout regression risk', 'payment failures', 'mobile performance'],
    recommendedOffer: 'qa-audit',
    nextAction: 'Review public flows and approve a manual QA audit offer if fit is confirmed.',
  },
  {
    id: 'sample-bookingflow-ai',
    companyName: 'BookingFlow AI',
    website: 'https://bookingflow-ai.example',
    industry: 'AI product booking platform',
    source: 'manual-sample',
    status: 'new',
    fitNotes: 'AI-assisted booking workflow with signup, onboarding, API integrations, and CI/CD release risk.',
    painPoints: ['signup onboarding', 'API regression', 'CI/CD release confidence'],
    recommendedOffer: 'qa-audit',
    nextAction: 'Review signup and booking flows before proposing a Playwright starter pack.',
  },
  {
    id: 'sample-northstar-fintech',
    companyName: 'Northstar Fintech Sandbox',
    website: 'https://northstar-fintech.example',
    industry: 'fintech SaaS',
    source: 'manual-sample',
    status: 'new',
    fitNotes: 'Financial dashboard with login, payment workflows, API dependencies, and high regression cost.',
    painPoints: ['login reliability', 'payment regression', 'API test coverage'],
    recommendedOffer: 'qa-audit',
    nextAction: 'Prepare a focused audit angle around login, payments, and regression coverage.',
  },
  {
    id: 'sample-launchlab-studio',
    companyName: 'LaunchLab Studio',
    website: 'https://launchlab-studio.example',
    industry: 'software agency',
    source: 'manual-sample',
    status: 'new',
    fitNotes: 'Agency partner potential with multiple client apps and white-label QA automation needs.',
    painPoints: ['flaky tests', 'regression coverage', 'client portfolio QA support'],
    recommendedOffer: 'agency-partner-retainer',
    nextAction: 'Review agency fit and approve partner-retainer positioning before outreach.',
  },
  {
    id: 'sample-local-directory',
    companyName: 'Local Services Directory Demo',
    website: '',
    industry: 'vague general local business directory',
    source: 'manual-sample',
    status: 'paused',
    fitNotes: 'Poor fit sample included to verify scoring caps and not-fit handling.',
    painPoints: ['unclear QA need'],
    recommendedOffer: 'not-fit',
    nextAction: 'Do not prioritize unless new software-product evidence appears.',
  },
];

function seedLeads(): void {
  const existingIds = new Set(readLeads().map((lead) => lead.id));
  const added: string[] = [];
  const skipped: string[] = [];

  for (const sampleLead of sampleLeads) {
    if (existingIds.has(sampleLead.id)) {
      skipped.push(sampleLead.companyName);
      continue;
    }

    const scoreResult = scoreLead(sampleLead);
    addLead({
      ...sampleLead,
      score: scoreResult.score,
      recommendedOffer: scoreResult.recommendedOffer,
    });
    added.push(`${sampleLead.companyName} (${scoreResult.score}/10, ${scoreResult.recommendedOffer})`);
  }

  console.log(`Lead seed complete: ${added.length} added, ${skipped.length} skipped.`);
  if (added.length > 0) console.log(`Added: ${added.join('; ')}`);
  if (skipped.length > 0) console.log(`Skipped: ${skipped.join('; ')}`);

  const topLeads = getTopLeads(3).map((lead) => `${lead.companyName}: ${lead.score}/10 (${lead.recommendedOffer})`);
  console.log(`Top leads: ${topLeads.join('; ')}`);
  console.log('No outreach was sent. Human approval is required before any contact.');
}

seedLeads();
