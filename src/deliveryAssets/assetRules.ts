import fs = require('fs');
import path = require('path');
import { buildAutomationDeliveryReport, buildAutomationDeliveryReportForClient } from '../automationDelivery/automationRules';
import { AutomationDeliveryReport } from '../automationDelivery/types';
import { buildCurrentClientConversion } from '../clientConversion/conversionRules';
import { ClientPackage, ClientRecord } from '../clientConversion/types';
import { loadEvidenceProReport } from '../evidencePro/evidenceProRules';
import { EvidenceProReport } from '../evidencePro/types';
import { buildRetainerOperationsReportForClient } from '../retainerOperations/retainerRules';
import { RetainerOperationsReport } from '../retainerOperations/types';
import {
  CoverageAssetStatus,
  DeliveryAssetsDashboard,
  DeliveryAssetsReport,
  DeliveryCoverage,
  DeliveryRisk,
  DeliveryTimelinePhase,
  OnboardingChecklistSection,
} from './types';

export const deliveryAssetsOutputDir = path.join(process.cwd(), 'output', 'delivery-assets');

const safetyRules = [
  'Local-only delivery asset preparation.',
  'No report is sent, no meeting or invoice is created, and no payment or deployment is performed.',
  'No client repository, private system, credentials, or production data is accessed or modified.',
  'Use observed signal, potential area to review, and candidate flow language; do not claim bugs, outages, vulnerabilities, lost revenue, or business impact.',
  'All assets require Daniel review and explicit human approval before client-facing use.',
];

export function buildDeliveryAssetsReport(): DeliveryAssetsReport {
  const conversion = buildCurrentClientConversion();
  if (!conversion) throw new Error('No current client conversion exists. Run npm run client:convert first.');
  const evidence = loadEvidenceProReport();
  const automation = buildAutomationDeliveryReport();
  const retainer = buildRetainerOperationsReportForClient(conversion.record, automation);
  return buildDeliveryAssetsReportForClient(conversion.record, automation, evidence, retainer);
}

export function buildDeliveryAssetsReportForClient(
  client: ClientRecord,
  automation = buildAutomationDeliveryReportForClient(client),
  evidence: EvidenceProReport | null = null,
  retainer = buildRetainerOperationsReportForClient(client, automation),
): DeliveryAssetsReport {
  const matchingEvidence = evidence?.target.companyId === client.clientId ? evidence : null;
  const coverage = coverageMatrix(automation, retainer, matchingEvidence);
  const risks = riskMatrix(automation, matchingEvidence);
  const blockers = [
    ...(!matchingEvidence ? ['Current client Evidence Pro package is not available.'] : []),
    ...(matchingEvidence && matchingEvidence.status !== 'READY' ? [`Evidence Pro package is ${matchingEvidence.status}.`] : []),
    ...(client.status !== 'delivery-prep' && client.status !== 'delivery-active' ? [`Client status ${client.status} requires review.`] : []),
  ];
  const status = !client.website ? 'NOT READY'
    : blockers.length > 0 ? 'PARTIAL' : 'READY FOR REVIEW';
  const maintenanceRecommendations = retainer.maintenance.weekly.concat(retainer.maintenance.monthly);
  const expansionRecommendations = retainer.expansionOpportunities;

  return {
    generatedAt: new Date().toISOString(),
    client,
    package: client.selectedPackage,
    status,
    evidenceStatus: matchingEvidence?.status ?? 'NOT AVAILABLE',
    evidenceSummary: evidenceSummary(matchingEvidence),
    criticalFlows: automation.criticalFlows.map((flow) => flow.name),
    potentialAreasToReview: potentialAreas(risks),
    recommendedNextSteps: nextSteps(client.selectedPackage, matchingEvidence, automation),
    risks,
    coverage,
    timeline: deliveryTimeline(client.selectedPackage),
    implementationBlueprint: implementationBlueprint(),
    onboarding: onboardingChecklist(client.selectedPackage),
    maintenanceRecommendations,
    expansionRecommendations,
    bundleContents: bundleContents(client.selectedPackage),
    blockers,
    safetyRules,
  };
}

