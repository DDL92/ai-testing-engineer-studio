import fs = require('fs');
import path = require('path');
import {
  buildLeadDiscoveryEngineRun,
  buildLeadDiscoveryReport,
  renderLeadDiscoveryEngineRun,
  writeLeadDiscoveryEngineRun,
} from './discoveryRules';
import { DiscoveryIcp, DiscoverySource, HighProbabilityTarget, LeadDiscoveryReport } from './types';

const outputPath = path.join(process.cwd(), 'output', 'discovery', 'lead-discovery-report.md');
const engineOutputDir = path.join(process.cwd(), 'output', 'leads');

function main(): void {
  const args = process.argv.slice(2);
  const niche = parseValue(args, '--niche') ?? parseValue(args, '--industry') ?? args.find((arg) => !arg.startsWith('--')) ?? 'gym management SaaS';
  const limitValue = parseValue(args, '--limit');
  const limit = limitValue ? Number(limitValue) : 10;
  const report = buildLeadDiscoveryReport();
  const engineRun = buildLeadDiscoveryEngineRun(niche, Number.isFinite(limit) ? limit : 10);
  const dataPath = writeLeadDiscoveryEngineRun(engineRun);
  const engineOutputPath = path.join(engineOutputDir, `lead-discovery-${slugify(niche)}.md`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(engineOutputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderReport(report), 'utf8');
  fs.writeFileSync(engineOutputPath, renderLeadDiscoveryEngineRun(engineRun), 'utf8');

  console.log(`Lead discovery engine report generated: ${path.relative(process.cwd(), engineOutputPath)}`);
  console.log(`Discovered candidates saved: ${path.relative(process.cwd(), dataPath)}`);
  console.log(`Lead discovery assistant generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Niche: ${engineRun.niche}`);
  console.log(`Candidates: ${engineRun.candidates.length}`);
  console.log(`Recommended ICPs: ${report.recommendedIcps.length}`);
  console.log(`Search queries: ${report.searchQueries.length}`);
  console.log('Local seed catalog only. No scraping, APIs, browser automation, LinkedIn automation, CRM, paid services, or outreach sending were used.');
  console.log('Human approval is required before promoting leads, contacting companies, running audits, or sending messages.');
}

function parseValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  const value = args.find((arg) => arg.startsWith(`${flag}=`));
  if (value) return value.slice(flag.length + 1);
  return undefined;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'niche';
}

function renderReport(report: LeadDiscoveryReport): string {
  return [
    '# Lead Discovery Assistant',
    '',
    `Date: ${report.date}`,
    '',
    '## Recommended ICPs',
    renderIcps(report.recommendedIcps),
    '',
    '## High Probability Targets',
    renderTargets(report.highProbabilityTargets),
    '',
    '## Where To Look',
    renderSources(report.whereToLook),
    '',
    '## Search Queries',
    renderList(report.searchQueries.map((query) => `\`${query}\``)),
    '',
    '## Lead Research Workflow',
    renderArrowFlow(report.leadResearchWorkflow),
    '',
    '## Daily Discovery Plan',
    renderList(report.dailyDiscoveryPlan),
    '',
    '## Weekly Discovery Goal',
    renderList(report.weeklyDiscoveryGoal),
    '',
    '## Suggested Next Commands',
    renderList(report.suggestedNextCommands.map((command) => `\`${command}\``)),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function renderIcps(icps: DiscoveryIcp[]): string {
  return icps
    .map((icp) => [
      `${icp.priority}. ${icp.name}`,
      `   - Why it fits: ${icp.whyItFits}`,
      `   - Audit angle: ${icp.auditAngle}`,
      `   - Retainer potential: ${icp.retainerPotential}`,
      `   - Difficulty level: ${icp.difficultyLevel}`,
    ].join('\n'))
    .join('\n');
}

function renderTargets(targets: HighProbabilityTarget[]): string {
  return targets
    .map((target) => `- ${target.category}: ${target.reason}`)
    .join('\n');
}

function renderSources(sources: DiscoverySource[]): string {
  return sources
    .map((source) => `- ${source.name}: ${source.useCase} Safety: ${source.safetyNote}`)
    .join('\n');
}

function renderArrowFlow(steps: string[]): string {
  return steps.join('\n↓\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

main();
