import fs = require('fs');
import path = require('path');
import {
  ArchitectureAudit,
  CommandGroup,
  CommandInventory,
  RuntimeClassification,
  RuntimeInventory,
  RuntimeInventoryItem,
  SourceOfTruthItem,
  StudioCommand,
} from './types';

export const architectureOutputDir = path.join(process.cwd(), 'output', 'architecture');

const runtimeRoots: Array<RuntimeInventoryItem['root']> = ['data', 'output', 'runtime', 'dashboard', 'samples'];
const runtimeClassifications: RuntimeClassification[] = ['source-of-truth', 'generated', 'cache', 'runtime', 'sample', 'temporary'];

const officialCommandSurface = [
  'studio:daily',
  'studio:weekly',
  'studio:health',
  'studio:backup',
  'lead:discover',
  'lead:review',
  'audit:prepare',
  'audit:evidence',
  'audit:package',
  'client:convert',
  'delivery:plan',
  'outcome:record',
  'dashboard:generate',
  'dashboard:mobile',
];

const sourceOfTruthItems: SourceOfTruthItem[] = [
  {
    authority: 'Revenue Intelligence',
    sourcePath: 'src/revenueIntelligence/sourceOfTruth.ts',
    derivedOutputs: ['output/revenue-intelligence/', 'output/dashboard/dashboard.json', 'dashboard/dashboard.json'],
    cachePaths: ['data/dashboard/dashboard.json'],
    manualEditPolicy: 'Do not manually edit derived dashboard output; update source modules and regenerate.',
  },
  {
    authority: 'Lead Qualification',
    sourcePath: 'data/web-discovery/normalized-leads.json',
    derivedOutputs: ['output/lead-qualification/', 'output/leads/', 'output/dashboard/dashboard.json'],
    cachePaths: ['data/leads/lead-intelligence-state.json', 'data/lead-discovery/daily-discovery-state.json'],
    manualEditPolicy: 'Use reviewed source data or sample fixtures; avoid hand-editing generated rankings.',
  },
  {
    authority: 'Outcome Learning',
    sourcePath: 'data/outcomes/outcomes.json',
    derivedOutputs: ['output/outcomes/', 'output/outcome-learning/', 'output/winloss/'],
    cachePaths: ['data/outcome-learning/learning-state.json'],
    manualEditPolicy: 'Record only real outcomes through the outcome command path; do not invent replies, wins, or revenue.',
  },
  {
    authority: 'Adaptive Revenue',
    sourcePath: 'data/outcome-learning/outcomes.json',
    derivedOutputs: ['output/adaptive-revenue/', 'output/revenue-intelligence/'],
    cachePaths: ['output/adaptive-revenue/historical-weights.md'],
    manualEditPolicy: 'Treat adaptive outputs as derived recommendations; do not manually edit them as source state.',
  },
  {
    authority: 'Client Records',
    sourcePath: 'data/clients/clients.json and data/clients.json',
    derivedOutputs: ['output/client-delivery/', 'output/client-reporting/', 'output/renewals/'],
    cachePaths: ['data/client-audit-reports/reports.json'],
    manualEditPolicy: 'Keep real client records private; public repo should use sanitized samples only.',
  },
];

export function buildArchitectureAudit(): ArchitectureAudit {
  const commandInventory = buildCommandInventory();
  const runtimeInventory = buildRuntimeInventory();
  const risks = buildRisks(commandInventory, runtimeInventory);

  return {
    generatedAt: new Date().toISOString(),
    commandInventory,
    runtimeInventory,
    sourceOfTruth: sourceOfTruthItems,
    architectureStatus: risks.length > 0 ? 'Needs consolidation' : 'Clean',
    commandHealth: commandInventory.candidateDeprecations.length > 0 || commandInventory.duplicateCommandGroups.length > 0
      ? 'Command surface is too broad'
      : 'Command surface is controlled',
    runtimeHealth: runtimeInventory.candidateArchives.length > 0 || runtimeInventory.duplicateDataCandidates.length > 0
      ? 'Runtime data needs cleanup'
      : 'Runtime data is controlled',
    consolidationProgress: `${officialCommandSurface.length} future official commands recommended; ${commandInventory.candidateDeprecations.length} deprecation candidates identified.`,
    risks,
  };
}

