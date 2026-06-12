import fs = require('fs');
import path = require('path');
import {
  PlaywrightEvidencePlan,
  PlaywrightReadinessData,
  PlaywrightReadinessReport,
  PlaywrightTarget,
  ReadinessValue,
  SourceAvailability,
  TargetPriorityReport,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'playwright-evidence', 'playwright-targets.json');
const readinessPath = path.join(process.cwd(), 'data', 'playwright-evidence', 'playwright-readiness.json');
const outputDir = path.join(process.cwd(), 'output', 'playwright-evidence');

const storagePlan = [
  'data/evidence/playwright/screenshots/',
  'data/evidence/playwright/traces/',
  'data/evidence/playwright/reports/',
  'data/evidence/playwright/flows/',
  'data/evidence/playwright/observations/',
];

export function buildPlaywrightEvidencePlan(): PlaywrightEvidencePlan {
  const readiness = loadReadiness();

  return {
    targets: buildTargetPriorities(),
    readinessCategories: readiness.readinessCategories,
    futureEvidenceTypes: readiness.futureEvidenceTypes,
    allowedFutureFlows: readiness.allowedFutureFlows,
    storagePlan,
    futureExecutionCommand: readiness.futureExecutionCommand,
    safetyRules: readiness.safetyRules,
  };
}

export function buildPlaywrightReadinessReport(): PlaywrightReadinessReport {
  const readiness = loadReadiness();

  return {
    categories: readiness.readinessCategories,
    targetPriorities: buildTargetPriorities(),
    storagePlan,
    safetyRules: readiness.safetyRules,
    futureExecutionCommand: readiness.futureExecutionCommand,
  };
}

