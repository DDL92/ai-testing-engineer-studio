import { Lead, LeadScoreResult, RecommendedOffer } from '../leads/types';
import { LeadResearchPack, LeadResearchSection, RevenuePotential } from './types';

const offerRanges: Record<RecommendedOffer, string> = {
  'qa-audit': '$199-$500',
  'playwright-starter-pack': '$900-$1,500',
  'qa-automation-retainer': '$1,500-$3,000/month',
  'agency-partner-retainer': '$1,500-$3,000/month',
  'not-fit': '$0 until fit is confirmed',
};

export function buildResearchPack(lead: Lead, score: LeadScoreResult): LeadResearchPack {
  const scoredLead: Lead = {
    ...lead,
    score: score.score,
    recommendedOffer: score.recommendedOffer,
  };
  const revenuePotential = buildRevenuePotential(score.recommendedOffer);

  return {
    lead: scoredLead,
    score,
    revenuePotential,
    suggestedCommands: buildSuggestedCommands(scoredLead),
    sections: buildSections(scoredLead, score, revenuePotential),
  };
}

function buildSections(lead: Lead, score: LeadScoreResult, revenuePotential: RevenuePotential): LeadResearchSection[] {
  return [
    {
      title: 'Lead Summary',
      body: [
        `Company: ${lead.companyName}`,
        `Website: ${lead.website || 'Not provided'}`,
        `Industry: ${lead.industry}`,
        `Score: ${score.score}/10`,
        `Recommended offer: ${score.recommendedOffer}`,
        `Source: ${lead.source}`,
      ],
    },
    {
      title: 'Why This May Be A Good Fit',
      body: buildFitReasons(lead, score),
    },
    {
      title: 'Potential QA Risk Areas',
      body: buildPotentialRiskAreas(lead),
    },
    {
      title: 'Potential Audit Angles',
      body: buildAuditAngles(lead),
    },
    {
      title: 'Potential Automation Opportunities',
      body: buildAutomationOpportunities(lead),
    },
    {
      title: 'Discovery Call Questions',
      body: buildDiscoveryQuestions(lead),
    },
    {
      title: 'Suggested Proposal Angle',
      body: buildProposalAngle(lead, score),
    },
    {
      title: 'Recommended Offer',
      body: [
        `Recommended offer: ${score.recommendedOffer}`,
        `Reasoning should be reviewed manually. Local scoring reasons: ${score.reasons.join('; ') || 'No scoring reasons available.'}`,
      ],
    },
    {
      title: 'Revenue Potential',
      body: [
        `Potential price range: ${revenuePotential.priceRange}`,
        `Potential engagement path: ${revenuePotential.engagementPath.join(' -> ')}`,
        revenuePotential.note,
      ],
    },
    {
      title: 'Suggested Next Commands',
      body: buildSuggestedCommands(lead),
    },
    {
      title: 'Assumptions & Limitations',
      body: [
        'Generated from local lead data only.',
        'No website inspection was performed.',
        'No external research, APIs, browsing, scraping, enrichment, or credentialed access was used.',
        'Potential risks and opportunities are suggestions for manual review, not claims about the company.',
        'Recommendations require Daniel review before outreach, audit delivery, proposal, or client communication.',
      ],
    },
  ];
}

function buildFitReasons(lead: Lead, score: LeadScoreResult): string[] {
  const reasons: string[] = [];

  reasons.push(`Local lead score is ${score.score}/10 with recommended offer ${score.recommendedOffer}.`);
  if (lead.website) reasons.push('A website is available for manual review.');
  if (lead.fitNotes) reasons.push(`Local notes: ${lead.fitNotes}`);
  if (lead.painPoints.length > 0) reasons.push(`Local pain point notes: ${lead.painPoints.join(', ')}.`);
  if (isRetainerOffer(score.recommendedOffer)) reasons.push('The local score and offer fit suggest possible recurring QA value if discovery confirms need.');
  if (score.recommendedOffer === 'qa-audit') reasons.push('A bounded QA Audit is the safest first paid step because fit should be confirmed before larger scope.');
  if (score.recommendedOffer === 'not-fit') reasons.push('This lead should not move forward unless stronger QA-fit evidence is added manually.');

  return reasons;
}

function buildPotentialRiskAreas(lead: Lead): string[] {
  const text = leadText(lead);
  const risks = new Set<string>();

  addIndustryRisks(text, risks);

  for (const painPoint of lead.painPoints) {
    risks.add(`Potential area for manual review: ${painPoint}.`);
  }

  if (risks.size === 0) {
    risks.add('Potential area for manual review: core navigation and public product flow clarity.');
    risks.add('Potential area for manual review: regression risk around the most important customer workflow.');
  }

  return Array.from(risks);
}

