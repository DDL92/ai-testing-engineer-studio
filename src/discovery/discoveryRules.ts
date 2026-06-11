import { DiscoveryIcp, DiscoverySource, HighProbabilityTarget, LeadDiscoveryReport } from './types';

export function buildLeadDiscoveryReport(): LeadDiscoveryReport {
  return {
    date: new Date().toISOString().slice(0, 10),
    recommendedIcps: buildRecommendedIcps(),
    highProbabilityTargets: buildHighProbabilityTargets(),
    whereToLook: buildDiscoverySources(),
    searchQueries: buildSearchQueries(),
    leadResearchWorkflow: [
      'Find company category or directory result manually.',
      'Review website manually for product workflows, signup, checkout, booking, dashboards, or agency services.',
      'Add lead with npm run lead:add only if the company appears relevant.',
      'Generate research pack with npm run lead:research.',
      'Generate lead pack with npm run lead:pack.',
      'Generate audit only when the URL is appropriate and public.',
      'Generate SOW only after manual qualification.',
    ],
    dailyDiscoveryPlan: [
      'Spend 10 minutes reviewing ICP category and search query options.',
      'Spend 10 minutes manually reviewing company websites or directory listings.',
      'Spend 10 minutes adding 3-5 quality leads or updating the first-50 queue.',
      'Stop when quality drops. Do not chase volume.',
    ],
    weeklyDiscoveryGoal: [
      'Add or qualify 15-25 quality leads per week.',
      'Prioritize leads with visible product workflows, clear QA risk, and realistic audit or retainer fit.',
      'Keep the first 50 list current before expanding into larger volume.',
    ],
    suggestedNextCommands: [
      'npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "SaaS" --source "Manual Research" --notes "Why this is a fit"',
      'npm run lead:research -- --id lead_id',
      'npm run lead:pack -- --id lead_id',
      'npm run audit:site -- --url https://example.com',
      'npm run sow:generate -- --id lead_id',
      'npm run outreach:queue',
      'npm run cockpit',
    ],
    safetyRules: [
      'No scraping.',
      'No automated outreach.',
      'No mass messaging.',
      'No auto-DMs.',
      'No browser automation.',
      'No APIs, credentials, CRM integrations, or lead databases created from the internet.',
      'Manual review is required before adding leads, preparing outreach, sending messages, generating proposals, or client communication.',
    ],
  };
}

function buildRecommendedIcps(): DiscoveryIcp[] {
  return [
    {
      priority: 1,
      name: 'SaaS',
      whyItFits: 'SaaS products usually have onboarding, dashboards, account flows, integrations, and frequent releases.',
      auditAngle: 'Onboarding and regression readiness audit.',
      retainerPotential: 'High when the product ships frequently or needs ongoing smoke/regression coverage.',
      difficultyLevel: 'medium',
    },
    {
      priority: 2,
      name: 'E-commerce',
      whyItFits: 'E-commerce teams depend on checkout, cart, product, and mobile purchase flows working consistently.',
      auditAngle: 'Checkout and mobile purchase flow audit.',
      retainerPotential: 'Medium to high when releases, campaigns, or platform changes happen often.',
      difficultyLevel: 'medium',
    },
    {
      priority: 3,
      name: 'Booking Platforms',
      whyItFits: 'Booking products have availability, reservation, confirmation, calendar, and notification workflows.',
      auditAngle: 'Booking flow and availability audit.',
      retainerPotential: 'High when booking reliability directly affects revenue or operations.',
      difficultyLevel: 'medium',
    },
    {
      priority: 4,
      name: 'Marketplaces',
      whyItFits: 'Marketplaces have multiple user roles, listings, search, account flows, and transaction paths.',
      auditAngle: 'Buyer/seller workflow and search/filter audit.',
      retainerPotential: 'High when both sides of the marketplace require ongoing release confidence.',
      difficultyLevel: 'high',
    },
    {
      priority: 5,
      name: 'Fintech',
      whyItFits: 'Fintech products often have login, account, transaction, dashboard, and API workflows with high trust requirements.',
      auditAngle: 'Authentication and transaction workflow audit with careful scope boundaries.',
      retainerPotential: 'High when safe staging access and bounded workflows are available.',
      difficultyLevel: 'high',
    },
    {
      priority: 6,
      name: 'Agencies',
      whyItFits: 'Agencies may need recurring QA support across launches, maintenance retainers, and client projects.',
      auditAngle: 'Agency QA support audit for launch and maintenance workflows.',
      retainerPotential: 'High when the agency has multiple active client builds and no dedicated QA automation support.',
      difficultyLevel: 'medium',
    },
    {
      priority: 7,
      name: 'HealthTech',
      whyItFits: 'HealthTech products can have scheduling, intake, portals, roles, and workflow reliability needs.',
      auditAngle: 'Workflow reliability and role-based access audit with cautious claims.',
      retainerPotential: 'Medium to high when access is safe, explicit, and carefully scoped.',
      difficultyLevel: 'high',
    },
  ];
}

