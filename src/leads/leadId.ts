import { Lead } from './types';

export function createBaseLeadId(companyName: string): string {
  const id = companyName
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return id || 'lead';
}

export function createUniqueLeadId(companyName: string, existingLeads: Lead[]): string {
  const baseId = createBaseLeadId(companyName);
  const existingIds = new Set(existingLeads.map((lead) => lead.id));

  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

export function normalizeCompanyName(companyName: string): string {
  return companyName.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeWebsite(website: string): string {
  try {
    const url = new URL(website.trim());
    url.hash = '';
    url.search = '';
    const pathname = url.pathname.replace(/\/+$/, '');
    return `${url.protocol}//${url.hostname.toLowerCase()}${pathname}`;
  } catch {
    return website.trim().toLowerCase().replace(/\/+$/, '');
  }
}