function addIndustryRisks(text: string, risks: Set<string>): void {
  if (text.includes('saas') || text.includes('ai product')) {
    risks.add('Potential area for manual review: onboarding flow risk.');
    risks.add('Potential area for manual review: login/authentication risk.');
    risks.add('Potential area for manual review: regression risk around core product workflows.');
  }

  if (text.includes('e-commerce') || text.includes('ecommerce') || text.includes('shopify')) {
    risks.add('Potential area for manual review: checkout flow risk.');
    risks.add('Potential area for manual review: cart and product selection risk.');
    risks.add('Potential area for manual review: payment handoff risk.');
  }

  if (text.includes('marketplace')) {
    risks.add('Potential area for manual review: search/filter workflow risk.');
    risks.add('Potential area for manual review: buyer/seller account management risk.');
  }

  if (text.includes('booking') || text.includes('reservation') || text.includes('scheduling')) {
    risks.add('Potential area for manual review: reservation flow risk.');
    risks.add('Potential area for manual review: availability and scheduling risk.');
  }

  if (text.includes('fintech')) {
    risks.add('Potential area for manual review: authentication risk.');
    risks.add('Potential area for manual review: transaction workflow risk.');
  }

  if (text.includes('healthtech') || text.includes('healthcare')) {
    risks.add('Potential area for manual review: workflow reliability risk.');
    risks.add('Potential area for manual review: role-based access risk.');
  }

  if (text.includes('agency') || text.includes('studio')) {
    risks.add('Potential area for manual review: repeated launch regression risk across client projects.');
    risks.add('Potential area for manual review: inconsistent QA coverage between client engagements.');
  }
}

function buildAuditAngles(lead: Lead): string[] {
  const text = leadText(lead);
  const angles = new Set<string>([
    'Smoke test audit for the most important public or approved user flow.',
    'Regression readiness audit focused on repeatable release checks.',
    'Navigation audit for core pages and conversion paths.',
  ]);

  if (text.includes('saas') || text.includes('ai product')) angles.add('Onboarding audit for signup, activation, and first-use steps.');
  if (text.includes('e-commerce') || text.includes('ecommerce')) angles.add('Checkout audit for cart, checkout, and payment handoff review.');
  if (text.includes('marketplace')) angles.add('Marketplace workflow audit for search, listings, and account paths.');
  if (text.includes('booking') || text.includes('scheduling')) angles.add('Booking flow audit for availability, reservation, and confirmation paths.');
  if (text.includes('fintech')) angles.add('Dashboard and transaction workflow audit with cautious scope boundaries.');
  if (text.includes('healthtech') || text.includes('healthcare')) angles.add('Role and workflow reliability audit with careful access assumptions.');
  if (text.includes('agency') || text.includes('studio')) angles.add('Agency QA support audit for repeatable launch and maintenance workflows.');

  return Array.from(angles);
}

function buildAutomationOpportunities(lead: Lead): string[] {
  const text = leadText(lead);
  const opportunities = new Set<string>([
    'Suggested opportunity: Playwright smoke suite for critical happy paths.',
    'Suggested opportunity: regression suite for repeatable release confidence.',
    'Suggested opportunity: cross-browser coverage for approved high-value flows.',
  ]);

  if (text.includes('api') || text.includes('integration') || text.includes('fintech') || text.includes('ai product')) {
    opportunities.add('Suggested opportunity: API validation for approved integration or data workflow checks.');
  }

  if (text.includes('ci/cd') || text.includes('cicd') || text.includes('release')) {
    opportunities.add('Suggested opportunity: CI/CD validation to run smoke checks before deployment.');
  }

  if (text.includes('mobile') || text.includes('checkout') || text.includes('booking')) {
    opportunities.add('Suggested opportunity: mobile viewport coverage for important conversion flows.');
  }

  if (text.includes('agency') || text.includes('studio')) {
    opportunities.add('Suggested opportunity: reusable QA starter template for client launches.');
  }

  return Array.from(opportunities);
}