export function buildDeliveryAssetsDashboard(): DeliveryAssetsDashboard {
  try {
    const report = buildDeliveryAssetsReport();
    return {
      deliveryAssetsStatus: report.status,
      executiveReportStatus: report.evidenceSummary.length > 0 ? 'READY FOR REVIEW' : 'NOT READY',
      coverageMatrixStatus: report.coverage.length > 0 ? 'READY FOR REVIEW' : 'NOT READY',
      timelineStatus: report.timeline.length === 6 ? 'READY FOR REVIEW' : 'NOT READY',
      onboardingStatus: report.onboarding.length > 0 ? 'READY FOR REVIEW' : 'NOT READY',
      bundleStatus: report.bundleContents.length > 0 ? 'READY FOR REVIEW' : 'NOT READY',
    };
  } catch {
    return {
      deliveryAssetsStatus: 'NOT READY',
      executiveReportStatus: 'NOT READY',
      coverageMatrixStatus: 'NOT READY',
      timelineStatus: 'NOT READY',
      onboardingStatus: 'NOT READY',
      bundleStatus: 'NOT READY',
    };
  }
}

export function writeDeliveryAssetsOutputs(report = buildDeliveryAssetsReport()): string[] {
  fs.mkdirSync(deliveryAssetsOutputDir, { recursive: true });
  const outputs = [
    ['client-executive-report.md', renderExecutiveReport(report)],
    ['risk-matrix.md', renderRiskMatrix(report)],
    ['coverage-matrix.md', renderCoverageMatrix(report)],
    ['delivery-timeline.md', renderDeliveryTimeline(report)],
    ['implementation-blueprint.md', renderImplementationBlueprint(report)],
    ['onboarding-checklist.md', renderOnboardingChecklist(report)],
    ['asset-bundle.md', renderAssetBundle(report)],
    ['delivery-assets-summary.md', renderDeliveryAssetsSummary(report)],
    ['delivery-readiness.md', renderDeliveryReadiness(report)],
  ] as const;
  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(deliveryAssetsOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderExecutiveReport(report: DeliveryAssetsReport): string {
  return document(report, 'Client Executive Report', [
    bullets([
      `Company: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Delivery Assets Status: ${report.status}`,
      `Evidence Package Status: ${report.evidenceStatus}`,
    ]),
    '',
    '## Evidence Summary',
    '',
    bullets(report.evidenceSummary),
    '',
    '## Critical Flows',
    '',
    bullets(report.criticalFlows.map((flow) => `Candidate flow: ${flow}`)),
    '',
    '## Potential Areas To Review',
    '',
    bullets(report.potentialAreasToReview),
    '',
    '## Recommended Next Steps',
    '',
    numbered(report.recommendedNextSteps),
  ]);
}

export function renderRiskMatrix(report: DeliveryAssetsReport): string {
  return document(report, 'Risk Matrix', [
    'Risk levels prioritize review effort only and do not infer business impact.',
    '',
    '| Area | Risk Level | Observed Signals | Recommended Review Priority |',
    '| --- | --- | --- | --- |',
    ...report.risks.map((risk) => `| ${escapeTable(risk.area)} | ${risk.riskLevel} | ${escapeTable(risk.observedSignals.join('; '))} | ${risk.recommendedReviewPriority} |`),
  ]);
}

export function renderCoverageMatrix(report: DeliveryAssetsReport): string {
  return document(report, 'Coverage Matrix', [
    '| Critical Flow | Coverage Status | Recommended Automation | Priority |',
    '| --- | --- | --- | --- |',
    ...report.coverage.map((item) => `| ${escapeTable(item.criticalFlow)} | ${item.coverageStatus} | ${escapeTable(item.recommendedAutomation)} | ${item.priority} |`),
    '',
    'No flow is marked Automated without a real automation record.',
  ]);
}

export function renderDeliveryTimeline(report: DeliveryAssetsReport): string {
  return document(report, 'Delivery Timeline', [
    ...report.timeline.flatMap((phase) => [
      `## ${phase.phase}: ${phase.title}`,
      '',
      checklist(phase.activities),
      '',
    ]),
    'All phases remain planning-only.',
  ]);
}

export function renderImplementationBlueprint(report: DeliveryAssetsReport): string {
  return document(report, 'Implementation Blueprint', [
    'Recommendations only. No executable client code was generated.',
    '',
    '| Area | Recommendation |',
    '| --- | --- |',
    ...report.implementationBlueprint.map((item) => `| ${item.area} | ${escapeTable(item.recommendation)} |`),
  ]);
}

export function renderOnboardingChecklist(report: DeliveryAssetsReport): string {
  return document(report, 'Onboarding Checklist', report.onboarding.flatMap((section) => [
    `## ${section.heading}`,
    '',
    `Boundary: ${section.boundary}`,
    '',
    checklist(section.items),
    '',
  ]));
}

export function renderAssetBundle(report: DeliveryAssetsReport): string {
  const packageSections = report.package === 'qa-audit'
    ? [
      embedded('Executive Report', renderExecutiveReport(report)),
      embedded('Risk Matrix', renderRiskMatrix(report)),
      embedded('Coverage Matrix', renderCoverageMatrix(report)),
    ]
    : report.package === 'starter-pack'
      ? [
        embedded('Executive Report', renderExecutiveReport(report)),
        embedded('Coverage Matrix', renderCoverageMatrix(report)),
        embedded('Implementation Blueprint', renderImplementationBlueprint(report)),
        embedded('Timeline', renderDeliveryTimeline(report)),
        embedded('Onboarding Checklist', renderOnboardingChecklist(report)),
      ]
      : [
        embedded('Executive Report', renderExecutiveReport(report)),
        embedded('Coverage Matrix', renderCoverageMatrix(report)),
        embedded('Timeline', renderDeliveryTimeline(report)),
        [
          '## Maintenance Recommendations',
          '',
          bullets(report.maintenanceRecommendations),
          '',
          '## Expansion Recommendations',
          '',
          bullets(report.expansionRecommendations),
        ].join('\n'),
      ];
  return document(report, 'Delivery Asset Bundle', [
    bullets([
      `Company: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Bundle Status: ${report.status}`,
    ]),
    '',
    '## Included Assets',
    '',
    checklist(report.bundleContents),
    '',
    ...packageSections.flatMap((section) => [section, '']),
  ]);
}

export function renderDeliveryAssetsSummary(report: DeliveryAssetsReport): string {
  return document(report, 'Delivery Assets Summary', [
    bullets([
      `Client: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Status: ${report.status}`,
      `Evidence Status: ${report.evidenceStatus}`,
      `Risk Areas: ${report.risks.length}`,
      `Coverage Rows: ${report.coverage.length}`,
      `Timeline Phases: ${report.timeline.length}`,
      `Bundle Assets: ${report.bundleContents.length}`,
    ]),
  ]);
}

export function renderDeliveryReadiness(report: DeliveryAssetsReport): string {
  return document(report, 'Delivery Assets Readiness', [
    bullets([
      `Status: ${report.status}`,
      `Client: ${report.client.clientName}`,
      `Package: ${report.package}`,
      `Evidence Package: ${report.evidenceStatus}`,
    ]),
    '',
    '## Blockers',
    '',
    bullets(report.blockers.length > 0 ? report.blockers : ['No preparation blockers detected. Human review remains required.']),
  ]);
}

function coverageMatrix(
  automation: AutomationDeliveryReport,
  retainer: RetainerOperationsReport,
  evidence: EvidenceProReport | null,
): DeliveryCoverage[] {
  return automation.criticalFlows.map((flow) => {
    const retainerFlow = retainer.coverage.find((item) => item.name === flow.name);
    let coverageStatus: CoverageAssetStatus = 'Planned';
    if (retainerFlow?.status === 'AUTOMATED') coverageStatus = 'Automated';
    else if (flow.type === 'client-access-required') coverageStatus = 'Pending';
    else if (flow.type === 'public-page' && evidence?.status === 'READY') coverageStatus = 'Observed';
    return {
      criticalFlow: flow.name,
      coverageStatus,
      recommendedAutomation: flow.recommendedAutomation,
      priority: flow.priority,
    };
  });
}

function riskMatrix(automation: AutomationDeliveryReport, evidence: EvidenceProReport | null): DeliveryRisk[] {
  const evidenceSignals = evidence?.groupedSignals.map((signal) => `${signal.level}: ${signal.signature} (${signal.count})`) ?? [];
  const failedRequestSignal = evidence ? `${evidence.har.failedRequests} failed request signal(s) observed in the passive HAR.` : 'HAR evidence not available.';
  const performanceSignal = evidence
    ? `Observed page load ${valueMs(evidence.performance.loadEventMs)} and LCP ${valueMs(evidence.performance.largestContentfulPaintMs)}.`
    : 'Performance evidence not available.';
  return [
    risk('Public page delivery', 'HIGH', [failedRequestSignal, performanceSignal], 'HIGH'),
    risk('Console and network diagnostics', evidenceSignals.length > 0 ? 'HIGH' : 'MEDIUM', evidenceSignals.length > 0 ? evidenceSignals : ['No grouped observed signals available.'], 'HIGH'),
    risk('Third-party dependencies', 'MEDIUM', [evidence ? `${evidence.dependencies.length} observed dependency host(s).` : 'Dependency evidence not available.'], 'MEDIUM'),
    risk('Critical flow coverage', 'HIGH', [`${automation.criticalFlows.length} candidate critical flow(s); no automation is assumed.`], 'HIGH'),
    risk('Client-access boundaries', 'MEDIUM', automation.criticalFlows.filter((flow) => flow.type === 'client-access-required').map((flow) => `${flow.name} requires approved client access.`), 'MEDIUM'),
  ];
}

function risk(
  area: string,
  riskLevel: DeliveryRisk['riskLevel'],
  observedSignals: string[],
  recommendedReviewPriority: DeliveryRisk['recommendedReviewPriority'],
): DeliveryRisk {
  return { area, riskLevel, observedSignals, recommendedReviewPriority };
}

function evidenceSummary(evidence: EvidenceProReport | null): string[] {
  if (!evidence) return ['Evidence Pro package is not available for the current client.'];
  return [
    `Observed signal: public homepage returned HTTP ${evidence.statusCode ?? 'not available'}.`,
    `Observed performance: DOMContentLoaded ${valueMs(evidence.performance.domContentLoadedMs)}, load ${valueMs(evidence.performance.loadEventMs)}, LCP ${valueMs(evidence.performance.largestContentfulPaintMs)}.`,
    `Observed page weight: ${formatBytes(evidence.pageWeight.pageSizeBytes)} across ${evidence.pageWeight.requestCount} request(s).`,
    `Observed dependency signals: ${evidence.dependencies.length} third-party host(s).`,
    `Potential areas to review: ${evidence.groupedSignals.length} grouped console/network signal(s).`,
  ];
}

function potentialAreas(risks: DeliveryRisk[]): string[] {
  return risks.map((risk) => `${risk.area}: ${risk.observedSignals[0] ?? 'Review current evidence.'}`);
}

function nextSteps(selectedPackage: ClientPackage, evidence: EvidenceProReport | null, automation: AutomationDeliveryReport): string[] {
  const base = [
    evidence ? 'Review the Evidence Pro package and validate every observed signal.' : 'Generate and review Evidence Pro for the current client.',
    `Review ${automation.criticalFlows.length} candidate critical flows and approve the bounded delivery scope.`,
    'Confirm client-facing wording does not claim defects or business impact.',
  ];
  if (selectedPackage === 'qa-audit') return [...base, 'Approve the executive report, risk matrix, and coverage matrix for manual delivery.'];
  if (selectedPackage === 'starter-pack') return [...base, 'Confirm implementation environment, credentials, and automation priorities before any coding.'];
  return [...base, 'Review maintenance cadence, reporting expectations, renewal readiness, and expansion recommendations.'];
}

function deliveryTimeline(selectedPackage: ClientPackage): DeliveryTimelinePhase[] {
  return [
    phase('Phase 1', 'Discovery', ['Confirm package scope, public evidence, stakeholders, and approval owner.']),
    phase('Phase 2', 'Evidence Review', ['Review screenshots, HAR, trace, video, Lighthouse, performance, dependencies, and grouped observed signals.']),
    phase('Phase 3', 'Automation Planning', ['Prioritize candidate flows, access boundaries, framework recommendations, and reporting expectations.']),
    phase('Phase 4', 'Implementation', [selectedPackage === 'qa-audit' ? 'Keep implementation as a future recommendation unless a Starter Pack is approved.' : 'Implement only the separately approved scope in an approved environment.']),
    phase('Phase 5', 'Reporting', ['Prepare reviewed executive, risk, coverage, evidence, and implementation summaries.']),
    phase('Phase 6', 'Review', ['Daniel reviews every asset and manually approves any client-facing delivery.']),
  ];
}

function phase(phaseValue: string, title: string, activities: string[]): DeliveryTimelinePhase {
  return { phase: phaseValue, title, activities };
}

function implementationBlueprint(): Array<{ area: string; recommendation: string }> {
  return [
    { area: 'Playwright', recommendation: 'Use Playwright for approved browser smoke and regression coverage.' },
    { area: 'TypeScript', recommendation: 'Use strict TypeScript interfaces for fixtures, Page Objects, and test data.' },
    { area: 'Page Object Model', recommendation: 'Separate stable page behavior from Arrange-Act-Assert test intent.' },
    { area: 'Fixtures', recommendation: 'Use reusable public-only fixtures first; authenticated fixtures require approved credentials.' },
    { area: 'Reporting', recommendation: 'Use Playwright HTML reporting and reviewed evidence links; consider Allure when history is required.' },
    { area: 'CI', recommendation: 'Run install, typecheck, approved tests, and artifact upload without deployment.' },
    { area: 'Evidence Collection', recommendation: 'Retain bounded screenshots, traces, video-on-failure, HAR, and performance observations.' },
  ];
}

function onboardingChecklist(selectedPackage: ClientPackage): OnboardingChecklistSection[] {
  return [
    section('Required Inputs', 'public-only', ['Confirmed company name and website', 'Selected package and approved scope', 'Primary review owner', 'Desired report format']),
    section('Public-Only Evidence', 'public-only', ['Approved public URLs', 'Public workflow priorities', 'Existing public evidence and known constraints']),
    section('Required Access', 'client-access-required', ['Approved staging or test environment', 'Repository access only if separately approved', 'CI access only if separately approved', ...(selectedPackage === 'qa-audit' ? [] : ['Approved automation execution environment'])]),
    section('Required Credentials', 'client-access-required', ['Synthetic test account if authenticated coverage is approved', 'Credentials supplied through an approved secret channel', 'No production passwords or credentials stored in Studio']),
    section('Required Approvals', 'client-access-required', ['Scope approval', 'Access-boundary approval', 'Evidence-retention approval', 'Implementation approval', 'Client-facing delivery approval']),
    section('Communication Preferences', 'public-only', ['Primary contact and review owner', 'Preferred review cadence', 'Preferred report format', 'Escalation path for evidence questions']),
    section('Review Requirements', 'public-only', ['Validate every observed signal', 'Remove unsupported claims', 'Confirm private data is absent', 'Approve final wording and delivery package']),
  ];
}

function section(
  heading: string,
  boundary: OnboardingChecklistSection['boundary'],
  items: string[],
): OnboardingChecklistSection {
  return { heading, boundary, items };
}

function bundleContents(selectedPackage: ClientPackage): string[] {
  if (selectedPackage === 'qa-audit') {
    return ['Client Executive Report', 'Risk Matrix', 'Coverage Matrix'];
  }
  if (selectedPackage === 'starter-pack') {
    return ['Client Executive Report', 'Coverage Matrix', 'Implementation Blueprint', 'Delivery Timeline', 'Onboarding Checklist'];
  }
  return ['Client Executive Report', 'Coverage Matrix', 'Delivery Timeline', 'Maintenance Recommendations', 'Expansion Recommendations'];
}

function document(report: DeliveryAssetsReport, title: string, body: string[]): string {
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

function renderEmbeddedSection(value: string): string {
  return value
    .replace(/^# .+\n+/, '')
    .replace(/\n+## Safety Rules[\s\S]*$/, '')
    .trim();
}

function embedded(title: string, value: string): string {
  return [`## ${title}`, '', renderEmbeddedSection(value)].join('\n');
}

function valueMs(value: number | null): string {
  return value === null ? 'not available' : `${value} ms`;
}

function formatBytes(value: number): string {
  if (value <= 0) return 'not available';
  return value >= 1024 * 1024 ? `${(value / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(value / 1024)} KB`;
}

function bullets(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function numbered(items: string[]): string {
  return items.length > 0 ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. None.';
}

function checklist(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- [ ] ${item}`).join('\n') : '- [ ] None.';
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
