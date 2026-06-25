import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { activeAutomationSeedSources, readActiveLeadDiscoveryClients, readSeedSources } from './seedSourceRegistry';
import { SeedSource } from './seedSourceTypes';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'targeted-discovery');
const targetedPlanPath = path.join(outputDir, 'targeted-plan.md');
const registrySummaryPath = path.join(outputDir, 'source-registry-summary.md');
const clientSourceCsvPath = path.join(outputDir, 'client-source-summary.csv');

export function generateTargetedDiscoveryPlan(now = new Date()): { filesGenerated: string[]; totalSources: number; enabledSources: number } {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const sources = readSeedSources();
  const activeSources = activeAutomationSeedSources(clients, sources);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(targetedPlanPath, renderTargetedPlan(generatedAt, clients, sources, activeSources), 'utf8');
  fs.writeFileSync(registrySummaryPath, renderRegistrySummary(generatedAt, clients, sources, activeSources), 'utf8');
  fs.writeFileSync(clientSourceCsvPath, renderClientSourceCsv(clients, sources, activeSources), 'utf8');

  return {
    filesGenerated: [targetedPlanPath, registrySummaryPath, clientSourceCsvPath].map((file) => path.relative(process.cwd(), file)),
    totalSources: sources.length,
    enabledSources: activeSources.length,
  };
}

function renderTargetedPlan(generatedAt: string, clients: LeadDiscoveryClientConfig[], sources: SeedSource[], activeSources: SeedSource[]): string {
  return `# Targeted Discovery Plan

Generated: ${generatedAt}

## Operating Principle

The system prioritizes source-specific discovery from public, indexed communities and request boards that are more likely to produce buyer intent. Broad web search remains a fallback, not the primary sourcing strategy.

## Metrics

- Total sources: ${sources.length}
- Enabled automation sources for active clients: ${activeSources.length}
- High priority sources: ${activeSources.filter((source) => source.priority === 'high').length}
- Requires login sources active: ${activeSources.filter((source) => source.requiresLogin).length}
- Disallowed automation sources active: ${activeSources.filter((source) => !source.allowedForAutomation).length}

## Source Distribution

${renderDistribution(activeSources.map((source) => source.sourceCategory))}

## Expected Quality Distribution

${renderDistribution(activeSources.map((source) => source.expectedLeadQuality))}

## Source Categories By Client

${clients.map((client) => renderClientSummary(client, activeSources)).join('\n\n') || '- No active clients.'}

## Safety Boundary

- Public indexed sources only.
- No login, scraping, page crawling, profile harvesting, contact extraction, outreach, emails, DMs, calls, or form submissions.
- Human review is required before delivery or contact.
`;
}

function renderRegistrySummary(generatedAt: string, clients: LeadDiscoveryClientConfig[], sources: SeedSource[], activeSources: SeedSource[]): string {
  const activeClientIds = new Set(clients.map((client) => client.clientId));
  return `# Source Registry Summary

Generated: ${generatedAt}

## Registry Totals

- Total registry sources: ${sources.length}
- Sources for active clients: ${sources.filter((source) => activeClientIds.has(source.clientId)).length}
- Active automation sources: ${activeSources.length}
- Disabled sources: ${sources.filter((source) => !source.enabled).length}
- LZT active sources: ${activeSources.filter((source) => source.clientId === 'lzt_costa_rica_001').length}

## All Sources

${sources.map((source, index) => `${index + 1}. ${source.sourceId} | ${source.clientId}
   - Category: ${source.sourceCategory}; region: ${source.region}; priority: ${source.priority}; expected quality: ${source.expectedLeadQuality}
   - Enabled: ${source.enabled}; requires login: ${source.requiresLogin}; automation allowed: ${source.allowedForAutomation}
   - URL pattern: ${source.sourceUrlPattern || 'none'}
   - Notes: ${source.notes}`).join('\n') || '- No sources registered.'}
`;
}

function renderClientSummary(client: LeadDiscoveryClientConfig, sources: SeedSource[]): string {
  const clientSources = sources.filter((source) => source.clientId === client.clientId);
  return `### ${client.clientName}

- Client ID: ${client.clientId}
- Source count: ${clientSources.length}
- High priority: ${clientSources.filter((source) => source.priority === 'high').length}
- Expected high quality: ${clientSources.filter((source) => source.expectedLeadQuality === 'high').length}
- Categories: ${inlineDistribution(clientSources.map((source) => source.sourceCategory))}`;
}

function renderClientSourceCsv(clients: LeadDiscoveryClientConfig[], sources: SeedSource[], activeSources: SeedSource[]): string {
  const activeIds = new Set(activeSources.map((source) => source.sourceId));
  const headers = ['client_id', 'client_name', 'source_id', 'source_name', 'source_category', 'region', 'priority', 'enabled_for_automation', 'expected_lead_quality', 'requires_login', 'allowed_for_automation', 'source_url_pattern'];
  const rows = clients.flatMap((client) => sources
    .filter((source) => source.clientId === client.clientId)
    .map((source) => [
      client.clientId,
      client.clientName,
      source.sourceId,
      source.sourceName,
      source.sourceCategory,
      source.region,
      source.priority,
      String(activeIds.has(source.sourceId)),
      source.expectedLeadQuality,
      String(source.requiresLogin),
      String(source.allowedForAutomation),
      source.sourceUrlPattern,
    ]));
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderDistribution(values: string[]): string {
  const rows = distributionRows(values);
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function inlineDistribution(values: string[]): string {
  return distributionRows(values).map(([value, count]) => `${value}:${count}`).join('; ') || 'none';
}

function distributionRows(values: string[]): Array<[string, number]> {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value || 'unknown'] = (counts[value || 'unknown'] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const result = generateTargetedDiscoveryPlan();
    console.log(`Targeted discovery plan generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Sources: ${result.totalSources}; enabled automation sources: ${result.enabledSources}`);
    console.log('Planning only. No scraping, browser automation, contact extraction, outreach, emails, DMs, calls, or login flows were performed.');
  } catch (error) {
    console.error('Targeted Discovery Plan: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
