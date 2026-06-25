import fs = require('fs');
import path = require('path');

type DeliveryPackageType = 'Pilot Package' | 'Growth Package' | 'Premium Package';

interface DeliveryRoute {
  packageType: DeliveryPackageType;
  deliverables: string[];
  reviewCheckpoints: string[];
  estimatedTimeline: Array<{
    milestone: string;
    work: string;
  }>;
  filesToGenerate: string[];
  successMetrics: string[];
  nextActions: string[];
  estimatedWorkload: string;
}

interface ClientDeliveryPlan {
  generatedAt: string;
  activeClient: {
    clientName: string;
    packageType: DeliveryPackageType;
    status: 'planning_ready';
    nextMilestone: string;
    nextAction: string;
  };
  routes: DeliveryRoute[];
  safetyRules: string[];
}

interface DeliveryReadinessSummary {
  activeClients: number;
  packageType: string;
  deliverablesReady: string;
  nextMilestone: string;
  estimatedWorkload: string;
  nextAction: string;
}

const outputDir = path.join(process.cwd(), 'output', 'client-delivery');
const planMarkdownPath = path.join(outputDir, 'client-delivery-plan.md');
const planJsonPath = path.join(outputDir, 'client-delivery-plan.json');
const checklistPath = path.join(outputDir, 'client-delivery-checklist.md');
const timelinePath = path.join(outputDir, 'client-delivery-timeline.md');
const nextActionsPath = path.join(outputDir, 'client-next-actions.md');

const safetyRules = [
  'Post-sale planning only.',
  'No providers, Tavily, network calls, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, forms, or paid services are used.',
  'Client delivery artifacts are local planning outputs and require Daniel review before client use.',
  'No client credentials, private data, or production systems are accessed.',
];

