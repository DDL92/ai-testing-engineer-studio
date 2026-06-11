import { Lead } from '../leads/types';
import {
  DiscoverySourceGuidance,
  LeadDiscoveryAutomationInput,
  LeadDiscoveryTier,
  LeadInventorySummary,
  SearchQueryGroup,
  TierCounts,
} from './types';

export const leadAddCommandTemplate = 'npm run lead:add -- --company "Company Name" --website "https://example.com" --industry "Industry" --source "Manual research" --notes "Reason this lead fits."';

export function buildLeadInventorySummary(leads: Lead[]): LeadInventorySummary {
  return {
    totalLeads: leads.length,
    tierCounts: buildTierCounts(leads),
    topIcps: buildTopIcps(leads),
  };
}

export function buildDiscoveryAssistant(input: LeadDiscoveryAutomationInput): string {
  return [
    '# Lead Discovery Automation Assistant',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    '## Current Lead Inventory',
    renderInventory(input.inventory),
    '',
    'Local context read:',
    renderContextSources(input),
    '',
    '## Best ICPs',
    renderList(bestIcps()),
    '',
    '## Recommended Search Sources',
    renderSources(recommendedSearchSources()),
    '',
    '## Search Queries',
    renderSearchQueryGroups(searchQueryGroups()),
    '',
    '## Lead Qualification Rules',
    renderList(leadQualificationRules()),
    '',
    '## Manual Approval Workflow',
    renderNumberedList(manualApprovalWorkflow()),
    '',
    '## Do Not Automate',
    renderList(doNotAutomateRules()),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands()),
    '',
  ].join('\n');
}

export function buildSearchPlaybook(input: LeadDiscoveryAutomationInput): string {
  const groups = searchQueryGroups();
  const totalQueries = groups.reduce((sum, group) => sum + group.queries.length, 0);

  return [
    '# Search Playbook',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    `Total search queries: ${totalQueries}`,
    '',
    'Use these queries manually in public search tools. Do not scrape, automate browsing, call APIs, export lists, enrich contacts, or send outreach from this playbook.',
    '',
    renderSearchQueryGroups(groups),
    '',
    '## Review Notes',
    renderList([
      'Open results manually and inspect the public product or service page.',
      'Prefer companies with visible SaaS workflows, booking flows, onboarding, dashboards, mobile flows, integrations, or recurring release risk.',
      'Skip vague directories, pure content sites, companies with no software workflow, or anything requiring private data to evaluate.',
      'Only add a lead after Daniel approves the company manually.',
    ]),
    '',
  ].join('\n');
}

export function buildCandidateQueue(input: LeadDiscoveryAutomationInput): string {
  return [
    '# Lead Candidate Queue',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    'This is a manual-entry queue. Do not invent companies. Fill rows only after Daniel manually reviews public search results and approves each candidate for local intake.',
    '',
    '## Current Lead Inventory',
    renderInventory(input.inventory),
    '',
    '## Manual Candidate Table',
    renderCandidateTable(),
    '',
    '## Suggested Lead Add Command Template',
    '',
    '```sh',
    leadAddCommandTemplate,
    '```',
    '',
    '## Queue Rules',
    renderList([
      'Use public-search guidance only.',
      'No scraping, APIs, browser automation, CRM, outreach automation, email automation, LinkedIn automation, payments, credentials, or external databases.',
      'Do not add private contact data.',
      'Do not add a candidate until Daniel approves it.',
      'Keep the reason specific to visible public product or service workflows.',
    ]),
    '',
  ].join('\n');
}

export function buildLeadApprovalChecklist(input: LeadDiscoveryAutomationInput): string {
  return [
    '# Lead Approval Checklist',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    'Use this checklist before turning a manually discovered candidate into a local lead record.',
    '',
    '- [ ] Company exists.',
    '- [ ] Website works.',
    '- [ ] Public product/service visible.',
    '- [ ] Likely SaaS or service business.',
    '- [ ] Relevant workflows exist.',
    '- [ ] QA pain likely.',
    '- [ ] No private data used.',
    '- [ ] No scraping used.',
    '- [ ] No contact automation.',
    '- [ ] Daniel approves before adding.',
    '',
    '## Approval Output',
    '',
    'If every relevant box is checked and Daniel approves the lead, add it locally with:',
    '',
    '```sh',
    leadAddCommandTemplate,
    '```',
    '',
    'If any required box is unclear, keep the company out of `data/leads.json` until manual review is complete.',
    '',
  ].join('\n');
}

