import { WebsiteInspection, WebsiteInspectionStatus } from './types';

const INSPECTION_TIMEOUT_MS = 8_000;
const RETRY_INSPECTION_TIMEOUT_MS = 15_000;

type PublicFetch = typeof fetch;

export async function inspectPublicWebsite(
  websiteUrl: string | null | undefined,
  publicFetch: PublicFetch = fetch,
): Promise<WebsiteInspection> {
  if (!websiteUrl) return emptyInspection(null);
  const legacy = await inspectWithRetry(websiteUrl, publicFetch);
  if (!legacy.html || !legacy.inspection.reachable) return legacy.inspection;
  if (legacy.inspection.finalUrl && new URL(legacy.inspection.finalUrl).origin !== new URL(websiteUrl).origin) {
    return {
      ...legacy.inspection,
      canonicalWebsiteUrl: legacy.inspection.finalUrl,
      legacyWebsiteUrl: websiteUrl,
      migrationDetected: true,
      migrationTargetUrl: legacy.inspection.finalUrl,
      migrationEvidence: [`HTTP redirect from ${new URL(websiteUrl).hostname} to ${new URL(legacy.inspection.finalUrl).hostname}`],
      canonicalSiteName: legacy.siteName,
    };
  }

  const migration = detectWebsiteMigration(legacy.html, legacy.inspection.finalUrl ?? websiteUrl);
  if (!migration) return legacy.inspection;
  let canonical = await inspectWithRetry(migration.targetUrl, publicFetch);
  if (!canonical.inspection.reachable && !new URL(migration.targetUrl).hostname.startsWith('www.')) {
    const retryUrl = new URL(migration.targetUrl);
    retryUrl.hostname = `www.${retryUrl.hostname}`;
    canonical = await inspectWithRetry(retryUrl.href, publicFetch);
  }
  if (!canonical.inspection.reachable) {
    return {
      ...legacy.inspection,
      migrationDetected: true,
      legacyWebsiteUrl: websiteUrl,
      migrationTargetUrl: migration.targetUrl,
      migrationEvidence: migration.evidence,
    };
  }
  return {
    ...canonical.inspection,
    requestedUrl: migration.targetUrl,
    canonicalWebsiteUrl: canonical.inspection.finalUrl ?? migration.targetUrl,
    legacyWebsiteUrl: websiteUrl,
    migrationDetected: true,
    migrationTargetUrl: migration.targetUrl,
    migrationEvidence: migration.evidence,
    canonicalSiteName: canonical.siteName,
  };
}

async function inspectWithRetry(
  websiteUrl: string,
  publicFetch: PublicFetch,
): Promise<{ inspection: WebsiteInspection; html: string; siteName?: string }> {
  const first = await inspectSingleWebsite(websiteUrl, publicFetch, INSPECTION_TIMEOUT_MS, 1);
  if (!isRetryableInspection(first.inspection)) return first;
  const second = await inspectSingleWebsite(websiteUrl, publicFetch, RETRY_INSPECTION_TIMEOUT_MS, 2);
  return {
    ...second,
    inspection: {
      ...second.inspection,
      attemptCount: 2,
      timeoutMs: RETRY_INSPECTION_TIMEOUT_MS,
      externalReachabilityUnverified: second.inspection.reachable !== true,
    },
  };
}

