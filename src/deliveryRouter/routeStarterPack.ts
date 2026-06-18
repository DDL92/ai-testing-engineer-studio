import { PackageRoute } from './types';

export function routeStarterPack(): PackageRoute {
  return {
    package: 'starter-pack',
    title: 'Playwright Starter Pack Delivery Route',
    scopeSections: [
      {
        heading: 'Critical Flows',
        items: ['Homepage flow', 'Signup flow', 'Booking flow', 'Contact flow', 'Schedule flow'],
      },
      {
        heading: 'Automation Scope',
        items: [
          'Public smoke coverage only until client access is explicitly approved.',
          'Stable Playwright locators and deterministic assertions.',
          'No payment, destructive, administrative, or production data-changing actions.',
        ],
      },
      {
        heading: 'Recommended Playwright Structure',
        items: [
          'playwright/pages/',
          'playwright/tests/smoke/',
          'playwright/fixtures/',
          'playwright/utils/',
          'playwright.config.ts',
        ],
      },
      {
        heading: 'Recommended Spec List',
        items: [
          'homepage.spec.ts',
          'signup-entry.spec.ts',
          'booking-entry.spec.ts',
          'contact.spec.ts',
          'schedule-entry.spec.ts',
        ],
      },
      {
        heading: 'Recommended Reporting Setup',
        items: [
          'Playwright HTML reporter',
          'Trace on first retry',
          'Screenshot and video on failure',
          'Human-reviewed execution summary',
        ],
      },
    ],
    recommendedOutputs: [
      'Starter smoke suite plan',
      'Page Object Model map',
      'Spec inventory',
      'Reporting and CI readiness notes',
    ],
  };
}
