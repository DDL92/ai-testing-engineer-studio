import fs = require('fs');
import path = require('path');
import { buildCurrentClientConversion } from '../clientConversion/conversionRules';
import { ClientPackage, ClientRecord } from '../clientConversion/types';
import { routeQaAudit } from './routeQaAudit';
import { routeRetainer } from './routeRetainer';
import { routeStarterPack } from './routeStarterPack';
import {
  DeliveryChecklist,
  DeliveryPhase,
  DeliveryRouterDashboard,
  DeliveryRouterReport,
  PackageRoute,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'delivery-router');

const safetyRules = [
  'Delivery preparation only. No work is claimed as completed.',
  'No client repositories, credentials, private systems, production data, or payment flows are accessed.',
  'No outreach, emails, meetings, invoices, payment processing, contracts, or CRM actions are performed.',
  'Human approval is required before access requests, client-facing delivery, or execution.',
];

export function routeClientPackage(selectedPackage: ClientPackage): PackageRoute {
  if (selectedPackage === 'qa-audit') return routeQaAudit();
  if (selectedPackage === 'starter-pack') return routeStarterPack();
  if (selectedPackage === 'retainer') return routeRetainer();
  throw new Error(`Unsupported delivery package: ${selectedPackage}`);
}

export function buildDeliveryRouterReport(): DeliveryRouterReport {
  const conversion = buildCurrentClientConversion();
  if (!conversion) throw new Error('No current client conversion exists. Run npm run client:convert first.');
  return buildDeliveryRouterReportForClient(conversion.record);
}

export function buildDeliveryRouterReportForClient(client: ClientRecord): DeliveryRouterReport {
  const route = routeClientPackage(client.selectedPackage);
  const phases = deliveryPhases(route);
  const checklist = deliveryChecklist(client.selectedPackage);
  const blockers = deliveryBlockers(client.status, client.website, client.selectedPackage);
  const readiness = blockers.some((blocker) => blocker.startsWith('Critical:'))
    ? 'NOT READY'
    : blockers.length > 0 ? 'NEEDS REVIEW' : 'READY FOR PREPARATION';

  return {
    generatedAt: new Date().toISOString(),
    client,
    route,
    phases,
    checklist,
    readiness,
    blockers,
    nextDeliveryAction: nextDeliveryAction(client.clientName, client.selectedPackage, readiness),
    safetyRules,
  };
}

export function buildDeliveryRouterDashboard(): DeliveryRouterDashboard {
  try {
    const report = buildDeliveryRouterReport();
    return {
      deliveryReadiness: report.readiness,
      deliveryStatus: report.client.status,
      nextDeliveryAction: report.nextDeliveryAction,
    };
  } catch {
    return {
      deliveryReadiness: 'NOT READY',
      deliveryStatus: 'No client conversion',
      nextDeliveryAction: 'Run npm run client:convert before delivery preparation.',
    };
  }
}

