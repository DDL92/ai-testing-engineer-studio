export function normalizeDomain(value: string | undefined): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  const markdownUrl = raw.match(/\((https?:\/\/[^)]+)\)/)?.[1];
  const candidate = markdownUrl ?? raw.replace(/^\[/, '').replace(/\]$/, '');
  const withProtocol = /^[a-z]+:\/\//i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(withProtocol);
    return normalizeHost(url.hostname);
  } catch {
    return normalizeHost(candidate.replace(/^https?:\/\//i, '').split('/')[0] ?? '');
  }
}

export function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}

export function domainBrand(domain: string): string {
  const normalized = normalizeDomain(domain);
  const label = normalized.split('.')[0] ?? '';
  if (!label) return '';
  return label
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
