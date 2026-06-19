import crypto = require('crypto');
import fs = require('fs');
import net = require('net');
import path = require('path');
import { importWebsiteCandidates, readWebsiteLeads } from './leadAdapter';
import {
  DiscoverySource,
  DiscoverySourceType,
  WebsiteCandidateInput,
  WebsiteSourceReference,
} from './types';

const SOURCE_PATH = path.join(process.cwd(), 'data', 'website-studio', 'discovery-sources.json');
const EXAMPLES_DIR = path.join(process.cwd(), 'data', 'website-studio', 'examples');
const ALLOWED_SOURCE_TYPES = new Set<DiscoverySourceType>([
  'public_directory',
  'association_members',
  'tourism_directory',
  'chamber_directory',
  'curated_list',
]);
const BLOCKED_HOSTS = [
  'google.',
  'bing.',
  'instagram.com',
  'facebook.com',
  'linkedin.com',
  'yelp.',
  'tripadvisor.',
];
const USER_AGENT = 'AI-Testing-Engineer-Studio/2.0 local-public-directory-research';
const TIMEOUT_MS = 8_000;

interface SourceResult {
  sourceId: string;
  url: string;
  status: 'checked' | 'skipped' | 'error';
  httpStatus: number | null;
  robotsStatus: string;
  entriesDetected: number;
  candidatesAccepted: number;
  skipReason: string | null;
  errorMessage: string | null;
}

export interface DiscoveryReport {
  runId: string;
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  sourcesConfigured: number;
  sourcesChecked: number;
  sourceResults: SourceResult[];
  robotsResults: Array<{ sourceId: string; status: string }>;
  pagesFetched: number;
  candidatesFound: number;
  added: number;
  updated: number;
  duplicates: number;
  invalid: number;
  skipped: number;
  errors: string[];
  importedLeadIds: string[];
  plannedLeads?: ReturnType<typeof readWebsiteLeads>;
}

export async function runDiscovery(options: {
  dryRun?: boolean;
  limit?: number;
  sourceId?: string;
  fixtureMode?: boolean;
  writeReport?: boolean;
} = {}): Promise<DiscoveryReport> {
  const startedAt = new Date().toISOString();
  const runId = startedAt.replace(/[:.]/g, '-');
  const report: DiscoveryReport = {
    runId,
    startedAt,
    completedAt: startedAt,
    dryRun: options.dryRun ?? false,
    sourcesConfigured: 0,
    sourcesChecked: 0,
    sourceResults: [],
    robotsResults: [],
    pagesFetched: 0,
    candidatesFound: 0,
    added: 0,
    updated: 0,
    duplicates: 0,
    invalid: 0,
    skipped: 0,
    errors: [],
    importedLeadIds: [],
  };
  const limit = Math.min(50, Math.max(1, options.limit ?? 20));

  let sources: DiscoverySource[];
  try {
    sources = loadSources();
    report.sourcesConfigured = sources.length;
  } catch (error) {
    report.errors.push(errorMessage(error));
    return finishReport(report, options.writeReport ?? true);
  }

  const duplicateIds = new Set<string>();
  sources = sources.filter((source) => {
    if (duplicateIds.has(source.id)) {
      report.errors.push(`Duplicate source ID: ${source.id}`);
      return false;
    }
    duplicateIds.add(source.id);
    return !options.sourceId || source.id === options.sourceId;
  });

  const discovered: WebsiteCandidateInput[] = [];
  for (const source of sources) {
    if (discovered.length >= limit) break;
    const sourceResult = emptySourceResult(source);
    report.sourceResults.push(sourceResult);

    const fixtureAllowed = Boolean(options.fixtureMode && source.fixture);
    if (!source.enabled && !fixtureAllowed) {
      sourceResult.status = 'skipped';
      sourceResult.skipReason = 'Source is disabled';
      report.skipped += 1;
      continue;
    }

    const validationError = validateSource(source, fixtureAllowed);
    if (validationError) {
      sourceResult.status = 'skipped';
      sourceResult.skipReason = validationError;
      report.skipped += 1;
      continue;
    }

    report.sourcesChecked += 1;
    try {
      let html: string;
      if (fixtureAllowed) {
        html = fs.readFileSync(resolveFixturePath(source.url), 'utf8');
        sourceResult.robotsStatus = 'not-applicable-local-fixture';
        report.robotsResults.push({ sourceId: source.id, status: sourceResult.robotsStatus });
      } else {
        const robots = await checkRobots(source);
        sourceResult.robotsStatus = robots.status;
        report.robotsResults.push({ sourceId: source.id, status: robots.status });
        if (!robots.allowed) {
          sourceResult.status = 'skipped';
          sourceResult.skipReason = 'robots.txt disallows configured path';
          report.skipped += 1;
          continue;
        }
        const fetched = await fetchText(source.url);
        sourceResult.httpStatus = fetched.status;
        if (fetched.status === 403 || fetched.status === 429) {
          sourceResult.status = 'skipped';
          sourceResult.skipReason = `Access stopped safely at HTTP ${fetched.status}`;
          report.skipped += 1;
          continue;
        }
        if (fetched.status >= 400) throw new Error(`HTTP ${fetched.status}`);
        html = fetched.body;
      }

      report.pagesFetched += 1;
      const extracted = extractCandidates(html, source);
      sourceResult.entriesDetected = extracted.length;
      for (const candidate of extracted) {
        if (discovered.length >= limit) break;
        const duplicateIndex = findDuplicateCandidate(discovered, candidate);
        if (duplicateIndex >= 0) {
          discovered[duplicateIndex] = mergeDiscoveredCandidate(discovered[duplicateIndex], candidate);
          report.duplicates += 1;
          continue;
        }
        discovered.push(candidate);
        sourceResult.candidatesAccepted += 1;
      }
      sourceResult.status = 'checked';
    } catch (error) {
      sourceResult.status = 'error';
      sourceResult.errorMessage = errorMessage(error);
      report.errors.push(`${source.id}: ${sourceResult.errorMessage}`);
    }
  }

  report.candidatesFound = discovered.length;
  try {
    const imported = await importWebsiteCandidates(discovered, { dryRun: options.dryRun });
    report.added = imported.counts.added;
    report.updated = imported.counts.updated;
    report.invalid = imported.counts.invalid;
    report.duplicates += imported.counts.skipped;
    report.importedLeadIds = imported.importedLeadIds;
    if (options.dryRun) report.plannedLeads = imported.leads;
  } catch (error) {
    report.errors.push(`Import/store failure: ${errorMessage(error)}`);
  }

  return finishReport(report, options.writeReport ?? true);
}

