import fs = require('fs');
import path = require('path');
import { buildLeadRotationDecision } from '../leadRotation/rotationRules';
import { LeadRotationCandidate } from '../leadRotation/types';
import {
  ClientConversionDashboard,
  ClientConversionResult,
  ClientConversionStatus,
  ClientHistoryEntry,
  ClientPackage,
  ClientRecord,
  PackageSelection,
} from './types';

const dataDir = path.join(process.cwd(), 'data', 'clients');
const recordsPath = path.join(dataDir, 'client-records.json');
const historyPath = path.join(dataDir, 'client-history.json');
const selectionsPath = path.join(dataDir, 'package-selections.json');
const outputDir = path.join(process.cwd(), 'output', 'client-conversion');

const supportedPackages: ClientPackage[] = ['qa-audit', 'starter-pack', 'retainer'];
const allowedStatuses: ClientConversionStatus[] = ['lead', 'interested', 'qualified', 'client', 'delivery-prep', 'delivery-active', 'completed'];

const safetyRules = [
  'Local-only client preparation.',
  'Client status does not claim a signed contract, payment, invoice, or delivered work.',
  'No outreach, emails, meetings, invoices, payment processing, CRM integrations, or client repository changes are performed.',
  'Human approval is required before client-facing use or delivery execution.',
];

export function isSupportedClientPackage(value: string): value is ClientPackage {
  return supportedPackages.includes(value as ClientPackage);
}

export function isAllowedClientStatus(value: string): value is ClientConversionStatus {
  return allowedStatuses.includes(value as ClientConversionStatus);
}

export function convertActionableLeadToClient(
  selectedPackage: ClientPackage = 'qa-audit',
  status: ClientConversionStatus = 'delivery-prep',
): ClientConversionResult {
  if (!isSupportedClientPackage(selectedPackage)) {
    throw new Error(`Unsupported package: ${selectedPackage}. Use qa-audit, starter-pack, or retainer.`);
  }
  if (!isAllowedClientStatus(status)) {
    throw new Error(`Unsupported client status: ${status}.`);
  }

  const rotation = buildLeadRotationDecision();
  const lead = rotation.actionableLead;
  if (!lead) throw new Error('No actionable lead is available. Run npm run lead:rotation first.');

  ensureStores();
  const records = loadClientRecords();
  const existing = records.find((record) => record.clientId === lead.companyId);
  const now = new Date().toISOString();
  const record = buildClientRecordFromActionableLead(lead, selectedPackage, status, existing, now);
  const packageSelection: PackageSelection = {
    clientId: record.clientId,
    clientName: record.clientName,
    selectedPackage,
    selectedAt: now,
    selectionBasis: [
      `Actionable lead from Lead Rotation: ${lead.companyName}`,
      `Commercial readiness: ${lead.commercialReadinessScore}/100`,
      `Recommended offer: ${lead.recommendedOffer}`,
      'Package requires Daniel approval before client-facing use.',
    ],
    approvalStatus: 'human-review-required',
  };

  writeJson(recordsPath, [...records.filter((item) => item.clientId !== record.clientId), record]);
  upsertPackageSelection(packageSelection);
  appendHistoryIfChanged(record, existing);

  return {
    generatedAt: now,
    record,
    packageSelection,
    previousStatus: existing?.status ?? null,
    conversionStatus: existing ? 'UPDATED' : 'CREATED',
    nextAction: `Review ${record.clientName} ${selectedPackage} scope and delivery checklist before changing status from delivery-prep.`,
    safetyRules,
  };
}

export function buildClientRecordFromActionableLead(
  lead: LeadRotationCandidate,
  selectedPackage: ClientPackage,
  status: ClientConversionStatus = 'delivery-prep',
  existing?: ClientRecord,
  now = new Date().toISOString(),
): ClientRecord {
  if (!isSupportedClientPackage(selectedPackage)) throw new Error(`Unsupported package: ${selectedPackage}`);
  if (!isAllowedClientStatus(status)) throw new Error(`Unsupported client status: ${status}`);
  return {
    clientId: lead.companyId,
    clientName: lead.companyName,
    website: lead.website,
    sourceLead: lead.companyName,
    sourceLeadRank: lead.rank,
    commercialReadiness: lead.commercialReadinessScore,
    selectedPackage,
    status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    approvalStatus: 'human-review-required',
  };
}

export function buildCurrentClientConversion(): ClientConversionResult | null {
  const rotation = buildLeadRotationDecision();
  const actionable = rotation.actionableLead;
  if (!actionable) return null;
  const record = loadClientRecords().find((item) => item.clientId === actionable.companyId);
  if (!record) return null;
  const selection = loadPackageSelections().find((item) => item.clientId === record.clientId) ?? packageSelectionFromRecord(record);

  return {
    generatedAt: new Date().toISOString(),
    record,
    packageSelection: selection,
    previousStatus: record.status,
    conversionStatus: 'UPDATED',
    nextAction: `Review ${record.clientName} ${record.selectedPackage} scope and delivery checklist before delivery execution.`,
    safetyRules,
  };
}