export function buildCommandInventory(): CommandInventory {
  const scripts = readPackageScripts();
  const commands = Object.entries(scripts).map(([name, script]) => classifyCommand(name, script));
  const duplicateCommandGroups = groupCommands(commands, (command) => command.script, 'Commands share the exact same implementation.');
  const overlappingCommandGroups = groupCommands(commands, commandOverlapKey, 'Commands share the same operating domain and likely generate related outputs.');

  return {
    totalCommands: commands.length,
    officialCommands: commands.filter((command) => command.status === 'official-candidate'),
    legacyCommands: commands.filter((command) => command.status === 'legacy'),
    candidateDeprecations: commands.filter((command) => command.status === 'candidate-deprecation'),
    supportingCommands: commands.filter((command) => command.status === 'supporting'),
    duplicateCommandGroups,
    overlappingCommandGroups,
    officialRecommendations: officialCommandSurface,
  };
}

export function buildRuntimeInventory(): RuntimeInventory {
  const files = runtimeRoots.flatMap((root) => listRuntimeFiles(root).map((filePath) => classifyRuntimeFile(root, filePath)));
  const byClassification = runtimeClassifications.reduce((accumulator, classification) => {
    accumulator[classification] = files.filter((file) => file.classification === classification).length;
    return accumulator;
  }, {} as Record<RuntimeClassification, number>);
  const duplicateDataCandidates = groupRuntimeFiles(files, duplicateRuntimeKey);
  const staleFiles = files.filter((file) => file.staleDays >= 30).sort((left, right) => right.staleDays - left.staleDays);
  const candidateArchives = files.filter((file) => file.classification === 'generated' && file.staleDays >= 14);

  return {
    totalFiles: files.length,
    byClassification,
    duplicateDataCandidates,
    staleFiles,
    candidateArchives,
    files,
  };
}

