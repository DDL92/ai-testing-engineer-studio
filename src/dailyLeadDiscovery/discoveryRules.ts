import fs = require('fs');
import path = require('path');
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { DiscoverySeedCompany, DiscoveredLeadCandidate, LeadDiscoveryEngineRun } from '../discovery/types';
import { createBaseLeadId } from '../leads/leadId';
import { scoreLead } from '../leads/leadScorer';
import { Lead, RecommendedOffer } from '../leads/types';
import {
  DailyDiscoveredLead,
  DailyDiscoverySource,
  DailyDiscoveryState,
  DailyDiscoveryStore,
  DailyLeadDiscoveryDashboard,
  DailyLeadDiscoveryReport,
} from './types';

const dataRoot = path.join(process.cwd(), 'data', 'lead-discovery');
const outputRoot = path.join(process.cwd(), 'output', 'lead-discovery');
const statePath = path.join(dataRoot, 'daily-discovery-state.json');
const sourcesPath = path.join(dataRoot, 'discovery-sources.json');
const discoveredPath = path.join(dataRoot, 'discovered-leads.json');

const safetyRules = [
  'Local-first lead discovery only.',
  'No LinkedIn scraping.',
  'No login scraping.',
  'No paid APIs.',
  'No aggressive crawling.',
  'No outreach, emails, CRM updates, meetings, invoices, payments, or external actions are performed.',
  'No outcomes, replies, clients, meetings, proposals, wins, losses, revenue, or client interest are invented.',
  'Human approval is required before promoting, contacting, auditing, proposing, or sending anything.',
];

export function buildDailyLeadDiscoveryReport(): DailyLeadDiscoveryReport {
  ensureDailyDiscoveryData();

  const generatedAt = new Date().toISOString();
  const runDate = generatedAt.slice(0, 10);
  const sources = loadSources().filter((source) => source.enabled && source.approvedForDailyRun);
  const previousStore = loadDiscoveredStore();
  const knownCompanies = knownCompanyKeys();
  const leads = sources
    .flatMap((source) => loadCandidatesFromSource(source, generatedAt, runDate, previousStore, knownCompanies))
    .filter((lead, index, items) => items.findIndex((candidate) => candidate.id === lead.id) === index)
    .sort(sortLeads);
  const newLeadsToday = leads.filter((lead) => lead.isNewToday && !lead.alreadyKnown);
  const topFive = leads.slice(0, 5);
  const topNewLead = newLeadsToday[0];
  const bestActionLead = topNewLead ?? topFive[0];

  return {
    generatedAt,
    runDate,
    sources,
    leads,
    newLeadsToday,
    topFive,
    topNewLead,
    bestOffer: bestActionLead ? offerLabel(bestActionLead.recommendedOffer) : 'No new offer candidate found',
    recommendedNextAction: topNewLead
      ? topNewLead.recommendedAction
      : bestActionLead
        ? `No new approved-source leads found. Top known candidate is ${bestActionLead.companyName}; keep the current Studio workflow and add more approved local sources if Daniel wants fresh candidates.`
      : 'No new local candidates found. Review discovery sources before expanding manually.',
    safetyRules,
  };
}

export function writeDailyDiscoveryOutputs(report: DailyLeadDiscoveryReport): string[] {
  saveState(report.generatedAt, report.runDate);
  saveDiscoveredStore(report);
  return writeOutputs([
    { fileName: 'daily-leads.md', body: renderDailyLeads(report) },
  ]);
}

export function writeDailyRankingOutputs(report: DailyLeadDiscoveryReport): string[] {
  return writeOutputs([
    { fileName: 'lead-ranking.md', body: renderLeadRanking(report) },
    { fileName: 'top-5-today.md', body: renderTopFiveToday(report) },
  ]);
}

export function writeDailySummaryOutputs(report: DailyLeadDiscoveryReport): string[] {
  return writeOutputs([
    { fileName: 'discovery-summary.md', body: renderDiscoverySummary(report) },
    { fileName: 'recommended-actions.md', body: renderRecommendedActions(report) },
  ]);
}

export function writeMacLeadDiscoverySetup(report = buildDailyLeadDiscoveryReport()): string[] {
  return writeOutputs([
    { fileName: 'mac-setup.md', body: renderMacSetup(report) },
  ]);
}

