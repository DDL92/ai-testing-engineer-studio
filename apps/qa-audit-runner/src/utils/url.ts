export function validateTargetUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    throw new Error('Missing required --url argument. Example: npm run audit -- --url https://example.com');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: ${rawUrl}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL must start with http:// or https://');
  }

  return parsed.toString();
}

export function isInternalLink(baseUrl: string, href: string): boolean {
  try {
    return new URL(href, baseUrl).hostname === new URL(baseUrl).hostname;
  } catch {
    return false;
  }
}
