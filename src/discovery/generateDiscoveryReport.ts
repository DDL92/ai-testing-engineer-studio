import fs = require('fs');
import path = require('path');
import { buildLeadDiscoveryReport } from './discoveryRules';
import { DiscoveryIcp, DiscoverySource, HighProbabilityTarget, LeadDiscoveryReport } from './types';

const outputPath = path.join(process.cwd(), 'output', 'discovery', 'lead-discovery-report.md');

function main(): void {
  const report = buildLeadDiscoveryReport();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderReport(report), 'utf8');

  console.log(`Lead discovery report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Recommended ICPs: ${report.recommendedIcps.length}`);
  console.log(`Search queries: ${report.searchQueries.length}`);
  console.log('No companies were generated. No scraping, APIs, browser automation, or outreach were used.');
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