export function buildDailyLeadDiscoveryDashboard(): DailyLeadDiscoveryDashboard {
  const report = buildDailyLeadDiscoveryReport();

  return {
    newLeadsToday: report.newLeadsToday.length,
    topNewLead: report.topNewLead?.companyName ?? 'No new leads found',
    topFiveLeads: report.topFive.length > 0
      ? report.topFive.map((lead) => lead.companyName).join(', ')
      : 'No new leads found',
    bestOffer: report.bestOffer,
    recommendedNextAction: report.recommendedNextAction,
  };
}

export function renderDailyLeads(report: DailyLeadDiscoveryReport): string {
  return [
    '# Daily Leads',
    '',
    `Generated: ${report.generatedAt}`,
    `Run Date: ${report.runDate}`,
    '',
    '## Discovery Boundary',
    renderList([
      'Only approved local source files were reviewed.',
      'No websites were fetched.',
      'No lead was contacted or promoted automatically.',
    ]),
    '',
    '## New Leads Today',
    report.newLeadsToday.length > 0 ? renderLeadTable(report.newLeadsToday) : 'No new leads found today from approved local sources.',
    '',
    '## All Local Candidates',
    report.leads.length > 0 ? renderLeadTable(report.leads) : 'No candidates found.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderTopFiveToday(report: DailyLeadDiscoveryReport): string {
  return [
    '# Top 5 Today',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length > 0 ? renderLeadTable(report.topFive) : 'No new local candidates available for today.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderLeadRanking(report: DailyLeadDiscoveryReport): string {
  return [
    '# Daily Lead Ranking',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Lead | Score | New Today | Already Known | Recommended Offer | Reason |',
    '| ---: | --- | ---: | --- | --- | --- | --- |',
    ...report.leads.map((lead, index) => `| ${index + 1} | ${escapeTable(lead.companyName)} | ${lead.score}/10 | ${yesNo(lead.isNewToday)} | ${yesNo(lead.alreadyKnown)} | ${escapeTable(offerLabel(lead.recommendedOffer))} | ${escapeTable(lead.scoreReasons.join('; ') || 'Local metadata match')} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRecommendedActions(report: DailyLeadDiscoveryReport): string {
  const actions = report.topFive.map((lead, index) => `Priority #${index + 1}: ${lead.recommendedAction}`);

  return [
    '# Recommended Actions',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    actions.length > 0 ? renderList(actions) : '- No new local candidates require action today.',
    '',
    '## Approval Gate',
    renderList([
      'Daniel must manually approve any promotion into active leads.',
      'Daniel must manually approve any audit, proposal, outreach, email, LinkedIn message, meeting, invoice, payment, or client communication.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDiscoverySummary(report: DailyLeadDiscoveryReport): string {
  return [
    '# Discovery Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Approved local sources checked: ${report.sources.length}`,
      `Total candidates in local discovery store: ${report.leads.length}`,
      `New leads today: ${report.newLeadsToday.length}`,
      `Top new lead: ${report.topNewLead?.companyName ?? 'None'}`,
      `Best offer: ${report.bestOffer}`,
      `Recommended next action: ${report.recommendedNextAction}`,
    ]),
    '',
    '## Source Status',
    renderSourceTable(report.sources),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderMacSetup(report: DailyLeadDiscoveryReport): string {
  const repoPath = process.cwd();
  const plistPath = `${process.env.HOME ?? '$HOME'}/Library/LaunchAgents/com.ai-testing-engineer-studio.lead-discovery.plist`;
  const logPath = path.join(repoPath, 'output', 'lead-discovery', 'daily-launchd.log');

  return [
    '# Mac Lead Discovery Setup',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'This guide sets up a local Mac launchd job for 7:00 AM. It does not install anything automatically.',
    '',
    '## Daily Commands',
    renderList([
      'npm run lead:daily-discovery',
      'npm run lead:daily-ranking',
      'npm run lead:daily-summary',
      'npm run dashboard:generate',
    ]),
    '',
    '## LaunchAgent Plist',
    '',
    `Save this plist at \`${plistPath}\`:`,
    '',
    '```xml',
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>Label</key>',
    '  <string>com.ai-testing-engineer-studio.lead-discovery</string>',
    '  <key>ProgramArguments</key>',
    '  <array>',
    '    <string>/bin/zsh</string>',
    '    <string>-lc</string>',
    `    <string>cd ${escapeXml(repoPath)} &amp;&amp; npm run lead:daily-discovery &amp;&amp; npm run lead:daily-ranking &amp;&amp; npm run lead:daily-summary &amp;&amp; npm run dashboard:generate</string>`,
    '  </array>',
    '  <key>StartCalendarInterval</key>',
    '  <dict>',
    '    <key>Hour</key>',
    '    <integer>7</integer>',
    '    <key>Minute</key>',
    '    <integer>0</integer>',
    '  </dict>',
    '  <key>StandardOutPath</key>',
    `  <string>${escapeXml(logPath)}</string>`,
    '  <key>StandardErrorPath</key>',
    `  <string>${escapeXml(logPath)}</string>`,
    '</dict>',
    '</plist>',
    '```',
    '',
    '## Manual Load Commands',
    '',
    '```bash',
    `launchctl unload ${plistPath} 2>/dev/null || true`,
    `launchctl load ${plistPath}`,
    `launchctl start com.ai-testing-engineer-studio.lead-discovery`,
    '```',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function ensureDailyDiscoveryData(): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, `${JSON.stringify(defaultState(), null, 2)}\n`, 'utf8');
  }
  if (!fs.existsSync(sourcesPath)) {
    fs.writeFileSync(sourcesPath, `${JSON.stringify(defaultSources(), null, 2)}\n`, 'utf8');
  }
  if (!fs.existsSync(discoveredPath)) {
    fs.writeFileSync(discoveredPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), leads: [], safetyRules }, null, 2)}\n`, 'utf8');
  }
}

function defaultState(): DailyDiscoveryState {
  return {
    schemaVersion: 1,
    lastRunAt: null,
    lastRunDate: null,
    schedule: {
      localTime: '07:00',
      timezone: 'Mac local time',
    },
    notes: [
      'Daily discovery checks approved local source files only.',
      'The Mac launchd setup guide is generated locally; nothing is installed automatically.',
    ],
    safetyRules,
  };
}

function defaultSources(): DailyDiscoverySource[] {
  return [
    {
      id: 'local-seed-catalog',
      name: 'Local Discovery Seed Catalog',
      type: 'local_seed_catalog',
      enabled: true,
      path: 'data/leads/discovery-seeds.json',
      description: 'Curated local candidate catalog maintained by Daniel or prior approved Studio runs.',
      allowNetwork: false,
      requiresLogin: false,
      approvedForDailyRun: true,
    },
    {
      id: 'existing-discovered-leads',
      name: 'Existing Local Discovered Leads',
      type: 'local_discovered_leads',
      enabled: true,
      path: 'data/leads/discovered-leads.json',
      description: 'Prior local discovery engine output; used only as local review memory.',
      allowNetwork: false,
      requiresLogin: false,
      approvedForDailyRun: true,
    },
  ];
}

function loadSources(): DailyDiscoverySource[] {
  return readJson<DailyDiscoverySource[]>(sourcesPath, defaultSources());
}

function loadDiscoveredStore(): DailyDiscoveryStore {
  return readJson<DailyDiscoveryStore>(discoveredPath, {
    generatedAt: new Date().toISOString(),
    leads: [],
    safetyRules,
  });
}

function loadCandidatesFromSource(
  source: DailyDiscoverySource,
  generatedAt: string,
  runDate: string,
  previousStore: DailyDiscoveryStore,
  knownCompanies: Set<string>,
): DailyDiscoveredLead[] {
  const sourcePath = path.join(process.cwd(), source.path);
  if (!fs.existsSync(sourcePath)) return [];
  if (source.allowNetwork || source.requiresLogin) return [];

  if (source.type === 'local_seed_catalog') {
    const seeds = readJson<DiscoverySeedCompany[]>(sourcePath, []);
    return seeds.flatMap((seed) => seedToLead(seed, source, generatedAt, runDate, previousStore, knownCompanies));
  }

  const run = readJson<LeadDiscoveryEngineRun>(sourcePath, {
    generatedAt,
    niche: 'local',
    source: 'local',
    candidates: [],
    safetyRules,
    nextCommands: [],
  });
  return (run.candidates ?? []).flatMap((candidate) => candidateToLead(candidate, source, generatedAt, runDate, previousStore, knownCompanies));
}

function seedToLead(
  seed: DiscoverySeedCompany,
  source: DailyDiscoverySource,
  generatedAt: string,
  runDate: string,
  previousStore: DailyDiscoveryStore,
  knownCompanies: Set<string>,
): DailyDiscoveredLead[] {
  if (isDemoWebsite(seed.website)) return [];
  const score = scoreLead({
    companyName: seed.companyName,
    website: seed.website,
    industry: seed.industry,
    source: source.name,
    fitNotes: seed.fitNotes,
    painPoints: seed.painPoints,
    recommendedOffer: normalizeOffer(seed.suggestedOffer),
  });
  return [buildLead({
    id: createBaseLeadId(seed.companyName),
    companyName: seed.companyName,
    website: seed.website,
    industry: seed.industry,
    source,
    generatedAt,
    runDate,
    previousStore,
    knownCompanies,
    score: score.score,
    recommendedOffer: score.recommendedOffer,
    fitNotes: seed.fitNotes,
    painPoints: seed.painPoints,
    scoreReasons: score.reasons,
  })];
}

function candidateToLead(
  candidate: DiscoveredLeadCandidate,
  source: DailyDiscoverySource,
  generatedAt: string,
  runDate: string,
  previousStore: DailyDiscoveryStore,
  knownCompanies: Set<string>,
): DailyDiscoveredLead[] {
  if (isDemoWebsite(candidate.website)) return [];
  return [buildLead({
    id: candidate.id || createBaseLeadId(candidate.companyName),
    companyName: candidate.companyName,
    website: candidate.website,
    industry: candidate.industry,
    source,
    generatedAt,
    runDate,
    previousStore,
    knownCompanies,
    score: candidate.score,
    recommendedOffer: normalizeOffer(candidate.recommendedOffer),
    fitNotes: candidate.fitNotes,
    painPoints: candidate.painPoints,
    scoreReasons: candidate.scoreReasons,
  })];
}

function buildLead(input: {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  source: DailyDiscoverySource;
  generatedAt: string;
  runDate: string;
  previousStore: DailyDiscoveryStore;
  knownCompanies: Set<string>;
  score: number;
  recommendedOffer: RecommendedOffer;
  fitNotes: string;
  painPoints: string[];
  scoreReasons: string[];
}): DailyDiscoveredLead {
  const previous = input.previousStore.leads.find((lead) => lead.id === input.id || sameCompany(lead.companyName, input.companyName));
  const firstSeenAt = previous?.firstSeenAt ?? input.generatedAt;
  const discoveredDate = firstSeenAt.slice(0, 10);
  const alreadyKnown = input.knownCompanies.has(companyKey(input.companyName)) || input.knownCompanies.has(input.id);
  const isNewToday = discoveredDate === input.runDate && !alreadyKnown;

  return {
    id: input.id,
    companyName: input.companyName,
    website: input.website,
    industry: input.industry,
    sourceId: input.source.id,
    sourceName: input.source.name,
    sourcePath: input.source.path,
    discoveredAt: previous?.discoveredAt ?? input.generatedAt,
    firstSeenAt,
    lastSeenAt: input.generatedAt,
    isNewToday,
    alreadyKnown,
    score: input.score,
    recommendedOffer: input.recommendedOffer,
    fitNotes: input.fitNotes,
    painPoints: input.painPoints,
    scoreReasons: input.scoreReasons,
    recommendedAction: alreadyKnown
      ? `Already known in Studio. Keep current workflow; do not duplicate ${input.companyName}.`
      : `Manual review ${input.companyName}; if Daniel approves, promote to active lead and generate a lead pack before any outreach.`,
    warnings: [
      ...(alreadyKnown ? ['Already known in current Studio data.'] : []),
      'Review-only candidate. No outreach has been generated or sent.',
    ],
  };
}

function knownCompanyKeys(): Set<string> {
  const keys = new Set<string>();
  for (const lead of readJson<Lead[]>(path.join(process.cwd(), 'data', 'leads', 'leads.json'), [])) {
    keys.add(companyKey(lead.companyName));
    keys.add(String(lead.id ?? '').toLowerCase());
  }
  for (const lead of readJson<Lead[]>(path.join(process.cwd(), 'data', 'leads.json'), [])) {
    keys.add(companyKey(lead.companyName));
    keys.add(String(lead.id ?? '').toLowerCase());
  }
  for (const item of buildRevenueActivationReport().pipeline) {
    keys.add(companyKey(item.companyName));
    keys.add(item.companyId.toLowerCase());
    if (item.companyId === 'glofox') keys.add(companyKey('ABC Glofox'));
  }
  return keys;
}

function saveState(generatedAt: string, runDate: string): void {
  const state = readJson<DailyDiscoveryState>(statePath, defaultState());
  fs.writeFileSync(statePath, `${JSON.stringify({ ...state, lastRunAt: generatedAt, lastRunDate: runDate }, null, 2)}\n`, 'utf8');
}

function saveDiscoveredStore(report: DailyLeadDiscoveryReport): void {
  fs.writeFileSync(discoveredPath, `${JSON.stringify({ generatedAt: report.generatedAt, leads: report.leads, safetyRules }, null, 2)}\n`, 'utf8');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  return outputs.map((output) => {
    const outputPath = path.join(outputRoot, output.fileName);
    fs.writeFileSync(outputPath, output.body, 'utf8');
    return outputPath;
  });
}

function sortLeads(left: DailyDiscoveredLead, right: DailyDiscoveredLead): number {
  if (left.alreadyKnown !== right.alreadyKnown) return left.alreadyKnown ? 1 : -1;
  return right.score - left.score || left.companyName.localeCompare(right.companyName);
}

function renderLeadTable(leads: DailyDiscoveredLead[]): string {
  return [
    '| Lead | Score | Offer | New Today | Known | Source | Next Action |',
    '| --- | ---: | --- | --- | --- | --- | --- |',
    ...leads.map((lead) => `| ${escapeTable(lead.companyName)} | ${lead.score}/10 | ${escapeTable(offerLabel(lead.recommendedOffer))} | ${yesNo(lead.isNewToday)} | ${yesNo(lead.alreadyKnown)} | ${escapeTable(lead.sourceName)} | ${escapeTable(lead.recommendedAction)} |`),
  ].join('\n');
}

function renderSourceTable(sources: DailyDiscoverySource[]): string {
  if (sources.length === 0) return 'No approved local sources configured.';
  return [
    '| Source | Type | Path | Network | Login |',
    '| --- | --- | --- | --- | --- |',
    ...sources.map((source) => `| ${escapeTable(source.name)} | ${source.type} | ${escapeTable(source.path)} | ${source.allowNetwork ? 'Yes' : 'No'} | ${source.requiresLogin ? 'Yes' : 'No'} |`),
  ].join('\n');
}

function normalizeOffer(value: string): RecommendedOffer {
  const normalized = value.toLowerCase();
  if (normalized.includes('starter')) return 'playwright-starter-pack';
  if (normalized.includes('agency')) return 'agency-partner-retainer';
  if (normalized.includes('retainer')) return 'qa-automation-retainer';
  if (normalized.includes('audit')) return 'qa-audit';
  return 'not-fit';
}

function offerLabel(offer: RecommendedOffer): string {
  const labels: Record<RecommendedOffer, string> = {
    'qa-audit': 'QA Audit ($199-$500)',
    'playwright-starter-pack': 'Playwright Starter Pack ($900-$1500)',
    'qa-automation-retainer': 'QA Automation Retainer ($1500-$3000/month)',
    'agency-partner-retainer': 'Agency Partner Retainer ($1500-$3000/month)',
    'not-fit': 'Not Fit',
  };
  return labels[offer];
}

function sameCompany(left: string, right: string): boolean {
  return companyKey(left) === companyKey(right);
}

function companyKey(value: string): string {
  return value.toLowerCase().replace(/^abc\s+/, '').replace(/[^a-z0-9]+/g, '');
}

function isDemoWebsite(website: string): boolean {
  return website.includes('.example') || website.trim() === '';
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None';
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}
