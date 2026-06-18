import { PackageRoute } from './types';

export function routeRetainer(): PackageRoute {
  return {
    package: 'retainer',
    title: 'QA Automation Retainer Delivery Route',
    scopeSections: [
      {
        heading: 'Month 1 Plan',
        items: [
          'Confirm approved environments, access boundaries, and priority workflows.',
          'Baseline current evidence and smoke coverage.',
          'Create a reviewed maintenance backlog.',
        ],
      },
      {
        heading: 'Month 2 Plan',
        items: [
          'Expand coverage around the highest-risk approved workflows.',
          'Stabilize reporting and regression review.',
          'Review flaky or high-maintenance checks.',
        ],
      },
      {
        heading: 'Month 3 Plan',
        items: [
          'Review coverage gaps and maintenance cost.',
          'Prioritize next-quarter automation expansion.',
          'Prepare a human-reviewed value and risk summary.',
        ],
      },
      {
        heading: 'Coverage Expansion Plan',
        items: [
          'Expand only after evidence and client approval.',
          'Prioritize critical flows before broad coverage.',
          'Keep destructive and payment flows separately approved.',
        ],
      },
      {
        heading: 'Reporting Schedule',
        items: ['Weekly execution summary draft', 'Monthly QA review draft', 'Quarterly coverage review draft'],
      },
      {
        heading: 'Maintenance Schedule',
        items: ['Weekly failure triage', 'Monthly locator and dependency review', 'Quarterly suite and runtime review'],
      },
    ],
    recommendedOutputs: [
      'Three-month delivery roadmap',
      'Coverage expansion backlog',
      'Weekly and monthly reporting plan',
      'Maintenance schedule',
    ],
  };
}