function buildDiscoveryQuestions(lead: Lead): string[] {
  const questions = [
    'Do you currently have automated tests for your most important user flows?',
    'How do you validate releases before they go live?',
    'What are your highest-risk user flows right now?',
    'How often do you deploy or release product changes?',
    'Where do regressions usually create the most support or engineering cost?',
    'Do you have CI/CD in place, and are tests part of that workflow?',
    'Which flows would give the team the most confidence if they were checked automatically?',
  ];

  const text = leadText(lead);

  if (text.includes('agency') || text.includes('studio')) {
    questions.push('Do you need QA support across one client project or multiple recurring client launches?');
  }

  if (text.includes('checkout') || text.includes('payment') || text.includes('e-commerce')) {
    questions.push('Which checkout or payment paths can be safely reviewed without testing real transactions?');
  }

  if (text.includes('booking') || text.includes('scheduling')) {
    questions.push('Which booking or availability scenarios are most important to verify before release?');
  }

  return questions.slice(0, 10);
}

function buildProposalAngle(lead: Lead, score: LeadScoreResult): string[] {
  if (score.recommendedOffer === 'agency-partner-retainer') {
    return [
      'Position the proposal as a bounded QA partner support path for client launches and maintenance work.',
      'Start with a QA Audit to identify repeatable risks, then discuss an Agency Partner Retainer if recurring client QA support is confirmed.',
    ];
  }

  if (score.recommendedOffer === 'qa-automation-retainer') {
    return [
      'Position the proposal around reducing release risk and making regression checks repeatable over time.',
      'Use a QA Audit or starter scope first if discovery has not confirmed recurring maintenance needs.',
    ];
  }

  if (score.recommendedOffer === 'playwright-starter-pack') {
    return [
      'Position the proposal as a first automation foundation for critical flows.',
      'Keep scope limited to a small Playwright smoke suite, failure evidence, and README/run instructions.',
    ];
  }

  if (score.recommendedOffer === 'qa-audit') {
    return [
      'Position the proposal as a low-risk QA Audit to identify practical next steps before larger automation work.',
      'Focus on evidence, prioritized findings, and an automation roadmap rather than broad implementation claims.',
    ];
  }

  return [
    'Do not pitch a paid package yet unless manual research adds stronger QA fit.',
    'Use this pack to identify missing information before any outreach is prepared.',
  ];
}

function buildRevenuePotential(offer: RecommendedOffer): RevenuePotential {
  if (offer === 'agency-partner-retainer') {
    return {
      recommendedOffer: offer,
      priceRange: offerRanges[offer],
      engagementPath: ['QA Audit', 'Agency Partner Retainer'],
      note: 'Potential monthly revenue only if agency partner fit and recurring client QA demand are confirmed manually.',
    };
  }

  if (offer === 'qa-automation-retainer') {
    return {
      recommendedOffer: offer,
      priceRange: offerRanges[offer],
      engagementPath: ['QA Audit', 'Playwright Starter Pack', 'QA Automation Retainer'],
      note: 'Potential monthly revenue only if discovery confirms recurring QA automation maintenance and reporting needs.',
    };
  }

  if (offer === 'playwright-starter-pack') {
    return {
      recommendedOffer: offer,
      priceRange: offerRanges[offer],
      engagementPath: ['QA Audit', 'Playwright Starter Pack', 'QA Automation Retainer'],
      note: 'One-time starter work may become retainer work only after value and maintenance needs are confirmed.',
    };
  }

  if (offer === 'qa-audit') {
    return {
      recommendedOffer: offer,
      priceRange: offerRanges[offer],
      engagementPath: ['QA Audit', 'Playwright Starter Pack', 'QA Automation Retainer'],
      note: 'Start with a small paid audit. Do not assume larger automation scope until evidence and discovery support it.',
    };
  }

  return {
    recommendedOffer: offer,
    priceRange: offerRanges[offer],
    engagementPath: ['Manual qualification required'],
    note: 'No revenue should be assumed unless the lead is manually requalified.',
  };
}

function buildSuggestedCommands(lead: Lead): string[] {
  const commands = [
    `npm run lead:pack -- --id ${lead.id}`,
  ];

  if (lead.website) {
    commands.push(`npm run audit:site -- --url ${lead.website}`);
  }

  commands.push(
    `npm run sow:generate -- --id ${lead.id}`,
    'npm run cockpit',
    'npm run outreach:queue',
  );

  return commands;
}

function leadText(lead: Lead): string {
  return [
    lead.companyName,
    lead.website,
    lead.industry,
    lead.source,
    lead.fitNotes,
    lead.painPoints.join(' '),
    lead.recommendedOffer,
  ].join(' ').toLowerCase();
}

function isRetainerOffer(offer: RecommendedOffer): boolean {
  return offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer';
}
