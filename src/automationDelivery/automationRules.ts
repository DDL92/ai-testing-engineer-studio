import fs = require('fs');
import path = require('path');
import { buildCurrentClientConversion } from '../clientConversion/conversionRules';
import { ClientPackage, ClientRecord } from '../clientConversion/types';
import {
  AutomationDeliveryDashboard,
  AutomationDeliveryReport,
  AutomationTestCase,
  CriticalFlowRecommendation,
  FixtureRecommendation,
  FrameworkRecommendation,
  PlaywrightSpecRecommendation,
} from './types';

export const automationDeliveryOutputDir = path.join(process.cwd(), 'output', 'automation-delivery');

const safetyRules = [
  'Local-only automation delivery preparation.',
  'No client repository, environment, credentials, CI system, deployment target, or private data is accessed or modified.',
  'Recommendations do not claim that tests, fixtures, reports, defects, or automation exist in a client system.',
  'Use potential area to review, public-page observation, and candidate flow language.',
  'Human approval and client-approved access are required before implementation.',
];

export function buildAutomationDeliveryReport(): AutomationDeliveryReport {
  const conversion = buildCurrentClientConversion();
  if (!conversion) throw new Error('No current client conversion exists. Run npm run client:convert first.');
  return buildAutomationDeliveryReportForClient(conversion.record);
}

export function buildAutomationDeliveryReportForClient(client: ClientRecord): AutomationDeliveryReport {
  const criticalFlows = criticalFlowsFor(client.selectedPackage);
  const testCases = testCasesFor(criticalFlows);
  const frameworkStructure = frameworkRecommendations();
  const specs = specRecommendations(criticalFlows);
  const fixtures = fixtureRecommendations(client.selectedPackage);
  const blockers = blockersFor(client);

  return {
    generatedAt: new Date().toISOString(),
    client,
    package: client.selectedPackage,
    status: blockers.some((blocker) => blocker.startsWith('Critical:'))
      ? 'NOT READY'
      : client.selectedPackage === 'qa-audit' ? 'READY FOR REVIEW' : 'NEEDS CLIENT INPUT',
    automationPlan: automationPlanFor(client.selectedPackage),
    evidenceSummary: [
      'Use only reviewed local evidence associated with the actionable lead and client record.',
      'Separate observed public-page signals from recommended future automation.',
      'Do not convert unverified observations into defect claims.',
    ],
    riskCategories: [
      'Public navigation and page-load confidence',
      'Responsive and mobile presentation',
      'Signup and authentication entry points',
      'Booking and scheduling entry points',
      'Contact and pricing conversion paths',
      'Regression visibility and reporting',
    ],
    criticalFlows,
    testCases,
    frameworkStructure,
    specs,
    fixtures,
    ciRecommendations: [
      'Install dependencies with npm ci.',
      'Run lint when a project lint command exists.',
      'Run TypeScript typecheck before browser tests.',
      'Run Playwright tests against an explicitly approved environment.',
      'Publish HTML or Allure reports as build artifacts.',
      'Retain screenshots, traces, and approved failure artifacts.',
      'Do not deploy from the QA workflow.',
      'Store credentials only in approved CI secrets, never in source files.',
    ],
    reportingRecommendations: [
      'Use the Playwright HTML reporter as the default local report.',
      'Consider Allure open source when historical categorization is needed.',
      'Capture screenshots only on failure or approved evidence checkpoints.',
      'Enable traces on first retry.',
      'Retain video on failure only when approved and useful.',
      'Store evidence outside source modules under an approved report or artifact directory.',
      'Review reports manually before client-facing delivery.',
    ],
    clientHandoff: [
      'QA Audit Summary',
      'Test Plan',
      'Automation Recommendations',
      'Framework Recommendations',
      'Coverage Roadmap',
      'Recommended Next Steps',
      'Evidence and access boundary notes',
    ],
    retentionPath: retentionPath(),
    blockers,
    safetyRules,
  };
}

export function buildAutomationDeliveryDashboard(): AutomationDeliveryDashboard {
  try {
    const report = buildAutomationDeliveryReport();
    return {
      automationStatus: report.status,
      criticalFlowCount: report.criticalFlows.length,
      deliveryAssets: 10,
      frameworkStatus: report.frameworkStructure.length > 0 ? 'Recommendations Ready' : 'Not Ready',
      clientHandoffStatus: report.clientHandoff.length > 0 ? 'Draft Ready for Review' : 'Not Ready',
      deliveryStatus: report.client.status,
    };
  } catch {
    return {
      automationStatus: 'NOT READY',
      criticalFlowCount: 0,
      deliveryAssets: 0,
      frameworkStatus: 'Not Ready',
      clientHandoffStatus: 'Not Ready',
      deliveryStatus: 'No client conversion',
    };
  }
}