export function writeDeliveryRouterOutputs(report = buildDeliveryRouterReport()): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['delivery-plan.md', renderDeliveryPlan(report)],
    ['delivery-checklist.md', renderDeliveryChecklist(report)],
    ['delivery-readiness.md', renderDeliveryReadiness(report)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderDeliveryPlan(report: DeliveryRouterReport): string {
  return [
    '# Delivery Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Client: ${report.client.clientName}`,
      `Package: ${report.client.selectedPackage}`,
      `Client Status: ${report.client.status}`,
      `Delivery Readiness: ${report.readiness}`,
    ]),
    '',
    ...report.phases.flatMap((phase) => [
      `## ${phase.phase}: ${phase.title}`,
      '',
      bullets(phase.activities),
      '',
    ]),
    '## Package Route',
    '',
    `### ${report.route.title}`,
    '',
    ...report.route.scopeSections.flatMap((section) => [
      `#### ${section.heading}`,
      '',
      bullets(section.items),
      '',
    ]),
    '## Recommended Outputs',
    '',
    bullets(report.route.recommendedOutputs),
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDeliveryChecklist(report: DeliveryRouterReport): string {
  return [
    '# Delivery Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Client: ${report.client.clientName}`,
    '',
    '## Required Inputs',
    '',
    checklist(report.checklist.requiredInputs),
    '',
    '## Public-Only',
    '',
    checklist(report.checklist.publicOnly),
    '',
    '## Client-Access-Required',
    '',
    checklist(report.checklist.clientAccessRequired),
    '',
    '## Required Review Steps',
    '',
    checklist(report.checklist.requiredReviewSteps),
    '',
    '## Required Approval Steps',
    '',
    checklist(report.checklist.requiredApprovalSteps),
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDeliveryReadiness(report: DeliveryRouterReport): string {
  return [
    '# Delivery Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    bullets([
      `Client: ${report.client.clientName}`,
      `Package: ${report.client.selectedPackage}`,
      `Client Status: ${report.client.status}`,
      `Delivery Readiness: ${report.readiness}`,
      `Next Delivery Action: ${report.nextDeliveryAction}`,
    ]),
    '',
    '## Blockers',
    '',
    bullets(report.blockers.length > 0 ? report.blockers : ['No preparation blockers detected. Human approval is still required before execution.']),
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

function deliveryPhases(route: PackageRoute): DeliveryPhase[] {
  return [
    {
      phase: 'Phase 1',
      title: 'Discovery',
      activities: [
        'Review the client record, selected package, public evidence, and approved boundaries.',
        'Confirm required inputs and identify client-access items without requesting access automatically.',
      ],
    },
    {
      phase: 'Phase 2',
      title: 'Audit',
      activities: [
        'Review public-page evidence and package-specific risk categories.',
        'Record potential areas to review without claiming confirmed defects or impact.',
      ],
    },
    {
      phase: 'Phase 3',
      title: 'Automation',
      activities: route.package === 'qa-audit'
        ? ['Identify Playwright opportunities only; do not create or modify tests in a client repository.']
        : ['Prepare the approved automation scope and recommended Playwright structure without modifying client repositories.'],
    },
    {
      phase: 'Phase 4',
      title: 'Reporting',
      activities: [
        'Prepare a client-ready draft from reviewed evidence.',
        'Separate observed evidence, potential risks, and recommended next steps.',
      ],
    },
    {
      phase: 'Phase 5',
      title: 'Review',
      activities: [
        'Daniel reviews scope, evidence, wording, and access boundaries.',
        'No delivery status changes until explicit human approval.',
      ],
    },
  ];
}

function deliveryChecklist(selectedPackage: ClientPackage): DeliveryChecklist {
  return {
    requiredInputs: [
      'Confirmed client-facing company name',
      'Confirmed selected package and bounded scope',
      'Approved public website and evidence sources',
      'Approved report format and review owner',
    ],
    publicOnly: [
      'Public homepage and marketing pages',
      'Candidate public signup, booking, contact, and schedule entry pages',
      'Public screenshots and Lighthouse observations',
      'Public console and network observations',
    ],
    clientAccessRequired: [
      'Staging or authenticated environment',
      'Approved test account',
      'Private application workflows',
      'Repository, CI, deployment, or private reporting access',
      ...(selectedPackage === 'qa-audit' ? [] : ['Approved automation execution environment']),
    ],
    requiredReviewSteps: [
      'Verify every observation against its evidence source',
      'Remove unsupported bug, outage, vulnerability, revenue, or customer-impact claims',
      'Confirm no credentials or private data appear in outputs',
      'Review package scope against the client record',
    ],
    requiredApprovalSteps: [
      'Daniel approves scope',
      'Daniel approves access boundaries',
      'Daniel approves client-facing wording',
      'Daniel approves delivery execution',
      'Client access is obtained outside this system only when explicitly approved',
    ],
  };
}

function deliveryBlockers(status: string, website: string, selectedPackage: ClientPackage): string[] {
  const blockers: string[] = [];
  if (!website) blockers.push('Critical: No client website is recorded.');
  if (!['delivery-prep', 'delivery-active'].includes(status)) blockers.push(`Client status ${status} requires review before delivery preparation.`);
  if (selectedPackage !== 'qa-audit') blockers.push('Client access and explicit automation scope approval are required before execution.');
  return blockers;
}

function nextDeliveryAction(clientName: string, selectedPackage: ClientPackage, readiness: string): string {
  if (readiness === 'NOT READY') return `Resolve critical ${clientName} client-record blockers before delivery preparation.`;
  if (selectedPackage === 'qa-audit') return `Review ${clientName} public evidence checklist and approve the QA Audit scope manually.`;
  return `Review ${clientName} ${selectedPackage} access requirements and approve the automation boundary manually.`;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function checklist(items: string[]): string {
  if (items.length === 0) return '- [ ] None.';
  return items.map((item) => `- [ ] ${item}`).join('\n');
}