async function inspectSingleWebsite(
  websiteUrl: string,
  publicFetch: PublicFetch,
  timeoutMs: number,
  attemptCount: number,
): Promise<{ inspection: WebsiteInspection; html: string; siteName?: string }> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await publicFetch(websiteUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'AI-Testing-Engineer-Studio/1.0 read-only-public-website-check',
        accept: 'text/html,application/xhtml+xml',
      },
    });
    const html = await response.text();
    const finalUrl = response.url || websiteUrl;
    const links = extractAnchors(html);
    const status: WebsiteInspectionStatus = response.ok ? 'SUCCESS' : 'HTTP_ERROR';

    return {
      html,
      siteName: extractSiteName(html),
      inspection: {
      inspectedAt: new Date().toISOString(),
      requestedUrl: websiteUrl,
      status,
      attemptCount,
      timeoutMs,
      externalReachabilityUnverified: false,
      reachable: response.ok,
      httpStatus: response.status,
      httpsUsed: new URL(finalUrl).protocol === 'https:',
      finalUrl,
      pageTitlePresent: /<title\b[^>]*>\s*[^<\s][\s\S]*?<\/title>/i.test(html),
      metaDescriptionPresent: /<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*\bcontent\s*=\s*["'][^"']+["'][^>]*>/i.test(html)
        || /<meta\b(?=[^>]*\bcontent\s*=\s*["'][^"']+["'])[^>]*\bname\s*=\s*["']description["'][^>]*>/i.test(html),
      viewportMetaPresent: /<meta\b[^>]*\bname\s*=\s*["']viewport["'][^>]*>/i.test(html),
      mailtoLinkPresent: links.some((link) => link.href.toLowerCase().startsWith('mailto:')),
      telLinkPresent: links.some((link) => link.href.toLowerCase().startsWith('tel:')),
      conversionLinkPresent: links.some(isConversionLink) || hasVisibleConversionForm(html),
      internalNavigationLinks: countInternalLinks(links, finalUrl),
      brokenResponse: response.status >= 400,
      responseTimeMs: Date.now() - startedAt,
      htmlSizeBytes: Buffer.byteLength(html, 'utf8'),
      failure: response.ok ? null : `HTTP ${response.status}`,
      ...parentPlatformSignals(html, finalUrl),
      },
    };
  } catch (error) {
    const status = classifyInspectionFailure(error);
    return {
      html: '',
      inspection: {
        ...emptyInspection(websiteUrl),
        inspectedAt: new Date().toISOString(),
        status,
        attemptCount,
        timeoutMs,
        reachable: false,
        responseTimeMs: Date.now() - startedAt,
        brokenResponse: !isInconclusiveStatus(status),
        externalReachabilityUnverified: isInconclusiveStatus(status),
        failure: error instanceof Error ? error.message : 'Website inspection failed',
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableInspection(inspection: WebsiteInspection): boolean {
  return inspection.status === 'TIMEOUT' || inspection.status === 'ABORTED';
}

function isInconclusiveStatus(status: WebsiteInspectionStatus): boolean {
  return status === 'TIMEOUT' || status === 'ABORTED';
}

function classifyInspectionFailure(error: unknown): WebsiteInspectionStatus {
  const errorWithName = error as Error & { name?: string; code?: string; cause?: { code?: string } };
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = String(errorWithName.code ?? errorWithName.cause?.code ?? '').toLowerCase();
  if (errorWithName.name === 'AbortError' || message.includes('abort')) return 'ABORTED';
  if (message.includes('timeout') || message.includes('timed out')) return 'TIMEOUT';
  if (code.includes('enotfound') || message.includes('dns') || message.includes('enotfound')) return 'DNS_FAILURE';
  if (code.includes('econn') || message.includes('connection') || message.includes('network')) return 'CONNECTION_FAILURE';
  return 'UNKNOWN_FAILURE';
}

export function detectWebsiteMigration(
  html: string,
  pageUrl: string,
): { targetUrl: string; evidence: string[] } | null {
  const base = new URL(pageUrl);
  const migrationPattern = /\b(new website|new site|visit our new website|we have moved|now available at|continue to|current website|official website)\b/i;
  const anchors = extractAnchors(html);
  const candidates = anchors.flatMap((link) => {
    try {
      const resolved = new URL(link.href, base);
      if (!['http:', 'https:'].includes(resolved.protocol) || resolved.hostname === base.hostname) return [];
      const evidenceText = `${link.context} ${link.text}`.replace(/\s+/g, ' ').trim();
      return migrationPattern.test(evidenceText)
        ? [{ targetUrl: resolved.href, evidence: evidenceText }]
        : [];
    } catch {
      return [];
    }
  });
  const candidate = candidates[0];
  if (candidate) return {
    targetUrl: candidate.targetUrl,
    evidence: [
      `Legacy page language: ${candidate.evidence.slice(0, 240)}`,
      `Replacement domain: ${new URL(candidate.targetUrl).hostname}`,
    ],
  };

  const visibleText = html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const bareDomain = visibleText.match(
    /\b(?:visit our new website|new website|new site|we have moved|now available at|continue to|current website|official website)\b.{0,220}?\b((?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+)\b/i,
  );
  if (!bareDomain?.[1]) return null;
  const targetUrl = new URL(`https://${bareDomain[1]}`).href;
  if (new URL(targetUrl).hostname === base.hostname) return null;
  return {
    targetUrl,
    evidence: [
      `Legacy page language: ${bareDomain[0].slice(0, 240)}`,
      `Replacement domain: ${new URL(targetUrl).hostname}`,
    ],
  };
}

function emptyInspection(requestedUrl: string | null): WebsiteInspection {
  return {
    inspectedAt: null,
    requestedUrl,
    status: null,
    attemptCount: requestedUrl ? 0 : undefined,
    timeoutMs: requestedUrl ? INSPECTION_TIMEOUT_MS : undefined,
    externalReachabilityUnverified: false,
    reachable: requestedUrl ? null : false,
    httpStatus: null,
    httpsUsed: requestedUrl ? new URL(requestedUrl).protocol === 'https:' : null,
    finalUrl: null,
    pageTitlePresent: null,
    metaDescriptionPresent: null,
    viewportMetaPresent: null,
    mailtoLinkPresent: null,
    telLinkPresent: null,
    conversionLinkPresent: null,
    internalNavigationLinks: null,
    brokenResponse: null,
    responseTimeMs: null,
    htmlSizeBytes: null,
    failure: null,
  };
}

function extractAnchors(html: string): Array<{ href: string; text: string; context: string }> {
  const anchors: Array<{ href: string; text: string; context: string }> = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    anchors.push({
      href: match[1].trim(),
      text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      context: html
        .slice(Math.max(0, match.index - 180), Math.min(html.length, pattern.lastIndex + 180))
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    });
  }

  return anchors;
}

function extractSiteName(html: string): string | undefined {
  const og = html.match(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:site_name["'])[^>]*\bcontent\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1];
  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim();
  const value = decodeBasicEntities(og || title || '').split(/\s+[|—–-]\s+/)[0]?.trim();
  return value || undefined;
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

function isConversionLink(link: { href: string; text: string }): boolean {
  const value = `${link.href} ${link.text}`.toLowerCase();
  return /\b(book|booking|reserve|reservation|availability|appointment|contact|quote|inquiry|enquire|schedule|whatsapp|host your retreat|request a quote|book now|check availability|contact us)\b/.test(value);
}

function hasVisibleConversionForm(html: string): boolean {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
  return /<form\b/i.test(html) && /\b(contact|quote|inquiry|enquire|request|reservation|booking|retreat)\b/.test(text);
}

function countInternalLinks(links: Array<{ href: string }>, finalUrl: string): number {
  const base = new URL(finalUrl);
  const internal = new Set<string>();

  for (const link of links) {
    if (/^(mailto:|tel:|javascript:|#)/i.test(link.href)) continue;
    try {
      const resolved = new URL(link.href, base);
      if (resolved.origin === base.origin) internal.add(`${resolved.pathname}${resolved.search}`);
    } catch {
      // Invalid links are ignored because this inspector records only verifiable signals.
    }
  }

  return internal.size;
}

function parentPlatformSignals(html: string, finalUrl: string): Pick<WebsiteInspection, 'rootDomain' | 'parentBusinessName' | 'parentPlatformPage' | 'standaloneBusinessPage'> {
  const url = new URL(finalUrl);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const rootDomain = url.hostname.toLowerCase().replace(/^www\./, '');
  const parentBusinessName = extractSiteName(html);
  const parentPlatformPage = pathSegments.length >= 2 && Boolean(parentBusinessName);
  return {
    rootDomain,
    ...(parentBusinessName ? { parentBusinessName } : {}),
    parentPlatformPage,
    standaloneBusinessPage: !parentPlatformPage,
  };
}