export function recommendedSearchSources(): DiscoverySourceGuidance[] {
  return [
    { name: 'Google', useCase: 'Find category lists, product pages, comparison pages, and industry pages.', safetyNote: 'Search manually. Do not scrape results or automate browsing.' },
    { name: 'LinkedIn manual search', useCase: 'Find company pages and role/context signals through manual review.', safetyNote: 'Do not automate LinkedIn, auto-DM, export people, or enrich contacts.' },
    { name: 'G2', useCase: 'Find SaaS categories and vendor names for manual review.', safetyNote: 'Use visible category pages manually only.' },
    { name: 'Capterra', useCase: 'Find vertical software categories such as booking, property, gym, scheduling, and health software.', safetyNote: 'Do not scrape vendor lists or automate collection.' },
    { name: 'Product Hunt', useCase: 'Find launched SaaS products and product categories.', safetyNote: 'Validate fit manually before adding anything.' },
    { name: 'SaaS directories', useCase: 'Find niche SaaS categories and vendor candidates.', safetyNote: 'Manual review only. No exports or bulk collection.' },
    { name: 'industry blogs', useCase: 'Find category roundups and workflow-specific software lists.', safetyNote: 'Treat blog claims as leads for review, not evidence.' },
    { name: 'agency directories', useCase: 'Find agencies that may need QA partner support.', safetyNote: 'Do not mass-message or automate contact discovery.' },
    { name: 'public company pages', useCase: 'Confirm product workflows, pricing pages, demos, docs, and integration claims.', safetyNote: 'Use public pages only and do not log in or submit forms.' },
  ];
}

export function searchQueryGroups(): SearchQueryGroup[] {
  return [
    {
      category: 'Fitness SaaS',
      queries: [
        '"best gym management software"',
        'site:g2.com gym management software',
        'site:capterra.com gym management software',
        '"fitness studio management software"',
        '"martial arts school management software"',
        '"CrossFit gym management software"',
      ],
    },
    {
      category: 'Wellness SaaS',
      queries: [
        '"booking software for wellness studios"',
        '"spa management software SaaS"',
        '"salon booking software platform"',
        '"wellness studio scheduling software"',
        'site:g2.com wellness scheduling software',
        'site:capterra.com spa management software',
      ],
    },
    {
      category: 'Booking platforms',
      queries: [
        '"online booking platform SaaS"',
        '"reservation management software SaaS"',
        '"appointment booking platform integrations"',
        '"class booking software for studios"',
        '"booking engine SaaS demo"',
        '"customer portal booking software"',
      ],
    },
    {
      category: 'Hospitality SaaS',
      queries: [
        '"hotel booking engine software"',
        '"hospitality management SaaS"',
        '"restaurant reservation software platform"',
        '"guest experience platform SaaS"',
        'site:g2.com hospitality management software',
        'site:capterra.com hotel management software',
      ],
    },
    {
      category: 'Property management SaaS',
      queries: [
        '"property management SaaS booking engine"',
        '"tenant portal software SaaS"',
        '"rental property management software"',
        '"maintenance request software tenants"',
        'site:g2.com property management software',
        'site:capterra.com property management software',
      ],
    },
    {
      category: 'Scheduling SaaS',
      queries: [
        '"scheduling software with calendar integrations"',
        '"appointment scheduling SaaS Stripe"',
        '"team scheduling software SaaS"',
        '"calendar booking platform for businesses"',
        'site:producthunt.com scheduling software',
      ],
    },
    {
      category: 'SaaS agencies',
      queries: [
        '"SaaS development agency QA automation"',
        '"product studio web app development agency"',
        '"software agency maintenance retainer"',
        '"Shopify Plus agency QA testing"',
        '"web app development agency launch support"',
      ],
    },
    {
      category: 'HealthTech SaaS',
      queries: [
        '"patient scheduling software SaaS"',
        '"healthtech appointment booking software"',
        '"clinic management software SaaS"',
        '"patient portal software company"',
        'site:g2.com patient scheduling software',
      ],
    },
    {
      category: 'E-commerce platforms',
      queries: [
        '"subscription ecommerce platform SaaS"',
        '"headless commerce platform SaaS"',
        '"checkout optimization platform SaaS"',
        '"Shopify app order management software"',
        'site:producthunt.com ecommerce platform',
      ],
    },
  ];
}

function buildTierCounts(leads: Lead[]): TierCounts {
  return leads.reduce<TierCounts>((counts, lead) => {
    counts[tierForLead(lead)] += 1;
    return counts;
  }, { A: 0, B: 0, C: 0 });
}

function tierForLead(lead: Lead): LeadDiscoveryTier {
  if (lead.score >= 8) return 'A';
  if (lead.score >= 6) return 'B';
  return 'C';
}