export function buildClientConversionDashboard(): ClientConversionDashboard {
  const current = buildCurrentClientConversion();
  return {
    clientStatus: current?.record.status ?? 'No converted actionable lead',
    selectedPackage: current?.record.selectedPackage ?? 'No package selected',
    clientName: current?.record.clientName ?? 'No client record',
    nextClientAction: current?.nextAction ?? 'Run npm run client:convert after confirming the actionable lead.',
  };
}

export function writeClientConversionOutputs(result: ClientConversionResult): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['client-record.md', renderClientRecord(result)],
    ['client-status.md', renderClientStatus(result)],
    ['package-selection.md', renderPackageSelection(result)],
    ['conversion-summary.md', renderConversionSummary(result)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function loadClientRecords(): ClientRecord[] {
  return readJson<ClientRecord[]>(recordsPath, []);
}

export function loadPackageSelections(): PackageSelection[] {
  return readJson<PackageSelection[]>(selectionsPath, []);
}

function renderClientRecord(result: ClientConversionResult): string {
  const record = result.record;
  return [
    '# Client Record',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    bullets([
      `Client Name: ${record.clientName}`,
      `Website: ${record.website}`,
      `Source Lead: ${record.sourceLead}`,
      `Source Lead Rank: ${record.sourceLeadRank}`,
      `Commercial Readiness: ${record.commercialReadiness}/100`,
      `Selected Package: ${record.selectedPackage}`,
      `Status: ${record.status}`,
      `Approval Status: ${record.approvalStatus}`,
    ]),
    '',
    '## Safety Rules',
    bullets(result.safetyRules),
    '',
  ].join('\n');
}

function renderClientStatus(result: ClientConversionResult): string {
  return [
    '# Client Status',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    bullets([
      `Client: ${result.record.clientName}`,
      `Status: ${result.record.status}`,
      `Package: ${result.record.selectedPackage}`,
      `Conversion Result: ${result.conversionStatus}`,
      `Next Action: ${result.nextAction}`,
    ]),
    '',
    '## Allowed Statuses',
    bullets(allowedStatuses),
    '',
    '## Safety Rules',
    bullets(result.safetyRules),
    '',
  ].join('\n');
}

function renderPackageSelection(result: ClientConversionResult): string {
  return [
    '# Package Selection',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    bullets([
      `Client: ${result.packageSelection.clientName}`,
      `Selected Package: ${result.packageSelection.selectedPackage}`,
      `Approval Status: ${result.packageSelection.approvalStatus}`,
    ]),
    '',
    '## Selection Basis',
    bullets(result.packageSelection.selectionBasis),
    '',
    '## Supported Packages',
    bullets(supportedPackages),
    '',
    '## Safety Rules',
    bullets(result.safetyRules),
    '',
  ].join('\n');
}

function renderConversionSummary(result: ClientConversionResult): string {
  return [
    '# Client Conversion Summary',
    '',
    `Generated: ${result.generatedAt}`,
    '',
    bullets([
      `Actionable Lead Converted: ${result.record.clientName}`,
      `Selected Package: ${result.record.selectedPackage}`,
      `Client Status: ${result.record.status}`,
      `Conversion Result: ${result.conversionStatus}`,
      `Next Action: ${result.nextAction}`,
    ]),
    '',
    'Preparation only. This record does not claim client acceptance, contract signature, payment, or delivered work.',
    '',
  ].join('\n');
}

function appendHistoryIfChanged(record: ClientRecord, previous: ClientRecord | undefined): void {
  if (previous?.status === record.status && previous.selectedPackage === record.selectedPackage) return;
  const history = readJson<ClientHistoryEntry[]>(historyPath, []);
  const entry: ClientHistoryEntry = {
    eventId: `${record.clientId}-${record.status}-${record.selectedPackage}`,
    clientId: record.clientId,
    clientName: record.clientName,
    event: previous && previous.selectedPackage !== record.selectedPackage ? 'package-selected' : 'converted-to-delivery-prep',
    status: record.status,
    selectedPackage: record.selectedPackage,
    createdAt: record.updatedAt,
    notes: 'Local preparation record only. Human approval remains required.',
  };
  writeJson(historyPath, [...history.filter((item) => item.eventId !== entry.eventId), entry]);
}

function upsertPackageSelection(selection: PackageSelection): void {
  const selections = loadPackageSelections();
  writeJson(selectionsPath, [...selections.filter((item) => item.clientId !== selection.clientId), selection]);
}

function packageSelectionFromRecord(record: ClientRecord): PackageSelection {
  return {
    clientId: record.clientId,
    clientName: record.clientName,
    selectedPackage: record.selectedPackage,
    selectedAt: record.updatedAt,
    selectionBasis: ['Loaded from the current client record.'],
    approvalStatus: 'human-review-required',
  };
}

function ensureStores(): void {
  fs.mkdirSync(dataDir, { recursive: true });
  for (const filePath of [recordsPath, historyPath, selectionsPath]) {
    if (!fs.existsSync(filePath)) writeJson(filePath, []);
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return raw ? JSON.parse(raw) as T : fallback;
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}