function loadSources(): DiscoverySource[] {
  if (!fs.existsSync(SOURCE_PATH)) throw new Error(`Missing source file: ${path.relative(process.cwd(), SOURCE_PATH)}`);
  const parsed = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Discovery source JSON must be an array');
  return parsed as DiscoverySource[];
}

function validateSource(source: DiscoverySource, fixtureAllowed: boolean): string | null {
  if (!source.id || !source.name || !source.url) return 'Missing required source configuration';
  if (!ALLOWED_SOURCE_TYPES.has(source.sourceType)) return `Unsupported source type: ${source.sourceType}`;
  if (!Number.isInteger(source.maxPages) || source.maxPages < 1) return 'maxPages must be at least 1';
  if (fixtureAllowed) return null;
  try {
    const url = new URL(source.url);
    if (url.protocol !== 'https:') return 'Only HTTPS source URLs are allowed';
    if (isUnsafeHostname(url.hostname)) return 'Localhost and private IP addresses are not allowed';
    if (BLOCKED_HOSTS.some((blocked) => url.hostname.toLowerCase().includes(blocked))) {
      return 'Protected or prohibited platform source';
    }
  } catch {
    return 'Invalid source URL';
  }
  return null;
}

async function checkRobots(source: DiscoverySource): Promise<{ allowed: boolean; status: string }> {
  const sourceUrl = new URL(source.url);
  const robotsUrl = new URL('/robots.txt', sourceUrl.origin).toString();
  try {
    const response = await fetchText(robotsUrl);
    if (response.status >= 400) return { allowed: true, status: `unavailable-http-${response.status}` };
    const allowed = robotsAllows(response.body, sourceUrl.pathname);
    return { allowed, status: allowed ? 'allowed' : 'disallowed' };
  } catch {
    return { allowed: true, status: 'unavailable' };
  }
}