function buildTopIcps(leads: Lead[]): LeadInventorySummary['topIcps'] {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const industry = lead.industry.trim() || 'Uncategorized';
    counts.set(industry, (counts.get(industry) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 6);
}

function renderInventory(inventory: LeadInventorySummary): string {
  return [
    `- Current total leads: ${inventory.totalLeads}`,
    `- Tier A leads: ${inventory.tierCounts.A}`,
    `- Tier B leads: ${inventory.tierCounts.B}`,
    `- Tier C leads: ${inventory.tierCounts.C}`,
    `- Current top ICPs: ${inventory.topIcps.length === 0 ? 'none yet' : inventory.topIcps.map((icp) => `${icp.name} (${icp.count})`).join(', ')}`,
  ].join('\n');
}

function renderContextSources(input: LeadDiscoveryAutomationInput): string {
  return input.contextSources.map((source) => {
    const status = source.exists ? 'available' : 'missing';
    const excerpt = source.exists && source.excerpt ? ` Summary: ${source.excerpt}` : '';
    return `- ${source.label}: ${status} (${source.path}).${excerpt}`;
  }).join('\n');
}

function bestIcps(): string[] {
  return [
    'Fitness SaaS: scheduling, memberships, mobile apps, billing-adjacent flows, and frequent operational releases.',
    'Wellness SaaS: appointment booking, intake, packages, memberships, reminders, and mobile flow risk.',
    'Booking platforms: availability, booking, cancellation, confirmation, calendar, and payment-adjacent paths.',
    'Hospitality SaaS: reservation, guest portal, booking engine, staff workflow, and integration-heavy workflows.',
    'Property management SaaS: tenant portals, maintenance requests, inspections, owner dashboards, and mobile flows.',
    'Scheduling SaaS: calendar sync, availability, timezone handling, reminders, cancellation, and integration risk.',
    'SaaS agencies: recurring launch support, multiple client apps, regression risk, and QA partner retainer potential.',
    'HealthTech SaaS: scheduling, portals, intake, role-based workflows, and careful compliance-aware scope boundaries.',
    'E-commerce platforms: checkout-adjacent, cart, subscription, product, mobile, and release regression workflows.',
  ];
}

function leadQualificationRules(): string[] {
  return [
    'Prefer public products with visible user workflows Daniel can explain without private data.',
    'Prioritize SaaS or service businesses with booking, scheduling, onboarding, dashboard, checkout-adjacent, portal, mobile, or integration workflows.',
    'Look for QA pain signals such as frequent releases, complex onboarding, integrations, mobile apps, payments-adjacent flows, or multiple user roles.',
    'Skip companies with no working website, no visible product/service, unclear business model, or only static content.',
    'Do not treat a directory listing, blog mention, or AI-generated snippet as proof. Confirm on public company pages.',
    'Only add leads after Daniel manually approves the company and the reason it fits.',
  ];
}

function manualApprovalWorkflow(): string[] {
  return [
    'Run `npm run lead:discover:assistant` to refresh search guidance and checklist files.',
    'Use the search playbook manually in public search sources.',
    'Review public company pages manually and note why the workflow may need QA support.',
    'Add approved candidates to `output/lead-discovery-automation/candidate-queue.md` as manual entries.',
    'Confirm the approval checklist before creating a local lead.',
    'Run the suggested `npm run lead:add` command only after Daniel approves.',
    'Generate follow-on assets with `npm run lead:research`, `npm run lead:pack`, or `npm run audit:site` only when appropriate.',
  ];
}

function doNotAutomateRules(): string[] {
  return [
    'No scraping.',
    'No APIs.',
    'No browser automation.',
    'No CRM integrations.',
    'No email automation.',
    'No LinkedIn automation.',
    'No contact enrichment.',
    'No auto-DMs.',
    'No payments, invoices, or checkout actions.',
    'No credentials, private client data, or production client systems.',
    'No adding leads without Daniel approval.',
  ];
}

function suggestedCommands(): string[] {
  return [
    '`npm run lead:discover:assistant`',
    '`npm run lead:candidate-queue`',
    `\`${leadAddCommandTemplate}\``,
    '`npm run lead:research -- --id lead_id`',
    '`npm run lead:pack -- --id lead_id`',
    '`npm run audit:site -- --url https://example.com`',
    '`npm run pipeline:opportunities`',
    '`npm run operator:daily`',
  ];
}

function renderSources(sources: DiscoverySourceGuidance[]): string {
  return sources.map((source) => `- ${source.name}: ${source.useCase} Safety: ${source.safetyNote}`).join('\n');
}

function renderSearchQueryGroups(groups: SearchQueryGroup[]): string {
  return groups.map((group) => [
    `### ${group.category}`,
    '',
    renderList(group.queries.map((query) => `\`${query}\``)),
  ].join('\n')).join('\n\n');
}

function renderCandidateTable(): string {
  return [
    '| Candidate Company | Website | Industry | Source | Why It Might Fit | Risk / Unknown | Approve? Yes/No | Suggested Command |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    `|  |  |  |  |  |  |  | \`${leadAddCommandTemplate}\` |`,
  ].join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderNumberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}