export function writeAutomationDeliveryOutputs(report = buildAutomationDeliveryReport()): string[] {
  fs.mkdirSync(automationDeliveryOutputDir, { recursive: true });
  const outputs = [
    ['automation-plan.md', renderAutomationPlan(report)],
    ['critical-flows.md', renderCriticalFlows(report)],
    ['test-cases.md', renderTestCases(report)],
    ['framework-structure.md', renderFrameworkStructure(report)],
    ['playwright-specs.md', renderPlaywrightSpecs(report)],
    ['fixture-plan.md', renderFixturePlan(report)],
    ['ci-recommendations.md', renderCiRecommendations(report)],
    ['reporting-plan.md', renderReportingPlan(report)],
    ['client-handoff.md', renderClientHandoff(report)],
    ['automation-delivery-summary.md', renderAutomationDeliverySummary(report)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(automationDeliveryOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderAutomationPlan(report: AutomationDeliveryReport): string {
  return document(report, 'Automation Delivery Plan', [
    '## Status',
    '',
    bullets([
      `Client: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Automation Status: ${report.status}`,
      `Critical Flow Count: ${report.criticalFlows.length}`,
    ]),
    '',
    '## Automation Plan',
    '',
    numbered(report.automationPlan),
    '',
    '## Evidence Summary',
    '',
    bullets(report.evidenceSummary),
    '',
    '## Risk Categories',
    '',
    bullets(report.riskCategories),
    '',
    '## Blockers',
    '',
    bullets(report.blockers.length > 0 ? report.blockers : ['No planning blockers detected. Implementation still requires human approval.']),
  ]);
}

export function renderCriticalFlows(report: AutomationDeliveryReport): string {
  return document(report, 'Critical Flow Recommendations', [
    '| Flow | Type | Priority | Rationale | Recommended Automation |',
    '| --- | --- | --- | --- | --- |',
    ...report.criticalFlows.map((flow) => `| ${escapeTable(flow.name)} | ${flow.type} | ${flow.priority} | ${escapeTable(flow.rationale)} | ${escapeTable(flow.recommendedAutomation)} |`),
  ]);
}

export function renderTestCases(report: AutomationDeliveryReport): string {
  return document(report, 'Recommended Test Cases', [
    '| ID | Feature | Risk | Priority | Recommended Automation | Access Boundary |',
    '| --- | --- | --- | --- | --- | --- |',
    ...report.testCases.map((testCase) => `| ${testCase.id} | ${escapeTable(testCase.feature)} | ${escapeTable(testCase.risk)} | ${testCase.priority} | ${escapeTable(testCase.recommendedAutomation)} | ${testCase.accessBoundary} |`),
  ]);
}

export function renderFrameworkStructure(report: AutomationDeliveryReport): string {
  return document(report, 'Recommended Playwright Framework Structure', [
    'Architecture recommendations only. No client repository files were created.',
    '',
    '| Path | Purpose | Status |',
    '| --- | --- | --- |',
    ...report.frameworkStructure.map((item) => `| ${escapeTable(item.path)} | ${escapeTable(item.purpose)} | ${item.status} |`),
  ]);
}

export function renderPlaywrightSpecs(report: AutomationDeliveryReport): string {
  return document(report, 'Recommended Playwright Specs', [
    'Spec names and scopes are recommendations only. No executable client tests were generated.',
    '',
    '| Recommended Spec | Candidate Flow | Priority | Scope |',
    '| --- | --- | --- | --- |',
    ...report.specs.map((spec) => `| ${escapeTable(spec.path)} | ${escapeTable(spec.flow)} | ${spec.priority} | ${escapeTable(spec.scope)} |`),
    '',
    '## Recommended Page Objects',
    '',
    bullets([
      'pages/HomePage.ts',
      'pages/LoginPage.ts',
      'pages/BookingPage.ts',
      'pages/SchedulePage.ts',
      'pages/ContactPage.ts',
    ]),
  ]);
}

export function renderFixturePlan(report: AutomationDeliveryReport): string {
  return document(report, 'Recommended Fixture Plan', [
    '| Recommended Fixture | Purpose | Access Boundary |',
    '| --- | --- | --- |',
    ...report.fixtures.map((fixture) => `| ${escapeTable(fixture.path)} | ${escapeTable(fixture.purpose)} | ${fixture.accessBoundary} |`),
    '',
    'No authentication fixture should be implemented until approved test credentials and an approved environment exist.',
  ]);
}

export function renderCiRecommendations(report: AutomationDeliveryReport): string {
  return document(report, 'CI Recommendations', [
    '## Recommended GitHub Actions Sequence',
    '',
    numbered(report.ciRecommendations),
    '',
    'Deployment is intentionally excluded.',
  ]);
}

export function renderReportingPlan(report: AutomationDeliveryReport): string {
  return document(report, 'Reporting Plan', [
    '## Reporting Recommendations',
    '',
    bullets(report.reportingRecommendations),
    '',
    '## Evidence Storage',
    '',
    bullets([
      'Keep source code separate from generated reports.',
      'Do not commit sensitive screenshots, traces, videos, or credentials.',
      'Use bounded retention for CI artifacts.',
    ]),
  ]);
}

export function renderClientHandoff(report: AutomationDeliveryReport): string {
  return document(report, 'Client Handoff Draft', [
    '## What The Client Receives',
    '',
    checklist(report.clientHandoff),
    '',
    '## Recommended Upgrade Path',
    '',
    'QA Audit',
    '↓',
    'Starter Pack',
    '↓',
    'Retainer',
    '',
    '## Month 1',
    '',
    bullets(report.retentionPath.month1),
    '',
    '## Month 2',
    '',
    bullets(report.retentionPath.month2),
    '',
    '## Month 3',
    '',
    bullets(report.retentionPath.month3),
    '',
    'This is a handoff preparation draft, not a record of delivered or accepted work.',
  ]);
}

export function renderAutomationDeliverySummary(report: AutomationDeliveryReport): string {
  return document(report, 'Automation Delivery Summary', [
    bullets([
      `Client: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Status: ${report.status}`,
      `Critical Flows: ${report.criticalFlows.length}`,
      `Recommended Test Cases: ${report.testCases.length}`,
      `Recommended Specs: ${report.specs.length}`,
      `Framework Assets: ${report.frameworkStructure.length}`,
      `Client Handoff Items: ${report.clientHandoff.length}`,
    ]),
    '',
    'All assets are recommendations and preparation artifacts only.',
  ]);
}

function automationPlanFor(selectedPackage: ClientPackage): string[] {
  if (selectedPackage === 'qa-audit') {
    return [
      'Review approved public evidence and candidate flows.',
      'Map risk categories to recommended test cases.',
      'Recommend the smallest useful Playwright Starter Pack.',
      'Prepare framework, fixture, CI, reporting, and handoff recommendations.',
    ];
  }
  if (selectedPackage === 'starter-pack') {
    return [
      'Confirm approved public and authenticated flow boundaries.',
      'Prioritize the first five stable smoke flows.',
      'Prepare Page Object Model, spec, fixture, reporting, and CI architecture.',
      'Define the maintenance and Retainer upgrade path.',
    ];
  }
  return [
    'Confirm the existing approved automation baseline.',
    'Plan Month 1 stabilization and risk coverage.',
    'Plan Month 2 coverage expansion.',
    'Plan Month 3 maintenance, reporting, and roadmap review.',
  ];
}

function criticalFlowsFor(selectedPackage: ClientPackage): CriticalFlowRecommendation[] {
  const definitions: Array<[string, CriticalFlowRecommendation['type'], CriticalFlowRecommendation['priority'], string, string]> = [
    ['Homepage', 'public-page', 'HIGH', 'Primary public entry point and navigation surface.', 'Public smoke check for load, title, primary navigation, and visible call to action.'],
    ['Signup', 'candidate-flow', 'HIGH', 'Potential acquisition entry point.', 'Validate the approved public signup entry without submitting private or production data.'],
    ['Login', 'client-access-required', 'MEDIUM', 'Authentication is a likely critical workflow but requires explicit access.', 'Prepare authentication coverage only after approved credentials and environment exist.'],
    ['Booking', 'candidate-flow', 'HIGH', 'Core scheduling products commonly depend on booking entry points.', 'Validate public booking entry, navigation, and non-destructive form presentation.'],
    ['Scheduling', 'candidate-flow', 'HIGH', 'Scheduling is central to the current client category.', 'Validate public schedule entry and visible availability controls without completing transactions.'],
    ['Contact', 'public-page', 'MEDIUM', 'Contact paths support buyer and customer communication.', 'Validate public contact navigation and required field presentation without submission.'],
    ['Pricing', 'public-page', 'MEDIUM', 'Pricing supports purchase evaluation and package discovery.', 'Validate public pricing visibility, navigation, and responsive presentation.'],
    ['Navigation', 'public-page', 'HIGH', 'Navigation regressions can block multiple public journeys.', 'Validate primary links, responsive menu behavior, and destination availability.'],
    ['Mobile Smoke', 'public-page', 'HIGH', 'Mobile presentation affects public discovery and booking entry.', 'Run a bounded mobile viewport smoke plan for the approved public pages.'],
  ];
  return definitions.map(([name, type, priority, rationale, recommendedAutomation]) => ({
    name,
    type,
    priority: selectedPackage === 'qa-audit' && type === 'client-access-required' ? 'LOW' : priority,
    rationale,
    recommendedAutomation,
  }));
}

function testCasesFor(flows: CriticalFlowRecommendation[]): AutomationTestCase[] {
  return flows.map((flow, index) => ({
    id: `AUTO-${String(index + 1).padStart(3, '0')}`,
    feature: flow.name,
    risk: flow.rationale,
    priority: flow.priority,
    recommendedAutomation: flow.recommendedAutomation,
    accessBoundary: flow.type === 'client-access-required' ? 'client-access-required' : 'public-only',
  }));
}

function frameworkRecommendations(): FrameworkRecommendation[] {
  return [
    ['playwright.config.ts', 'Central browser, retry, reporting, trace, screenshot, and video configuration.'],
    ['pages/', 'Page Object Model classes for stable reusable interactions.'],
    ['tests/', 'Feature-oriented Playwright spec files.'],
    ['fixtures/', 'Reusable test setup and approved environment fixtures.'],
    ['utils/', 'Small helpers for API clients, test data, and reporting metadata.'],
    ['reports/', 'Generated local and CI reports kept separate from source modules.'],
    ['.github/workflows/', 'Controlled GitHub Actions quality workflow without deployment.'],
  ].map(([pathValue, purpose]) => ({ path: pathValue, purpose, status: 'recommended-only' }));
}

function specRecommendations(flows: CriticalFlowRecommendation[]): PlaywrightSpecRecommendation[] {
  const fileNames: Record<string, string> = {
    Homepage: 'tests/homepage.spec.ts',
    Signup: 'tests/signup.spec.ts',
    Login: 'tests/login.spec.ts',
    Booking: 'tests/booking.spec.ts',
    Scheduling: 'tests/schedule.spec.ts',
    Contact: 'tests/contact.spec.ts',
    Pricing: 'tests/pricing.spec.ts',
    Navigation: 'tests/navigation.spec.ts',
    'Mobile Smoke': 'tests/mobile.spec.ts',
  };
  return flows.map((flow) => ({
    path: fileNames[flow.name] ?? `tests/${slug(flow.name)}.spec.ts`,
    flow: flow.name,
    priority: flow.priority,
    scope: flow.recommendedAutomation,
  }));
}

function fixtureRecommendations(selectedPackage: ClientPackage): FixtureRecommendation[] {
  return [
    { path: 'fixtures/testBase.ts', purpose: 'Shared Playwright fixtures and Page Object Model construction.', accessBoundary: 'public-only' },
    { path: 'utils/apiClient.ts', purpose: 'Optional approved API helper for non-destructive checks.', accessBoundary: 'client-access-required' },
    {
      path: 'fixtures/auth.fixture.ts',
      purpose: 'Future authenticated session fixture using approved credentials and storage state.',
      accessBoundary: 'client-access-required',
    },
    {
      path: 'utils/testData.ts',
      purpose: selectedPackage === 'qa-audit' ? 'Public-safe placeholder data recommendations.' : 'Approved synthetic test data recommendations.',
      accessBoundary: 'public-only',
    },
  ];
}

function retentionPath(): AutomationDeliveryReport['retentionPath'] {
  return {
    qaAudit: ['Review evidence', 'Prioritize potential risks', 'Recommend the first automation scope'],
    starterPack: ['Implement approved critical smoke flows', 'Add reporting and CI quality checks', 'Document maintenance ownership'],
    retainer: ['Maintain tests', 'Expand coverage from evidence', 'Provide reviewed weekly and monthly reporting'],
    month1: ['Stabilize approved critical flows', 'Establish reporting baseline', 'Create maintenance backlog'],
    month2: ['Expand approved coverage', 'Review flaky or high-cost tests', 'Improve evidence traceability'],
    month3: ['Review coverage gaps', 'Prepare next-quarter roadmap', 'Review maintenance and reporting cadence'],
  };
}

function blockersFor(client: ClientRecord): string[] {
  const blockers: string[] = [];
  if (!client.website) blockers.push('Critical: No client website is recorded.');
  if (!['delivery-prep', 'delivery-active'].includes(client.status)) blockers.push(`Client status ${client.status} requires review.`);
  if (client.selectedPackage !== 'qa-audit') blockers.push('Approved client environment and access boundaries are required before automation implementation.');
  return blockers;
}

function document(report: AutomationDeliveryReport, title: string, body: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...body,
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function numbered(items: string[]): string {
  if (items.length === 0) return '1. None.';
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function checklist(items: string[]): string {
  if (items.length === 0) return '- [ ] None.';
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
