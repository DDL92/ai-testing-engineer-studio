import fs = require('fs');
import path = require('path');
import {
  ClientOfferPack,
  CommercialTerms,
  ExclusionDefinition,
  LeadDefinition,
  OfferDeliverable,
  OfferTier,
} from './clientOfferTypes';

const clientName = 'Flora and Fauna Foods';
const outputDir = path.join(process.cwd(), 'output', 'client-offer');
const outputPaths = {
  offerMarkdown: path.join(outputDir, 'flora-offer-pack.md'),
  offerJson: path.join(outputDir, 'flora-offer-pack.json'),
  pricingMarkdown: path.join(outputDir, 'flora-pricing.md'),
  pricingJson: path.join(outputDir, 'flora-pricing.json'),
  deliverablesMarkdown: path.join(outputDir, 'flora-deliverables.md'),
  termsMarkdown: path.join(outputDir, 'flora-terms.md'),
};

export function generateClientOfferPack(now = new Date()): ClientOfferPack {
  const pack = buildClientOfferPack(now);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPaths.offerMarkdown, renderOfferPack(pack), 'utf8');
  fs.writeFileSync(outputPaths.offerJson, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputPaths.pricingMarkdown, renderPricing(pack.pricing), 'utf8');
  fs.writeFileSync(outputPaths.pricingJson, `${JSON.stringify(pack.pricing, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outputPaths.deliverablesMarkdown, renderDeliverables(pack.deliverables), 'utf8');
  fs.writeFileSync(outputPaths.termsMarkdown, renderTerms(pack.terms), 'utf8');

  return pack;
}

export function getCommercialReadiness(): {
  offerStatus: string;
  pricingStatus: string;
  termsStatus: string;
  valueModelStatus: string;
} {
  return {
    offerStatus: exists(outputPaths.offerMarkdown, outputPaths.offerJson) ? 'READY' : 'MISSING',
    pricingStatus: exists(outputPaths.pricingMarkdown, outputPaths.pricingJson) ? 'READY' : 'MISSING',
    termsStatus: exists(outputPaths.termsMarkdown) ? 'READY' : 'MISSING',
    valueModelStatus: exists(path.join(outputDir, 'value-estimate.md'), path.join(outputDir, 'value-estimate.json')) ? 'READY' : 'MISSING',
  };
}

function buildClientOfferPack(now: Date): ClientOfferPack {
  return {
    generatedAt: now.toISOString(),
    client: clientName,
    serviceName: 'AI Lead Discovery',
    serviceExplanation: {
      title: 'What is AI Lead Discovery?',
      summary: 'AI Lead Discovery is a local-first lead research workflow that finds recent buyer-intent signals, organizes human-reviewed leads, and turns public opportunity context into a practical sales intelligence package.',
      capabilities: [
        'Recent buyer-intent discovery from approved local data sources and public signals.',
        'Human-reviewed leads with review status, confidence, source context, and notes.',
        'Context-rich opportunities that explain why a lead may be commercially relevant.',
        'Lead prioritization by intent strength, recency, buyer role, and fit.',
        'Sales intelligence including event type, location, buyer signals, and recommended next action.',
        'Manual approval workflow before any client-facing use or human-led contact step.',
      ],
      explicitLimits: [
        'The system does NOT send emails.',
        'The system does NOT send DMs.',
        'The system does NOT scrape private information.',
        'The system does NOT automatically contact prospects.',
      ],
    },
    leadDefinitions: leadDefinitions(),
    exclusions: exclusions(),
    pricing: pricing(),
    deliverables: deliverables(),
    terms: terms(),
    readiness: {
      offerStatus: 'READY',
      pricingStatus: 'READY',
      termsStatus: 'READY',
      valueModelStatus: getCommercialReadiness().valueModelStatus === 'READY' ? 'READY' : 'PENDING',
    },
  };
}

function leadDefinitions(): LeadDefinition[] {
  return [
    {
      name: 'Qualified Cold Lead',
      definition: 'A public opportunity or organization that appears relevant to Flora and Fauna Foods, but has not shown direct buying urgency yet.',
      requirements: ['Relevant geography', 'Relevant event or catering need', 'Non-excluded source', 'Manual review note'],
      typicalSignals: ['Event planning mention', 'Venue or organization context', 'Catering-adjacent need', 'Recent public activity'],
      confidenceExpectation: 'Medium confidence. Useful for research and light prioritization, not proof of active demand.',
    },
    {
      name: 'Warm Intent Lead',
      definition: 'A reviewed lead with stronger signs that someone is planning, requesting, or discussing an event where food, bar, rental, or catering support may be needed.',
      requirements: ['Buyer-intent signal', 'Recent enough to act on', 'Commercial fit', 'Clear recommended action'],
      typicalSignals: ['Wedding', 'Corporate Event', 'Fundraiser', 'Private Dinner', 'Bar Service'],
      confidenceExpectation: 'Medium to high confidence depending on recency, source quality, and buyer signal strength.',
    },
    {
      name: 'Interest-Verified Lead',
      definition: 'A lead prepared for optional human-led verification after manual approval, with enough context to support a soft, respectful contact step by the client.',
      requirements: ['High confidence', 'Clear buyer role', 'Specific intent evidence', 'Manual approval before contact'],
      typicalSignals: ['Direct request for vendors', 'Event timeline', 'Budget or guest-count signal', 'Recent intent evidence'],
      confidenceExpectation: 'Highest confidence tier, but still probabilistic and not a sales guarantee.',
    },
  ];
}

function exclusions(): ExclusionDefinition[] {
  return [
    { name: 'Job posts', reason: 'Hiring intent is not buyer intent for catering services.', examples: ['Catering staff wanted', 'Server job opening'] },
    { name: 'Staffing recruitment', reason: 'Recruiters and job seekers are not service buyers.', examples: ['Hospitality recruiter post', 'Chef looking for work'] },
    { name: 'Vendor advertisements', reason: 'Vendor promotion does not indicate a buyer need.', examples: ['Caterer ad', 'Venue marketing listing'] },
    { name: 'Directories', reason: 'Lists of businesses usually lack recent buyer intent.', examples: ['Best caterers list', 'Vendor directory page'] },
    { name: 'Articles', reason: 'Editorial content may be relevant background but is not a current lead.', examples: ['Event recap', 'Catering trend article'] },
    { name: 'Old or stale requests', reason: 'Expired opportunities reduce commercial usefulness.', examples: ['Past event request', 'Outdated planning thread'] },
    { name: 'Recommendation lists without intent', reason: 'Generic recommendations do not show a current buyer need.', examples: ['General vendor recommendations', 'Evergreen planning list'] },
    { name: 'Unverifiable posts', reason: 'Insufficient evidence prevents responsible delivery.', examples: ['Missing source context', 'Ambiguous author or timing'] },
    { name: 'Spam', reason: 'Low-quality or deceptive content is excluded from delivery.', examples: ['Keyword stuffing', 'Suspicious duplicate posts'] },
  ];
}

function pricing(): OfferTier[] {
  return [
    {
      name: 'Pilot Package',
      leadVolume: '10-15 reviewed leads',
      cadence: 'One delivery report',
      priceRange: '$250-$500',
      bestFor: 'Testing lead quality and sales workflow fit.',
      includes: ['Reviewed lead table', 'Sales intelligence', 'Review notes', 'Recommended actions'],
    },
    {
      name: 'Growth Package',
      leadVolume: '20-40 reviewed leads',
      cadence: 'Weekly delivery with monthly reporting',
      priceRange: '$750-$1,500/month',
      bestFor: 'Consistent weekly prospecting support.',
      includes: ['Weekly reviewed lead delivery', 'Monthly commercial summary', 'Trend notes', 'Prioritized sales actions'],
    },
    {
      name: 'Premium Package',
      leadVolume: 'Warm Intent Leads',
      cadence: 'Priority review',
      priceRange: 'Custom',
      bestFor: 'Higher-touch warm lead review and interest verification preparation.',
      includes: ['Priority review', 'Interest verification preparation', 'Expanded sales notes', 'Executive opportunity summary'],
    },
  ];
}

function deliverables(): OfferDeliverable[] {
  const allTiers = ['Pilot Package', 'Growth Package', 'Premium Package'] as const;
  return [
    { name: 'Lead table', description: 'Structured table of reviewed leads and source context.', includedIn: [...allTiers] },
    { name: 'Review status', description: 'Manual review state for each lead.', includedIn: [...allTiers] },
    { name: 'Confidence score', description: 'Probabilistic confidence score based on available evidence.', includedIn: [...allTiers] },
    { name: 'Intent strength', description: 'Assessment of likely buyer intent.', includedIn: [...allTiers] },
    { name: 'Recency', description: 'How current the opportunity appears to be.', includedIn: [...allTiers] },
    { name: 'Location', description: 'Relevant event or buyer geography when available.', includedIn: [...allTiers] },
    { name: 'Source', description: 'Source name and URL for review.', includedIn: [...allTiers] },
    { name: 'Recommended action', description: 'WAIT, RESEARCH_MORE, SOFT_CONTACT, REJECT, or HIGH_PRIORITY.', includedIn: [...allTiers] },
    { name: 'Review notes', description: 'Human-readable rationale and caveats.', includedIn: [...allTiers] },
    { name: 'Commercial summary', description: 'Summary of lead mix, themes, and sales priorities.', includedIn: [...allTiers] },
    { name: 'Estimated opportunity value', description: 'Assumption-based commercial estimate, not a guarantee.', includedIn: [...allTiers] },
  ];
}

function terms(): CommercialTerms {
  return {
    leadQuality: 'Lead quality is probabilistic and depends on available public signals, source quality, recency, and manual review.',
    salesGuarantee: 'There is no guarantee of closed sales, meetings, responses, bookings, or revenue.',
    outreachResponsibility: 'The client performs any outreach. This system does not send messages or contact prospects.',
    humanReview: 'Human review is required before delivery, contact, or client-facing use.',
    interestVerification: 'Interest verification is optional and must be performed manually after approval.',
    advisoryUse: 'Recommendations are advisory and should be reviewed against the client sales process.',
  };
}

function renderOfferPack(pack: ClientOfferPack): string {
  return `# Flora Client-Facing Offer Pack

Generated: ${pack.generatedAt}

## ${pack.serviceExplanation.title}

${pack.serviceExplanation.summary}

${pack.serviceExplanation.capabilities.map((capability) => `- ${capability}`).join('\n')}

## Explicit Limits

${pack.serviceExplanation.explicitLimits.map((limit) => `- ${limit}`).join('\n')}

## What Counts As A Lead

${pack.leadDefinitions.map(renderLeadDefinition).join('\n\n')}

## What Does Not Count

${pack.exclusions.map((exclusion) => `### ${exclusion.name}\n\n${exclusion.reason}\n\nExamples: ${exclusion.examples.join(', ')}.`).join('\n\n')}

## Pricing

${renderPricingTable(pack.pricing)}

## Deliverables

${renderDeliverableTable(pack.deliverables)}

## Commercial Terms

${renderTermsList(pack.terms)}
`;
}

function renderPricing(tiers: OfferTier[]): string {
  return `# Flora Pricing

${renderPricingTable(tiers)}

Pricing is suggested for revenue validation and can be adjusted after pilot feedback.
`;
}

function renderDeliverables(items: OfferDeliverable[]): string {
  return `# Flora Deliverables

${renderDeliverableTable(items)}
`;
}

function renderTerms(commercialTerms: CommercialTerms): string {
  return `# Flora Commercial Terms

${renderTermsList(commercialTerms)}
`;
}

function renderLeadDefinition(definition: LeadDefinition): string {
  return `### ${definition.name}

${definition.definition}

Requirements: ${definition.requirements.join(', ')}.

Typical signals: ${definition.typicalSignals.join(', ')}.

Confidence expectation: ${definition.confidenceExpectation}`;
}

function renderPricingTable(tiers: OfferTier[]): string {
  return `| Package | Lead volume | Cadence | Suggested pricing | Best for | Includes |
| --- | --- | --- | --- | --- | --- |
${tiers.map((tier) => `| ${tier.name} | ${tier.leadVolume} | ${tier.cadence} | ${tier.priceRange} | ${tier.bestFor} | ${tier.includes.join('; ')} |`).join('\n')}`;
}

function renderDeliverableTable(items: OfferDeliverable[]): string {
  return `| Deliverable | Description | Included in |
| --- | --- | --- |
${items.map((item) => `| ${item.name} | ${item.description} | ${item.includedIn.join(', ')} |`).join('\n')}`;
}

function renderTermsList(commercialTerms: CommercialTerms): string {
  return `- Lead quality is probabilistic: ${commercialTerms.leadQuality}
- No guarantee of closed sales: ${commercialTerms.salesGuarantee}
- Client performs outreach: ${commercialTerms.outreachResponsibility}
- Human review required: ${commercialTerms.humanReview}
- Interest verification is optional: ${commercialTerms.interestVerification}
- Recommendations are advisory: ${commercialTerms.advisoryUse}`;
}

function exists(...filePaths: string[]): boolean {
  return filePaths.every((filePath) => fs.existsSync(filePath));
}

if (require.main === module) {
  generateClientOfferPack();
  console.log(`Generated client offer pack: ${Object.values(outputPaths).map((filePath) => path.relative(process.cwd(), filePath)).join(', ')}`);
}
