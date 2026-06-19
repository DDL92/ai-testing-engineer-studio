import { WebsiteInspection } from './types';

const INSPECTION_TIMEOUT_MS = 8_000;

export async function inspectPublicWebsite(websiteUrl: string | null | undefined): Promise<WebsiteInspection> {
  if (!websiteUrl) return emptyInspection(null);

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSPECTION_TIMEOUT_MS);

  try {
    const response = await fetch(websiteUrl, {
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

    return {
      inspectedAt: new Date().toISOString(),
      requestedUrl: websiteUrl,
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
      conversionLinkPresent: links.some(isConversionLink),
      internalNavigationLinks: countInternalLinks(links, finalUrl),
      brokenResponse: response.status >= 400,
      responseTimeMs: Date.now() - startedAt,
      htmlSizeBytes: Buffer.byteLength(html, 'utf8'),
      failure: response.ok ? null : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ...emptyInspection(websiteUrl),
      inspectedAt: new Date().toISOString(),
      reachable: false,
      responseTimeMs: Date.now() - startedAt,
      brokenResponse: true,
      failure: error instanceof Error ? error.message : 'Website inspection failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

function emptyInspection(requestedUrl: string | null): WebsiteInspection {
  return {
    inspectedAt: null,
    requestedUrl,
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

function extractAnchors(html: string): Array<{ href: string; text: string }> {
  const anchors: Array<{ href: string; text: string }> = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    anchors.push({
      href: match[1].trim(),
      text: match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });
  }

  return anchors;
}

function isConversionLink(link: { href: string; text: string }): boolean {
  const value = `${link.href} ${link.text}`.toLowerCase();
  return /\b(book|booking|reserve|reservation|appointment|contact|quote|inquiry|enquire|schedule)\b/.test(value);
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