function robotsAllows(body: string, pathname: string): boolean {
  let applies = false;
  const disallowed: string[] = [];
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') applies = value === '*' || value.toLowerCase() === USER_AGENT.toLowerCase();
    if (key === 'disallow' && applies && value) disallowed.push(value);
  }
  return !disallowed.some((rule) => pathname.startsWith(rule));
}

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': USER_AGENT, accept: 'text/html,text/plain' },
    });
    const contentType = response.headers.get('content-type') ?? '';
    if (response.ok && !/text\/(html|plain)/i.test(contentType)) throw new Error('Non-HTML response rejected');
    return { status: response.status, body: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

function extractCandidates(html: string, source: DiscoverySource): WebsiteCandidateInput[] {
  if (!html.trim()) return [];
  return source.selectors.businessContainer
    ? extractWithSelectors(html, source)
    : extractFallback(html, source);
}

function extractWithSelectors(html: string, source: DiscoverySource): WebsiteCandidateInput[] {
  const containers = selectFragments(html, source.selectors.businessContainer ?? '');
  return containers
    .map((container) => candidateFromContainer(container, source))
    .filter((candidate): candidate is WebsiteCandidateInput => candidate !== null);
}

function candidateFromContainer(container: string, source: DiscoverySource): WebsiteCandidateInput | null {
  const name = textForSelector(container, source.selectors.businessName);
  if (!name) return null;
  const sourceUrl = source.fixture ? `fixture:${source.id}` : source.url;
  const websiteUrl = cleanBusinessUrl(attributeForSelector(container, source.selectors.websiteLink, 'href'), source);
  const detailUrl = resolveUrl(attributeForSelector(container, source.selectors.detailLink, 'href'), source);
  const email = normalizeEmail(attributeForSelector(container, source.selectors.email, 'href')?.replace(/^mailto:/i, '')
    ?? textForSelector(container, source.selectors.email));
  const phone = normalizePhone(attributeForSelector(container, source.selectors.phone, 'href')?.replace(/^tel:/i, '')
    ?? textForSelector(container, source.selectors.phone));
  return buildCandidate({
    name,
    source,
    sourceUrl,
    websiteUrl,
    detailUrl,
    location: textForSelector(container, source.selectors.location) ?? source.location,
    email,
    phone,
    evidenceText: stripHtml(container).slice(0, 500),
  });
}

function extractFallback(html: string, source: DiscoverySource): WebsiteCandidateInput[] {
  const anchors = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const candidates: WebsiteCandidateInput[] = [];
  for (const match of anchors) {
    const name = stripHtml(match[2]);
    const resolved = resolveUrl(match[1], source);
    const websiteUrl = cleanBusinessUrl(resolved, source);
    const detailUrl = websiteUrl ? null : sameDirectoryDetailUrl(resolved, source);
    if (!name || (!websiteUrl && !detailUrl) || isGenericLinkText(name)) continue;
    candidates.push(buildCandidate({
      name,
      source,
      sourceUrl: source.url,
      websiteUrl,
      detailUrl,
      location: source.location,
      email: null,
      phone: null,
      evidenceText: name,
    }));
  }
  return candidates;
}

function sameDirectoryDetailUrl(value: string | null, source: DiscoverySource): string | null {
  if (!value || source.fixture) return null;
  try {
    const candidate = new URL(value);
    const directory = new URL(source.url);
    if (candidate.protocol !== 'https:' || candidate.hostname !== directory.hostname) return null;
    if (candidate.pathname === directory.pathname || candidate.pathname === '/' || /\/(login|privacy|terms)\b/i.test(candidate.pathname)) {
      return null;
    }
    return candidate.toString();
  } catch {
    return null;
  }
}

function buildCandidate(input: {
  name: string;
  source: DiscoverySource;
  sourceUrl: string;
  websiteUrl: string | null;
  detailUrl: string | null;
  location: string | null;
  email: string | null;
  phone: string | null;
  evidenceText: string;
}): WebsiteCandidateInput {
  const discoveredAt = new Date().toISOString();
  const reference: WebsiteSourceReference = {
    source: input.source.id,
    sourceUrl: input.sourceUrl,
    detailUrl: input.detailUrl,
    discoveredAt,
    evidenceText: input.evidenceText || null,
  };
  return {
    id: stableCandidateId(input.name, input.location, input.websiteUrl),
    businessName: input.name.trim(),
    category: input.source.category,
    source: input.source.id,
    location: normalizeOptional(input.location),
    websiteUrl: input.websiteUrl,
    instagramUrl: null,
    facebookUrl: null,
    email: input.email,
    phone: input.phone,
    notes: input.evidenceText || null,
    detailUrl: input.detailUrl,
    sourceUrl: input.sourceUrl,
    discoveredAt,
    evidenceText: input.evidenceText || null,
    sources: [reference],
  };
}

function selectFragments(html: string, selector: string): string[] {
  const descriptor = selectorDescriptor(selector);
  if (!descriptor) return [];
  const pattern = new RegExp(
    `<([a-z][\\w-]*)\\b(?=[^>]*${descriptor.attributePattern})[^>]*>[\\s\\S]*?<\\/\\1>`,
    'gi',
  );
  return [...html.matchAll(pattern)].map((match) => match[0]);
}

function textForSelector(html: string, selector: string | null): string | null {
  if (!selector) return null;
  const fragment = selectFragments(html, selector)[0];
  return fragment ? normalizeOptional(stripHtml(fragment)) : null;
}

function attributeForSelector(html: string, selector: string | null, attribute: string): string | null {
  if (!selector) return null;
  const descriptor = selectorDescriptor(selector);
  if (!descriptor) return null;
  const tag = html.match(new RegExp(`<([a-z][\\w-]*)\\b(?=[^>]*${descriptor.attributePattern})[^>]*>`, 'i'))?.[0];
  return tag?.match(new RegExp(`\\b${attribute}\\s*=\\s*["']([^"']+)["']`, 'i'))?.[1] ?? null;
}

function selectorDescriptor(selector: string): { attributePattern: string } | null {
  if (/^\.[\w-]+$/.test(selector)) {
    return { attributePattern: `class\\s*=\\s*["'][^"']*\\b${escapeRegex(selector.slice(1))}\\b[^"']*["']` };
  }
  if (/^#[\w-]+$/.test(selector)) {
    return { attributePattern: `id\\s*=\\s*["']${escapeRegex(selector.slice(1))}["']` };
  }
  if (/^[a-z][\w-]*$/i.test(selector)) return { attributePattern: '' };
  return null;
}

function cleanBusinessUrl(value: string | null, source: DiscoverySource): string | null {
  const resolved = resolveUrl(value, source);
  if (!resolved) return null;
  try {
    const url = new URL(resolved);
    if (source.fixture && url.hostname.endsWith('.invalid')) return url.toString();
    if (url.protocol !== 'https:' || isUnsafeHostname(url.hostname)) return null;
    if (BLOCKED_HOSTS.some((blocked) => url.hostname.toLowerCase().includes(blocked))) return null;
    if (!source.fixture && url.hostname === new URL(source.url).hostname) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resolveUrl(value: string | null, source: DiscoverySource): string | null {
  if (!value) return null;
  if (source.fixture) {
    try {
      return new URL(value).toString();
    } catch {
      return null;
    }
  }
  try {
    return new URL(value, source.url).toString();
  } catch {
    return null;
  }
}

function findDuplicateCandidate(candidates: WebsiteCandidateInput[], candidate: WebsiteCandidateInput): number {
  const host = hostname(candidate.websiteUrl);
  const email = candidate.email?.toLowerCase() ?? null;
  const phone = normalizePhone(candidate.phone);
  const nameLocation = `${normalizeText(candidate.businessName)}|${normalizeText(candidate.location ?? '')}`;
  return candidates.findIndex((existing) => (
    Boolean(host && hostname(existing.websiteUrl) === host)
    || Boolean(email && existing.email?.toLowerCase() === email)
    || Boolean(phone && normalizePhone(existing.phone) === phone)
    || `${normalizeText(existing.businessName)}|${normalizeText(existing.location ?? '')}` === nameLocation
  ));
}

function mergeDiscoveredCandidate(
  existing: WebsiteCandidateInput,
  incoming: WebsiteCandidateInput,
): WebsiteCandidateInput {
  return {
    ...existing,
    location: existing.location ?? incoming.location,
    websiteUrl: existing.websiteUrl ?? incoming.websiteUrl,
    email: existing.email ?? incoming.email,
    phone: existing.phone ?? incoming.phone,
    detailUrl: existing.detailUrl ?? incoming.detailUrl,
    evidenceText: [existing.evidenceText, incoming.evidenceText].filter(Boolean).join(' | ') || null,
    sources: [...(existing.sources ?? []), ...(incoming.sources ?? [])],
  };
}

function finishReport(report: DiscoveryReport, writeReport: boolean): DiscoveryReport {
  report.completedAt = new Date().toISOString();
  if (writeReport) {
    const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'discovery');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(outputDir, 'latest.md'), renderReport(report), 'utf8');
    if (!report.dryRun) {
      const historyDir = path.join(outputDir, 'history');
      fs.mkdirSync(historyDir, { recursive: true });
      fs.writeFileSync(path.join(historyDir, `${report.runId}.json`), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
  }
  return report;
}

function renderReport(report: DiscoveryReport): string {
  return `# Website Studio Discovery

- Run ID: ${report.runId}
- Dry run: ${report.dryRun}
- Sources configured: ${report.sourcesConfigured}
- Sources checked: ${report.sourcesChecked}
- Pages fetched: ${report.pagesFetched}
- Candidates found: ${report.candidatesFound}
- Added: ${report.added}
- Updated: ${report.updated}
- Duplicates: ${report.duplicates}
- Invalid: ${report.invalid}
- Skipped: ${report.skipped}
- Errors: ${report.errors.length}

## Source Results

${report.sourceResults.map((result) => `- ${result.sourceId}: ${result.status}; robots=${result.robotsStatus}; entries=${result.entriesDetected}; accepted=${result.candidatesAccepted}; reason=${result.skipReason ?? result.errorMessage ?? 'none'}`).join('\n') || '- No source results.'}

No outreach, forms, accounts, or protected-platform access was performed.
`;
}

function emptySourceResult(source: DiscoverySource): SourceResult {
  return {
    sourceId: source.id,
    url: source.url,
    status: 'skipped',
    httpStatus: null,
    robotsStatus: 'not-checked',
    entriesDetected: 0,
    candidatesAccepted: 0,
    skipReason: null,
    errorMessage: null,
  };
}

function resolveFixturePath(value: string): string {
  const resolved = path.resolve(process.cwd(), value);
  if (!resolved.startsWith(`${EXAMPLES_DIR}${path.sep}`)) throw new Error('Fixture path must stay inside data/website-studio/examples');
  return resolved;
}

function isUnsafeHostname(hostnameValue: string): boolean {
  const host = hostnameValue.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  const ipVersion = net.isIP(host);
  if (!ipVersion) return false;
  if (ipVersion === 6) return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80');
  const parts = host.split('.').map(Number);
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

function stableCandidateId(name: string, location: string | null, websiteUrl: string | null): string {
  const slug = normalizeText(name).replace(/\s+/g, '_').slice(0, 48) || 'website_lead';
  const identity = `${hostname(websiteUrl) ?? ''}|${normalizeText(name)}|${normalizeText(location ?? '')}`;
  return `${slug}_${crypto.createHash('sha256').update(identity).digest('hex').slice(0, 8)}`;
}

function hostname(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function normalizeEmail(value: string | null | undefined): string | null {
  return normalizeOptional(value)?.toLowerCase() ?? null;
}

function normalizePhone(value: string | null | undefined): string | null {
  const normalized = value?.replace(/[^\d+]/g, '') ?? '';
  return normalized || null;
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function isGenericLinkText(value: string): boolean {
  return /^(home|about|contact|privacy|terms|login|sign in|read more|learn more|sponsor|advertisement)$/i.test(value.trim());
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const sourceId = readFlag(args, '--source');
  const limitValue = readFlag(args, '--limit');
  const fixtureMode = process.env.WEBSITE_STUDIO_FIXTURE === '1';
  const report = await runDiscovery({
    dryRun,
    sourceId,
    limit: limitValue ? Number(limitValue) : undefined,
    fixtureMode,
  });
  console.log(`Sources configured: ${report.sourcesConfigured}`);
  console.log(`Sources checked: ${report.sourcesChecked}`);
  console.log(`Sources skipped: ${report.skipped}`);
  console.log(`Pages fetched: ${report.pagesFetched}`);
  console.log(`Candidates found: ${report.candidatesFound}`);
  console.log(`Added: ${report.added}`);
  console.log(`Updated: ${report.updated}`);
  console.log(`Duplicates: ${report.duplicates}`);
  console.log(`Invalid: ${report.invalid}`);
  console.log(`Errors: ${report.errors.length}`);
}

function readFlag(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  return args.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

if (process.argv[1]?.endsWith('discovery.ts')) {
  void cli();
}