export function writePlaywrightEvidencePlan(plan: PlaywrightEvidencePlan): string[] {
  const outputs = [
    ['playwright-evidence-plan.md', renderPlaywrightEvidencePlan(plan)],
    ['playwright-target-priorities.md', renderTargetPriorities(plan.targets)],
    ['playwright-storage-plan.md', renderStoragePlan(plan.storagePlan)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function writePlaywrightReadinessReport(report: PlaywrightReadinessReport): string[] {
  const outputs = [
    ['playwright-readiness.md', renderPlaywrightReadiness(report)],
    ['playwright-safety-rules.md', renderSafetyRules(report.safetyRules, report.futureExecutionCommand)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderPlaywrightEvidencePlan(plan: PlaywrightEvidencePlan): string {
  return `# Playwright Evidence Plan

## Current State

${bullets([
    'Opportunity, audit pack, evidence, and evidence-capture outputs exist locally.',
    'Playwright evidence collection is not implemented.',
    'No target company Playwright execution is approved by this plan.',
  ])}

## Future Evidence Types

${bullets(plan.futureEvidenceTypes)}

## Allowed Future Flows

${bullets(plan.allowedFutureFlows)}

## Target Priorities

${renderTargetPriorityTable(plan.targets)}

## Future Execution Design

Command documented only:

\`\`\`sh
${plan.futureExecutionCommand}
\`\`\`

Inputs:
${bullets([
    'Company name from local target list.',
    'Human-approved public URL and flow scope.',
    'Safety checklist approval before execution.',
    'Storage destination under data/evidence/playwright/.',
  ])}

Outputs:
${bullets([
    'Future standardized Playwright evidence records.',
    'Future supporting files only when explicitly approved.',
    'Future local Markdown summary for audit support.',
  ])}

Approval Requirements:
${bullets([
    'Daniel approval before any execution.',
    'Approved public page scope only.',
    'No login, account creation, payment, or authenticated areas.',
  ])}

Storage Location:
${bullets(plan.storagePlan)}

Expected Evidence Types:
${bullets(plan.futureEvidenceTypes)}

## Readiness Categories

${renderReadinessTable(plan.readinessCategories)}

## Safety Notes

${bullets(plan.safetyRules)}
`;
}

export function renderPlaywrightReadiness(report: PlaywrightReadinessReport): string {
  return `# Playwright Readiness

## Readiness Categories

${renderReadinessTable(report.categories)}

## Target Readiness

${renderTargetPriorityTable(report.targetPriorities)}

## Future Execution Command

\`\`\`sh
${report.futureExecutionCommand}
\`\`\`

This command is documented only and is not implemented in Sprint 60.

## Storage Readiness

${bullets(report.storagePlan.map((entry) => `${entry} documented for future use; no evidence files generated.`))}

## Safety Notes

${bullets(report.safetyRules)}
`;
}

export function renderTargetPriorities(targets: TargetPriorityReport[]): string {
  return `# Playwright Target Priorities

${targets.map((target) => `## ${target.priority}. ${target.companyName}

${bullets([
    `Readiness: ${target.readiness}`,
    `Reason: ${target.reason}`,
    `Recommended First Flow: ${target.recommendedFirstFlow}`,
    `Research Gaps: ${target.researchGaps.length > 0 ? target.researchGaps.join(', ') : 'None recorded'}`,
  ])}

### Source Availability

${bullets(target.sourceAvailability.map((source) => `${source.label}: ${source.available ? 'Available' : 'Missing'} - ${source.path}`))}`).join('\n\n')}
`;
}

export function renderStoragePlan(entries: string[]): string {
  return `# Playwright Storage Plan

Future Playwright storage structure is documented and prepared only. Sprint 60 does not generate evidence files inside these folders.

${bullets(entries.map((entry) => `${entry} - future approved Playwright evidence storage`))}

## Safety Notes

${bullets(loadReadiness().safetyRules)}
`;
}

export function renderSafetyRules(rules: string[], futureExecutionCommand: string): string {
  return `# Playwright Safety Rules

${bullets(rules)}

## Future Execution Command

\`\`\`sh
${futureExecutionCommand}
\`\`\`

This command is documented only. It must not be implemented or run without a future human-approved controlled execution sprint.
`;
}

function buildTargetPriorities(): TargetPriorityReport[] {
  return loadTargets()
    .sort((left, right) => left.priority - right.priority || left.companyName.localeCompare(right.companyName))
    .map((target) => ({
      ...target,
      readiness: target.researchGaps.length === 0 ? 'Partially Ready' : 'Not Ready',
      sourceAvailability: buildSourceAvailability(target.companyId),
    }));
}

function buildSourceAvailability(companyId: string): SourceAvailability[] {
  const files = [
    ['Opportunity Output', `output/opportunities/${companyId}-opportunity.md`],
    ['QA Audit Pack', `output/audit-packs/${companyId}-audit-pack.md`],
    ['Evidence Report', `output/evidence/${companyId}-evidence.md`],
    ['Evidence Capture Plan', 'output/evidence-capture/evidence-capture-plan.md'],
    ['Evidence Roadmap', 'output/evidence-capture/evidence-roadmap.md'],
  ] as const;

  return files.map(([label, relativePath]) => ({
    label,
    path: relativePath,
    available: fs.existsSync(path.join(process.cwd(), relativePath)),
  }));
}

function renderTargetPriorityTable(targets: TargetPriorityReport[]): string {
  return `| Rank | Company | Readiness | Recommended First Flow | Research Gaps |
| --- | --- | --- | --- | --- |
${targets.map((target) => `| ${target.priority} | ${target.companyName} | ${target.readiness} | ${target.recommendedFirstFlow} | ${target.researchGaps.length > 0 ? target.researchGaps.join('; ') : 'None'} |`).join('\n')}`;
}

function renderReadinessTable(categories: PlaywrightReadinessData['readinessCategories']): string {
  return `| Category | Value | Reason |
| --- | --- | --- |
${categories.map((category) => `| ${category.category} | ${category.value} | ${category.reason} |`).join('\n')}`;
}

function loadTargets(): PlaywrightTarget[] {
  return readJson<PlaywrightTarget[]>(targetsPath);
}

function loadReadiness(): PlaywrightReadinessData {
  return readJson<PlaywrightReadinessData>(readinessPath);
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None recorded.';
  return items.map((item) => `- ${item}`).join('\n');
}