export function generateClientDeliveryRouter(now = new Date()): ClientDeliveryPlan {
  const plan = buildDeliveryPlan(now);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(planMarkdownPath, renderPlan(plan), 'utf8');
  fs.writeFileSync(planJsonPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  fs.writeFileSync(checklistPath, renderChecklist(plan.routes), 'utf8');
  fs.writeFileSync(timelinePath, renderTimeline(plan.routes), 'utf8');
  fs.writeFileSync(nextActionsPath, renderNextActions(plan), 'utf8');

  return plan;
}

export function getDeliveryReadinessSummary(): DeliveryReadinessSummary {
  const plan = readPlan();
  if (!plan) {
    return {
      activeClients: 0,
      packageType: 'none',
      deliverablesReady: 'MISSING',
      nextMilestone: 'Run npm run leads:delivery-router',
      estimatedWorkload: 'unknown',
      nextAction: 'Generate delivery router before post-sale delivery.',
    };
  }

  const activeRoute = plan.routes.find((route) => route.packageType === plan.activeClient.packageType);
  return {
    activeClients: 1,
    packageType: plan.activeClient.packageType,
    deliverablesReady: activeRoute ? 'READY' : 'MISSING',
    nextMilestone: plan.activeClient.nextMilestone,
    estimatedWorkload: activeRoute?.estimatedWorkload ?? 'unknown',
    nextAction: plan.activeClient.nextAction,
  };
}

function buildDeliveryPlan(now: Date): ClientDeliveryPlan {
  const routes = deliveryRoutes();
  return {
    generatedAt: now.toISOString(),
    activeClient: {
      clientName: 'Flora and Fauna Foods',
      packageType: 'Pilot Package',
      status: 'planning_ready',
      nextMilestone: 'Day 1: Configure client profile',
      nextAction: 'After sale, confirm package selection and start the matching delivery route.',
    },
    routes,
    safetyRules,
  };
}

function deliveryRoutes(): DeliveryRoute[] {
  return [
    {
      packageType: 'Pilot Package',
      deliverables: [
        '10-15 reviewed opportunities',
        'Executive summary',
        'Sales intelligence report',
        'Review notes',
      ],
      reviewCheckpoints: [
        'Confirm client profile and target geography before discovery.',
        'Review raw opportunities before inclusion in the delivery pack.',
        'Approve final lead table and executive summary before client delivery.',
        'Capture client feedback after delivery.',
      ],
      estimatedTimeline: [
        { milestone: 'Day 1', work: 'Configure client profile' },
        { milestone: 'Day 2', work: 'Discovery' },
        { milestone: 'Day 3', work: 'Review' },
        { milestone: 'Day 4', work: 'Delivery pack' },
        { milestone: 'Day 5', work: 'Client feedback' },
      ],
      filesToGenerate: [
        'output/pilot-pack/flora-pilot-pack.md',
        'output/pilot-pack/flora-pilot-summary.md',
        'output/client-delivery/client-delivery-checklist.md',
      ],
      successMetrics: [
        '10-15 reviewed opportunities delivered.',
        'False positives removed before delivery.',
        'Client confirms whether opportunities are useful.',
        'Pilot continuation decision captured.',
      ],
      nextActions: [
        'Confirm Flora target event types, locations, and minimum opportunity quality.',
        'Run local lead review workflow when data is available.',
        'Generate pilot pack and manually review before delivery.',
        'Record client feedback after delivery.',
      ],
      estimatedWorkload: '5 delivery days',
    },
    {
      packageType: 'Growth Package',
      deliverables: [
        'Weekly delivery cadence',
        'Monthly reporting',
        'Review sessions',
        'Trend summaries',
        'Opportunity learning',
      ],
      reviewCheckpoints: [
        'Weekly quality review before each delivery.',
        'Monthly trend review and client feedback review.',
        'Opportunity learning review before adjusting targeting.',
        'Retainer renewal check after month one.',
      ],
      estimatedTimeline: [
        { milestone: 'Week 1', work: 'Set recurring client profile and first weekly delivery.' },
        { milestone: 'Weekly', work: 'Review opportunities, deliver lead pack, and record feedback.' },
        { milestone: 'Monthly', work: 'Generate reporting, trend summary, and learning notes.' },
      ],
      filesToGenerate: [
        'output/lead-discovery/clients/flora_and_fauna_foods_001/delivery-ready-pack.md',
        'output/lead-discovery/dashboard/client-dashboard.md',
        'output/lead-discovery/outcomes/outcome-summary.md',
      ],
      successMetrics: [
        '20-40 reviewed leads per month.',
        'Weekly delivery is consistent.',
        'Client feedback improves targeting.',
        'Monthly report identifies lead themes and next priorities.',
      ],
      nextActions: [
        'Confirm weekly delivery day.',
        'Define monthly reporting expectations.',
        'Run weekly local review and delivery workflow.',
        'Update learning from accepted and rejected opportunities.',
      ],
      estimatedWorkload: 'weekly cadence plus monthly report',
    },
    {
      packageType: 'Premium Package',
      deliverables: [
        'Warm Intent opportunities',
        'Interest verification preparation',
        'Priority review queue',
        'Custom reports',
      ],
      reviewCheckpoints: [
        'Priority review queue approval before each client handoff.',
        'Interest verification preparation review before any human-led contact.',
        'Custom report review before client delivery.',
        'Executive summary review for every delivery cycle.',
      ],
      estimatedTimeline: [
        { milestone: 'Day 1', work: 'Confirm custom qualification rules and reporting format.' },
        { milestone: 'Days 2-3', work: 'Build priority review queue and warm-intent shortlist.' },
        { milestone: 'Day 4', work: 'Prepare interest verification context and custom report.' },
        { milestone: 'Day 5', work: 'Manual approval and client delivery.' },
      ],
      filesToGenerate: [
        'output/lead-discovery/verification/review-queue.md',
        'output/lead-discovery/verification/manual-approval-checklist.md',
        'output/pilot-pack/flora-pilot-pack.md',
        'output/client-delivery/client-next-actions.md',
      ],
      successMetrics: [
        'Warm-intent opportunities prioritized first.',
        'Interest verification context prepared without outreach automation.',
        'Custom report answers client-specific questions.',
        'Client approves next delivery cycle or custom criteria.',
      ],
      nextActions: [
        'Confirm premium qualification criteria.',
        'Generate priority review queue from local candidates.',
        'Prepare interest verification context for manual review.',
        'Build custom report and review before delivery.',
      ],
      estimatedWorkload: 'priority 5-day delivery cycle',
    },
  ];
}

function renderPlan(plan: ClientDeliveryPlan): string {
  return `# Client Delivery Plan

Generated: ${plan.generatedAt}

## Active Client

- Client: ${plan.activeClient.clientName}
- Package type: ${plan.activeClient.packageType}
- Status: ${plan.activeClient.status}
- Next milestone: ${plan.activeClient.nextMilestone}
- Next action: ${plan.activeClient.nextAction}

## Package Routes

${plan.routes.map(renderRoute).join('\n\n')}

## Safety Rules

${plan.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderRoute(route: DeliveryRoute): string {
  return `### ${route.packageType}

Deliverables:
${route.deliverables.map((item) => `- ${item}`).join('\n')}

Review checkpoints:
${route.reviewCheckpoints.map((item) => `- ${item}`).join('\n')}

Estimated timeline:
${route.estimatedTimeline.map((item) => `- ${item.milestone}: ${item.work}`).join('\n')}

Files to generate:
${route.filesToGenerate.map((item) => `- ${item}`).join('\n')}

Success metrics:
${route.successMetrics.map((item) => `- ${item}`).join('\n')}

Next actions:
${route.nextActions.map((item) => `- ${item}`).join('\n')}

Estimated workload: ${route.estimatedWorkload}`;
}

function renderChecklist(routes: DeliveryRoute[]): string {
  return `# Client Delivery Checklist

| Package | Deliverables | Review checkpoints | Files to generate | Success metrics |
| --- | --- | --- | --- | --- |
${routes.map((route) => `| ${route.packageType} | ${route.deliverables.join('; ')} | ${route.reviewCheckpoints.join('; ')} | ${route.filesToGenerate.join('; ')} | ${route.successMetrics.join('; ')} |`).join('\n')}
`;
}

function renderTimeline(routes: DeliveryRoute[]): string {
  return `# Client Delivery Timeline

${routes.map((route) => `## ${route.packageType}\n\n${route.estimatedTimeline.map((item) => `- ${item.milestone}: ${item.work}`).join('\n')}`).join('\n\n')}
`;
}

function renderNextActions(plan: ClientDeliveryPlan): string {
  return `# Client Next Actions

Active client: ${plan.activeClient.clientName}

Selected package: ${plan.activeClient.packageType}

Next milestone: ${plan.activeClient.nextMilestone}

Next action: ${plan.activeClient.nextAction}

## Package Action Menus

${plan.routes.map((route) => `### ${route.packageType}\n\n${route.nextActions.map((action) => `- ${action}`).join('\n')}`).join('\n\n')}

Manual delivery planning only. No providers, network, scraping, browser automation, outreach, emails, DMs, calls, forms, paid services, or production client systems are used.
`;
}

function readPlan(): ClientDeliveryPlan | null {
  if (!fs.existsSync(planJsonPath)) return null;
  return JSON.parse(fs.readFileSync(planJsonPath, 'utf8')) as ClientDeliveryPlan;
}

if (require.main === module) {
  generateClientDeliveryRouter();
  console.log(`Generated client delivery router: ${[planMarkdownPath, planJsonPath, checklistPath, timelinePath, nextActionsPath].map((filePath) => path.relative(process.cwd(), filePath)).join(', ')}`);
}