export function writeArchitectureReports(audit: ArchitectureAudit): string[] {
  fs.mkdirSync(architectureOutputDir, { recursive: true });

  const reports = [
    ['architecture-audit.md', renderArchitectureAudit(audit)],
    ['command-inventory.md', renderCommandInventory(audit.commandInventory)],
    ['runtime-inventory.md', renderRuntimeInventory(audit.runtimeInventory)],
    ['consolidation-plan.md', renderConsolidationPlan(audit)],
    ['operating-layer.md', renderOperatingLayer(audit)],
    ['future-sqlite-plan.md', renderFutureSqlitePlan()],
    ['token-efficiency-plan.md', renderTokenEfficiencyPlan(audit)],
    ['source-of-truth-report.md', renderSourceOfTruth(audit.sourceOfTruth)],
  ] as const;

  return reports.map(([fileName, content]) => {
    const outputPath = path.join(architectureOutputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

function classifyCommand(name: string, script: string): StudioCommand {
  const domain = name.includes(':') ? name.split(':')[0] ?? name : name;
  const reasons: string[] = [];
  let status: StudioCommand['status'] = 'supporting';

  if (['dashboard:generate', 'dashboard:mobile'].includes(name)) {
    status = 'official-candidate';
    reasons.push('Already matches the future official command surface.');
  }

  if (name === 'outcome:add') {
    status = 'official-candidate';
    reasons.push('Maps directly to future outcome:record command.');
  }

  if (name.startsWith('lead:discover') || name === 'lead:review') {
    status = 'official-candidate';
    reasons.push('Maps to future lead discovery/review surface.');
  }

  if (name.startsWith('audit:') || name.startsWith('evidence:')) {
    status = 'official-candidate';
    reasons.push('Maps to future audit prepare/evidence/package surface.');
  }

  if (name.startsWith('operator:') || name.startsWith('mac:') || name.startsWith('os:') || name.startsWith('ux:')) {
    status = 'legacy';
    reasons.push('Older operator or OS-specific surface; keep as compatibility until official commands exist.');
  }

  if (
    name.includes('summary') ||
    name.includes('portfolio') ||
    name.includes('review') ||
    name.includes('center') ||
    name.includes('readiness') ||
    name.includes('priorities')
  ) {
    if (status === 'supporting') status = 'candidate-deprecation';
    reasons.push('Likely overlaps with another report command or can be grouped behind an official command.');
  }

  if (!isRevenueIntelligenceRelevant(name) && status === 'supporting') {
    status = 'candidate-deprecation';
    reasons.push('Not directly used by the Revenue Intelligence operating loop.');
  }

  if (reasons.length === 0) reasons.push('Supporting command retained for now.');

  return { name, script, domain, status, reasons };
}

function classifyRuntimeFile(root: RuntimeInventoryItem['root'], filePath: string): RuntimeInventoryItem {
  const relativePath = toRepoPath(path.relative(process.cwd(), filePath));
  const stat = fs.statSync(filePath);
  const staleDays = Math.floor((Date.now() - stat.mtime.getTime()) / (24 * 60 * 60 * 1000));
  const notes: string[] = [];
  let classification: RuntimeClassification = 'runtime';

  if (root === 'samples') classification = 'sample';
  if (root === 'output') classification = 'generated';
  if (root === 'runtime') classification = 'runtime';
  if (root === 'dashboard') classification = relativePath.endsWith('dashboard.json') ? 'cache' : 'generated';
  if (root === 'data') classification = classifyDataPath(relativePath);
  if (relativePath.includes('/.gitkeep')) classification = 'temporary';

  if (classification === 'source-of-truth') notes.push('Treat as authority for a workflow until migrated.');
  if (classification === 'generated') notes.push('Can usually be regenerated; archive stale copies instead of editing manually.');
  if (classification === 'cache') notes.push('Derived runtime cache; regenerate from source.');
  if (staleDays >= 30) notes.push(`Stale candidate: ${staleDays} days since modification.`);

  return {
    path: relativePath,
    root,
    classification,
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    staleDays,
    notes,
  };
}

function classifyDataPath(relativePath: string): RuntimeClassification {
  if (
    relativePath === 'data/clients.json' ||
    relativePath === 'data/leads.json' ||
    relativePath === 'data/first-50-targets.json' ||
    relativePath.startsWith('data/clients/') ||
    relativePath.startsWith('data/outcomes/') ||
    relativePath.startsWith('data/finance/') ||
    relativePath.startsWith('data/contacts/') ||
    relativePath.startsWith('data/outreach/')
  ) {
    return 'source-of-truth';
  }

  if (
    relativePath.startsWith('data/dashboard/') ||
    relativePath.startsWith('data/mobile/') ||
    relativePath.includes('state.json') ||
    relativePath.includes('last-run.json')
  ) {
    return 'cache';
  }

  if (relativePath.endsWith('.example.json')) return 'sample';
  return 'runtime';
}

function renderArchitectureAudit(audit: ArchitectureAudit): string {
  return [
    '# Architecture Audit',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Status',
    '',
    `- Architecture Status: ${audit.architectureStatus}`,
    `- Command Health: ${audit.commandHealth}`,
    `- Runtime Health: ${audit.runtimeHealth}`,
    `- Consolidation Progress: ${audit.consolidationProgress}`,
    '',
    '## Summary',
    '',
    `- Commands audited: ${audit.commandInventory.totalCommands}`,
    `- Duplicate command groups: ${audit.commandInventory.duplicateCommandGroups.length}`,
    `- Legacy commands: ${audit.commandInventory.legacyCommands.length}`,
    `- Candidate deprecations: ${audit.commandInventory.candidateDeprecations.length}`,
    `- Runtime files inventoried: ${audit.runtimeInventory.totalFiles}`,
    `- Source-of-truth authorities: ${audit.sourceOfTruth.length}`,
    '',
    '## Risks',
    '',
    ...bullets(audit.risks),
    '',
    '## Source Of Truth',
    '',
    ...audit.sourceOfTruth.map((item) => `- ${item.authority}: \`${item.sourcePath}\``),
    '',
  ].join('\n');
}

function renderCommandInventory(inventory: CommandInventory): string {
  return [
    '# Command Inventory',
    '',
    `Commands audited: ${inventory.totalCommands}`,
    '',
    '## Official Command Recommendations',
    '',
    ...bullets(inventory.officialRecommendations.map((command) => `\`${command}\``)),
    '',
    '## Existing Official Candidates',
    '',
    ...renderCommands(inventory.officialCommands),
    '',
    '## Legacy Commands',
    '',
    ...renderCommands(inventory.legacyCommands),
    '',
    '## Candidate Deprecations',
    '',
    ...renderCommands(inventory.candidateDeprecations),
    '',
    '## Duplicate Commands',
    '',
    ...renderGroups(inventory.duplicateCommandGroups),
    '',
    '## Overlapping Commands',
    '',
    ...renderGroups(inventory.overlappingCommandGroups.slice(0, 40)),
    '',
  ].join('\n');
}

function renderRuntimeInventory(inventory: RuntimeInventory): string {
  return [
    '# Runtime Inventory',
    '',
    `Runtime files inventoried: ${inventory.totalFiles}`,
    '',
    '## Classification Counts',
    '',
    ...runtimeClassifications.map((classification) => `- ${classification}: ${inventory.byClassification[classification]}`),
    '',
    '## Duplicate Data Candidates',
    '',
    ...renderGroups(inventory.duplicateDataCandidates.slice(0, 40)),
    '',
    '## Stale Files',
    '',
    ...renderRuntimeFiles(inventory.staleFiles.slice(0, 60)),
    '',
    '## Candidate Archives',
    '',
    ...renderRuntimeFiles(inventory.candidateArchives.slice(0, 60)),
    '',
  ].join('\n');
}

function renderConsolidationPlan(audit: ArchitectureAudit): string {
  return [
    '# Consolidation Plan',
    '',
    '## Goals',
    '',
    '- Keep current JSON architecture for now.',
    '- Put official workflows behind a smaller command surface.',
    '- Treat output files as generated artifacts, not source files.',
    '- Archive stale generated reports only after manual review.',
    '',
    '## Command Consolidation',
    '',
    ...audit.commandInventory.officialRecommendations.map((command) => `- Future official command: \`${command}\``),
    '',
    '## Runtime Consolidation',
    '',
    '- Keep source-of-truth JSON in one documented location per domain.',
    '- Move private operational state to `runtime/private-data/` during the repo split.',
    '- Keep `output/` disposable and reproducible.',
    '- Keep `samples/` sanitized and small.',
    '',
    '## Candidate Archives',
    '',
    ...renderRuntimeFiles(audit.runtimeInventory.candidateArchives.slice(0, 40)),
    '',
  ].join('\n');
}

function renderOperatingLayer(audit: ArchitectureAudit): string {
  return [
    '# Studio Operating Layer',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Daily Loop',
    '',
    'Lead Discovery -> Qualification -> Revenue Intelligence -> Audit Prep -> Outreach Review -> Outcome Tracking',
    '',
    '- Lead Discovery: collect and normalize candidate leads without sending outreach.',
    '- Qualification: review fit, QA opportunity, and offer match.',
    '- Revenue Intelligence: choose the single visible revenue priority.',
    '- Audit Prep: prepare evidence and package only after manual review.',
    '- Outreach Review: review drafts and readiness; no auto-send.',
    '- Outcome Tracking: record only real outcomes after manual action.',
    '',
    '## Weekly Loop',
    '',
    '- Lead Review',
    '- Outcome Review',
    '- Revenue Review',
    '- System Health Review',
    '',
    '## Monthly Loop',
    '',
    '- Revenue Review',
    '- Client Review',
    '- Retainer Review',
    '- Learning Calibration',
    '',
    '## Operating Principles',
    '',
    '- Revenue Intelligence remains the visible daily source of truth.',
    '- Generated outputs are disposable and should be regenerated from source state.',
    '- Risky external actions require human approval.',
    '- Private data stays local-first and outside the public repository.',
    '',
  ].join('\n');
}

function renderFutureSqlitePlan(): string {
  return [
    '# Future SQLite Plan',
    '',
    'Do not migrate yet. Keep the current JSON architecture until the operating layer stabilizes.',
    '',
    '## Pros',
    '',
    '- Fewer duplicate JSON files once schemas settle.',
    '- Easier history queries for leads, outcomes, finance, and runner events.',
    '- Stronger constraints for client and outcome records.',
    '- Better backup and export story for private runtime state.',
    '',
    '## Cons',
    '',
    '- Adds operational complexity for a solo local-first workflow.',
    '- Requires migration scripts, schema versioning, and backup discipline.',
    '- Makes quick manual inspection harder than small JSON files.',
    '- Could increase maintenance before the command surface is stable.',
    '',
    '## Migration Candidates',
    '',
    '- clients',
    '- outcomes',
    '- finance',
    '- lead history',
    '- runner history',
    '',
    '## Recommendation',
    '',
    'Stay on JSON for now. Revisit SQLite after command consolidation and private runtime relocation are complete.',
    '',
  ].join('\n');
}

function renderTokenEfficiencyPlan(audit: ArchitectureAudit): string {
  return [
    '# Token Efficiency Plan',
    '',
    '## Goal',
    '',
    'Minimize future Codex usage by reducing command sprawl, duplicated outputs, and architecture ambiguity.',
    '',
    '## Recommendations',
    '',
    '- Collapse daily work into `studio:daily` once stable.',
    '- Keep command inventory current so Codex does not inspect every generator.',
    '- Prefer stable interfaces for Revenue Intelligence, dashboard data, mobile summary, and architecture reports.',
    '- Keep generated output under `output/` and avoid reading it unless a task is report-specific.',
    '- Keep runtime source-of-truth paths documented in one report.',
    '- Split large modules only when a clear boundary exists.',
    '- Archive stale generated reports to reduce search noise.',
    '',
    '## Current Indicators',
    '',
    `- Commands audited: ${audit.commandInventory.totalCommands}`,
    `- Candidate deprecations: ${audit.commandInventory.candidateDeprecations.length}`,
    `- Runtime files inventoried: ${audit.runtimeInventory.totalFiles}`,
    `- Candidate archives: ${audit.runtimeInventory.candidateArchives.length}`,
    '',
  ].join('\n');
}

function renderSourceOfTruth(items: SourceOfTruthItem[]): string {
  return [
    '# Source Of Truth Report',
    '',
    '## Authorities',
    '',
    ...items.flatMap((item) => [
      `### ${item.authority}`,
      '',
      `- Source of truth: \`${item.sourcePath}\``,
      `- Derived outputs: ${item.derivedOutputs.map((output) => `\`${output}\``).join(', ')}`,
      `- Cache paths: ${item.cachePaths.map((cachePath) => `\`${cachePath}\``).join(', ')}`,
      `- Manual edit policy: ${item.manualEditPolicy}`,
      '',
    ]),
  ].join('\n');
}

function readPackageScripts(): Record<string, string> {
  const packagePath = path.join(process.cwd(), 'package.json');
  const parsed = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };
  return parsed.scripts ?? {};
}

function listRuntimeFiles(root: RuntimeInventoryItem['root']): string[] {
  const absoluteRoot = path.join(process.cwd(), root);
  if (!fs.existsSync(absoluteRoot)) return [];
  return walk(absoluteRoot);
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function groupCommands(commands: StudioCommand[], keyFor: (command: StudioCommand) => string, reason: string): CommandGroup[] {
  const groups = new Map<string, StudioCommand[]>();
  for (const command of commands) {
    const key = keyFor(command);
    groups.set(key, [...(groups.get(key) ?? []), command]);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({ key, commands: group, reason }))
    .sort((left, right) => right.commands.length - left.commands.length || left.key.localeCompare(right.key));
}

function groupRuntimeFiles(files: RuntimeInventoryItem[], keyFor: (file: RuntimeInventoryItem) => string): CommandGroup[] {
  const groups = new Map<string, RuntimeInventoryItem[]>();
  for (const file of files) {
    const key = keyFor(file);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), file]);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([key, group]) => ({
      key,
      reason: 'Files share the same basename and may represent duplicated runtime/generated state.',
      commands: group.map((file) => ({
        name: file.path,
        script: `${file.classification}, ${file.sizeBytes} bytes`,
        domain: file.root,
        status: 'supporting' as const,
        reasons: file.notes,
      })),
    }))
    .sort((left, right) => right.commands.length - left.commands.length || left.key.localeCompare(right.key));
}

function commandOverlapKey(command: StudioCommand): string {
  const scriptTarget = command.script.split(/\s+/).find((part) => part.startsWith('src/') || part.startsWith('apps/') || part.startsWith('sales-marketing-engine/'));
  if (!scriptTarget) return command.domain;
  const normalized = scriptTarget.replace(/^src\//, '').replace(/^apps\//, '').split('/')[0] ?? command.domain;
  return `${command.domain}:${normalized}`;
}

function duplicateRuntimeKey(file: RuntimeInventoryItem): string {
  const basename = path.basename(file.path).replace(/^(generate|run)-?/, '');
  if (basename === '.gitkeep') return '';
  return basename;
}

function isRevenueIntelligenceRelevant(name: string): boolean {
  return [
    'revenue',
    'lead',
    'audit',
    'evidence',
    'outcome',
    'learning',
    'adaptive',
    'dashboard',
    'mobile',
    'client',
    'finance',
    'followup',
    'message',
    'studio',
    'security',
    'architecture',
  ].some((prefix) => name.startsWith(prefix) || name.includes(prefix));
}

function buildRisks(commandInventory: CommandInventory, runtimeInventory: RuntimeInventory): string[] {
  const risks = [
    commandInventory.totalCommands > 80 ? `Command sprawl: ${commandInventory.totalCommands} npm scripts exist.` : '',
    commandInventory.duplicateCommandGroups.length > 0 ? `${commandInventory.duplicateCommandGroups.length} duplicate command groups found.` : '',
    commandInventory.legacyCommands.length > 0 ? `${commandInventory.legacyCommands.length} legacy commands need compatibility review.` : '',
    runtimeInventory.duplicateDataCandidates.length > 0 ? `${runtimeInventory.duplicateDataCandidates.length} duplicate runtime data candidates found.` : '',
    runtimeInventory.candidateArchives.length > 0 ? `${runtimeInventory.candidateArchives.length} generated files are archive candidates.` : '',
  ].filter(Boolean);

  return risks.length > 0 ? risks : ['No major architecture risks detected by current rules.'];
}

function renderCommands(commands: StudioCommand[]): string[] {
  if (commands.length === 0) return ['- None.'];
  return commands.map((command) => `- \`${command.name}\`: ${command.reasons.join(' ')}`);
}

function renderGroups(groups: CommandGroup[]): string[] {
  if (groups.length === 0) return ['- None.'];
  return groups.flatMap((group) => [
    `- ${group.key}: ${group.commands.map((command) => `\`${command.name}\``).join(', ')} (${group.reason})`,
  ]);
}

function renderRuntimeFiles(files: RuntimeInventoryItem[]): string[] {
  if (files.length === 0) return ['- None.'];
  return files.map((file) => `- \`${file.path}\` (${file.classification}, ${file.staleDays} days old)`);
}

function bullets(items: string[]): string[] {
  if (items.length === 0) return ['- None.'];
  return items.map((item) => `- ${item}`);
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join('/');
}
