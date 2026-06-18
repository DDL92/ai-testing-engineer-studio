import { PackageRoute } from './types';

export function routeQaAudit(): PackageRoute {
  return {
    package: 'qa-audit',
    title: 'QA Audit Delivery Route',
    scopeSections: [
      {
        heading: 'Audit Scope',
        items: [
          'Review approved public pages and candidate public flows.',
          'Review existing Lighthouse, screenshot, console, network, and page evidence.',
          'Prioritize potential quality and release-confidence areas for manual review.',
        ],
      },
      {
        heading: 'Evidence Checklist',
        items: [
          'Page evidence',
          'Candidate public flow evidence',
          'Desktop, tablet, and mobile screenshots',
          'Lighthouse report',
          'Console and network observations',
        ],
      },
      {
        heading: 'Review Checklist',
        items: [
          'Confirm every observation has a reproducible source.',
          'Remove unsupported defect or business-impact claims.',
          'Confirm client-safe wording and evidence boundaries.',
        ],
      },
      {
        heading: 'Risk Categories',
        items: [
          'Public flow reliability',
          'Responsive presentation',
          'Performance observations',
          'Accessibility observations',
          'Release-confidence and regression exposure',
        ],
      },
      {
        heading: 'Report Structure',
        items: [
          'Executive summary',
          'Evidence inventory',
          'Prioritized observations',
          'Potential automation opportunities',
          'Recommended next steps',
        ],
      },
    ],
    recommendedOutputs: [
      'QA audit report draft',
      'Evidence appendix',
      'Prioritized review checklist',
      'Starter Pack recommendation when justified',
    ],
  };
}
