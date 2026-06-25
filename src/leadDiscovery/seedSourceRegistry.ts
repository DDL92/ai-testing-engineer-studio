import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { SeedSource } from './seedSourceTypes';

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const seedSourcesDir = path.join(process.cwd(), 'data', 'lead-discovery', 'seed-sources');

export function readActiveLeadDiscoveryClients(): LeadDiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => !fileName.endsWith('.sample.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as LeadDiscoveryClientConfig)
    .filter((client) => client.status === 'active')
    .sort(compareClientPriority);
}

export function readSeedSources(): SeedSource[] {
  if (!fs.existsSync(seedSourcesDir)) return [];
  return fs.readdirSync(seedSourcesDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .flatMap((fileName) => JSON.parse(fs.readFileSync(path.join(seedSourcesDir, fileName), 'utf8')) as SeedSource[]);
}

export function activeAutomationSeedSources(clients = readActiveLeadDiscoveryClients(), sources = readSeedSources()): SeedSource[] {
  const activeClientIds = new Set(clients.map((client) => client.clientId));
  return sources
    .filter((source) => activeClientIds.has(source.clientId))
    .filter((source) => source.enabled && !source.requiresLogin && source.allowedForAutomation)
    .sort(compareSeedSourcePriority);
}

export function compareClientPriority(left: LeadDiscoveryClientConfig, right: LeadDiscoveryClientConfig): number {
  const priority = ['flora_and_fauna_foods_001', 'lzt_costa_rica_001', 'costa_retreats_001'];
  const leftRank = priority.indexOf(left.clientId);
  const rightRank = priority.indexOf(right.clientId);
  if (leftRank !== -1 || rightRank !== -1) {
    return (leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank)
      - (rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank);
  }
  return left.clientName.localeCompare(right.clientName);
}

export function compareSeedSourcePriority(left: SeedSource, right: SeedSource): number {
  const clientCompare = clientPriorityRank(left.clientId) - clientPriorityRank(right.clientId);
  if (clientCompare !== 0) return clientCompare;
  const priorityCompare = priorityRank(left.priority) - priorityRank(right.priority);
  if (priorityCompare !== 0) return priorityCompare;
  const qualityCompare = qualityRank(left.expectedLeadQuality) - qualityRank(right.expectedLeadQuality);
  if (qualityCompare !== 0) return qualityCompare;
  return left.sourceId.localeCompare(right.sourceId);
}

function clientPriorityRank(clientId: string): number {
  const priority = ['flora_and_fauna_foods_001', 'lzt_costa_rica_001', 'costa_retreats_001'];
  const rank = priority.indexOf(clientId);
  return rank === -1 ? Number.MAX_SAFE_INTEGER : rank;
}

function priorityRank(priority: SeedSource['priority']): number {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  return 2;
}

function qualityRank(quality: SeedSource['expectedLeadQuality']): number {
  if (quality === 'high') return 0;
  if (quality === 'medium') return 1;
  return 2;
}