function buildHighProbabilityTargets(): HighProbabilityTarget[] {
  return [
    { category: 'B2B SaaS', reason: 'Often has onboarding, dashboards, and repeat release cycles.' },
    { category: 'Scheduling SaaS', reason: 'Booking and availability flows are natural QA audit targets.' },
    { category: 'Reservation software', reason: 'Reservation paths create clear smoke test opportunities.' },
    { category: 'Gym management software', reason: 'Membership, scheduling, and payment-adjacent flows may need QA review.' },
    { category: 'Property management software', reason: 'Tenant, owner, payment-adjacent, and maintenance workflows can be complex.' },
    { category: 'Travel booking systems', reason: 'Search, availability, booking, and confirmation workflows are high value.' },
    { category: 'E-commerce stores', reason: 'Checkout, cart, mobile, and product flows are easy to scope for audits.' },
    { category: 'Shopify stores', reason: 'Theme, app, checkout-adjacent, and mobile changes can create regression risk.' },
    { category: 'Digital agencies', reason: 'May need partner QA support for client launches.' },
    { category: 'Shopify agencies', reason: 'Often manage multiple storefronts with recurring QA needs.' },
    { category: 'Product studios', reason: 'Launch and maintenance work can support partner-retainer positioning.' },
    { category: 'AI workflow products', reason: 'Onboarding, integration, and release confidence may be important.' },
    { category: 'Fintech dashboards', reason: 'Authentication and workflow reliability can justify careful QA review.' },
    { category: 'HealthTech scheduling tools', reason: 'Scheduling and role-based workflows often need cautious manual qualification.' },
  ];
}

function buildDiscoverySources(): DiscoverySource[] {
  return [
    { name: 'LinkedIn company search', useCase: 'Find companies by category, industry, hiring signal, and founder/product leader activity.', safetyNote: 'Review manually. Do not automate LinkedIn or send auto-DMs.' },
    { name: 'Crunchbase manual review', useCase: 'Find funded startups and product categories worth manual review.', safetyNote: 'Use manual browsing only. Do not scrape or export lists.' },
    { name: 'Product Hunt', useCase: 'Find recently launched SaaS, AI, workflow, booking, and marketplace products.', safetyNote: 'Use as a discovery source only. Validate fit manually.' },
    { name: 'G2', useCase: 'Find SaaS categories and vendor lists for manual company review.', safetyNote: 'Do not scrape profiles or automate collection.' },
    { name: 'Capterra', useCase: 'Find vertical software categories like gym, property, scheduling, and healthcare tools.', safetyNote: 'Use categories and manual review only.' },
    { name: 'Clutch', useCase: 'Find agencies, software studios, Shopify agencies, and product teams.', safetyNote: 'Do not mass-message agencies.' },
    { name: 'Agency directories', useCase: 'Find agencies that may need QA partner support.', safetyNote: 'Review services and fit manually.' },
    { name: 'Startup directories', useCase: 'Find early product companies with active releases.', safetyNote: 'Do not bulk extract records.' },
    { name: 'Local business software providers', useCase: 'Find local or vertical software companies with real web-product workflows.', safetyNote: 'Avoid brochure sites without product complexity.' },
  ];
}

function buildSearchQueries(): string[] {
  return [
    'site:linkedin.com/company SaaS booking software',
    'site:linkedin.com/company "B2B SaaS" "workflow automation"',
    'site:linkedin.com/company "property management software"',
    'site:linkedin.com/company "gym management software"',
    'site:linkedin.com/company "travel booking platform"',
    'site:linkedin.com/company "healthtech SaaS"',
    'site:linkedin.com/company "Shopify agency"',
    '"property management software"',
    '"gym management software"',
    '"travel booking platform"',
    '"healthtech SaaS"',
    '"booking software" "free trial"',
    '"reservation software" "demo"',
    '"scheduling software" "integrations"',
    '"marketplace platform" "startup"',
    '"B2B SaaS" "customer portal"',
    '"SaaS onboarding" "free trial"',
    '"workflow automation software" "demo"',
    '"field service management software"',
    '"appointment booking software"',
    '"rental management software"',
    '"event booking platform"',
    '"subscription ecommerce platform"',
    '"Shopify Plus agency"',
    '"digital product studio" "web app"',
    '"software agency" "maintenance retainer"',
    '"AI workflow software" "signup"',
    '"fintech dashboard" "SaaS"',
    '"patient scheduling software"',
    '"client portal software" "SaaS"',
  ];
}
