import path = require('path');
import type {
  ClientAcceptanceInput,
  ParsedPriceRange,
  PriceRangeStatus,
} from './clientTypes';

const credentialKeyPattern = /^(password|token|api[-_]?key|secret|private[-_]?key|credit[-_]?card|bank[-_]?account)$/i;
const depositStatuses = new Set(['not_recorded', 'pending', 'confirmed_manually']);

export function validateSafeInputPath(inputPath: string): string {
  const resolved = path.resolve(process.cwd(), inputPath);
  const relative = path.relative(process.cwd(), resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Unsafe input path. The acceptance JSON must be inside the repository.');
  }
  if (path.extname(resolved).toLowerCase() !== '.json') {
    throw new Error('Unsafe input path. The acceptance input must be a .json file.');
  }
  return resolved;
}

export function rejectCredentialFields(value: unknown): void {
  const detected = findCredentialField(value);
  if (detected) {
    throw new Error(`Credential-like field detected: ${detected}. Credentials and financial secrets must not be stored in this project.`);
  }
}

export function validateAcceptanceInput(value: unknown): ClientAcceptanceInput {
  if (!isObject(value)) throw new Error('Acceptance input must be a JSON object.');
  rejectCredentialFields(value);

  for (const field of ['clientId', 'leadId', 'clientName', 'acceptanceStatus', 'selectedOffer'] as const) {
    if (typeof value[field] !== 'string' || value[field].trim() === '') {
      throw new Error(`${field} is required.`);
    }
  }
  if (!isSafeId(value.clientId as string)) throw new Error(`Unsafe client ID: ${value.clientId as string}`);
  if (!isSafeId(value.leadId as string)) throw new Error(`Unsafe lead ID: ${value.leadId as string}`);
  if (value.acceptanceStatus !== 'accepted') {
    throw new Error('acceptanceStatus must be exactly "accepted". Acceptance is never inferred.');
  }
  if (value.scopeConfirmed !== true) throw new Error('scopeConfirmed must be true.');

  const depositStatus = value.depositStatus ?? 'not_recorded';
  if (typeof depositStatus !== 'string' || !depositStatuses.has(depositStatus)) {
    throw new Error('depositStatus must be not_recorded, pending, or confirmed_manually.');
  }

  const agreedPriceUsd = value.agreedPriceUsd ?? null;
  if (agreedPriceUsd !== null && (typeof agreedPriceUsd !== 'number' || !Number.isFinite(agreedPriceUsd) || agreedPriceUsd <= 0)) {
    throw new Error('agreedPriceUsd must be a positive finite number or null.');
  }

  for (const field of [
    'targetStartDate',
    'targetDeliveryDate',
    'primaryContactName',
    'primaryContactEmail',
    'notes',
  ] as const) {
    if (value[field] !== undefined && value[field] !== null && typeof value[field] !== 'string') {
      throw new Error(`${field} must be a string or null.`);
    }
  }
  for (const field of ['domainStatus', 'hostingStatus', 'brandAssetsStatus', 'contentStatus'] as const) {
    if (value[field] !== undefined && typeof value[field] !== 'string') {
      throw new Error(`${field} must be a string when supplied.`);
    }
  }
  if (typeof value.primaryContactEmail === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.primaryContactEmail)) {
    throw new Error('primaryContactEmail must be a valid email address or null.');
  }

  return {
    clientId: (value.clientId as string).trim(),
    leadId: (value.leadId as string).trim(),
    clientName: (value.clientName as string).trim(),
    acceptanceStatus: 'accepted',
    selectedOffer: (value.selectedOffer as string).trim(),
    agreedPriceUsd,
    depositStatus: depositStatus as ClientAcceptanceInput['depositStatus'],
    scopeConfirmed: true,
    targetStartDate: optionalString(value.targetStartDate),
    targetDeliveryDate: optionalString(value.targetDeliveryDate),
    primaryContactName: optionalString(value.primaryContactName),
    primaryContactEmail: optionalString(value.primaryContactEmail),
    domainStatus: optionalString(value.domainStatus) ?? 'unknown',
    hostingStatus: optionalString(value.hostingStatus) ?? 'unknown',
    brandAssetsStatus: optionalString(value.brandAssetsStatus) ?? 'unknown',
    contentStatus: optionalString(value.contentStatus) ?? 'unknown',
    notes: optionalString(value.notes),
  };
}

export function parsePriceRange(value: string): ParsedPriceRange {
  const match = /^USD\s+([\d,]+(?:\.\d+)?)\s*[–-]\s*([\d,]+(?:\.\d+)?)$/i.exec(value.trim());
  if (!match) throw new Error(`Invalid proposed price range: ${value}`);
  const minimumUsd = Number(match[1].replace(/,/g, ''));
  const maximumUsd = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(minimumUsd) || !Number.isFinite(maximumUsd) || minimumUsd <= 0 || maximumUsd < minimumUsd) {
    throw new Error(`Invalid proposed price range: ${value}`);
  }
  return { minimumUsd, maximumUsd };
}

export function comparePrice(agreedPriceUsd: number | null, range: ParsedPriceRange): PriceRangeStatus {
  if (agreedPriceUsd === null) return 'not_supplied';
  if (agreedPriceUsd < range.minimumUsd) return 'below';
  if (agreedPriceUsd > range.maximumUsd) return 'above';
  return 'within';
}

function findCredentialField(value: unknown, parent = '$'): string | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findCredentialField(item, `${parent}[${index}]`);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(value)) return null;
  for (const [key, item] of Object.entries(value)) {
    if (credentialKeyPattern.test(key)) return `${parent}.${key}`;
    const found = findCredentialField(item, `${parent}.${key}`);
    if (found) return found;
  }
  return null;
}

function isSafeId(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
