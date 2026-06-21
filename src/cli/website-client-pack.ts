import fs = require('fs');
import path = require('path');
import {
  buildClientRecord,
  buildHistoryRecord,
  renderAssetRequest,
  renderOnboardingChecklist,
} from '../websiteStudio/clientPack';
import type {
  ClientHistoryRecord,
  ClientPackContext,
} from '../websiteStudio/clientTypes';
import {
  comparePrice,
  parsePriceRange,
  rejectCredentialFields,
  validateAcceptanceInput,
  validateSafeInputPath,
} from '../websiteStudio/clientValidation';
import {
  renderDeliveryPlan,
  renderMaintenancePlan,
  renderQaAcceptancePlan,
} from '../websiteStudio/deliveryPlanner';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import type { SalesPackJson } from '../websiteStudio/salesTypes';

const args = process.argv.slice(2);

void main().catch((error) => fail(errorMessage(error)));

async function main(): Promise<void> {
  validateFlags(args);
  const inputArgument = readFlag(args, '--input');
  if (!inputArgument) fail('Missing required --input <acceptance-json>.');
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');
  const inputPath = validateSafeInputPath(inputArgument);
  if (!fs.existsSync(inputPath) || !fs.statSync(inputPath).isFile()) {
    fail(`Acceptance input file not found: ${path.relative(process.cwd(), inputPath)}`);
  }

  let rawInput: unknown;
  try {
    rawInput = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as unknown;
  } catch {
    fail(`Invalid JSON: ${path.relative(process.cwd(), inputPath)}`);
  }
  rejectCredentialFields(rawInput);
  const acceptance = validateAcceptanceInput(rawInput);
  const lead = readWebsiteLeads().find((candidate) => candidate.lead.id === acceptance.leadId);
  if (!lead) fail(`Website lead not found: ${acceptance.leadId}`);
  if (acceptance.clientName !== lead.lead.companyName) {
    fail(`Client name does not match the existing lead identity for ${acceptance.leadId}.`);
  }

  const leadPackPath = path.join('output', 'website-studio', 'leads', acceptance.leadId);
  const demoPackPath = path.join('output', 'website-studio', 'demos', acceptance.leadId);
  const salesPackPath = path.join('output', 'website-studio', 'sales', acceptance.leadId);
  const salesPackFile = path.join(process.cwd(), salesPackPath, 'sales-pack.json');
  const proposalPath = path.join(process.cwd(), salesPackPath, 'proposal.md');
  const sowPath = path.join(process.cwd(), salesPackPath, 'sow.md');
  const salesPack = readJson<SalesPackJson>(salesPackFile, 'sales pack');
  if (!fs.existsSync(proposalPath)) fail(`Missing proposal: ${path.relative(process.cwd(), proposalPath)}`);
  if (!fs.existsSync(sowPath)) fail(`Missing SOW: ${path.relative(process.cwd(), sowPath)}`);
  if (salesPack.leadId !== acceptance.leadId) fail('Sales pack lead ID does not match the acceptance input.');
  if (salesPack.manualReviewRequired !== true) fail('Sales pack must remain manually reviewable.');
  if (acceptance.selectedOffer !== salesPack.primaryOffer) {
    fail(`Selected offer mismatch. Acceptance: ${acceptance.selectedOffer}; sales pack: ${salesPack.primaryOffer}.`);
  }

  const priceRange = parsePriceRange(salesPack.priceRange);
  const priceRangeStatus = comparePrice(acceptance.agreedPriceUsd, priceRange);
  const fictional = acceptance.clientId.startsWith('example_')
    || acceptance.leadId.startsWith('example_')
    || /\bfictional\b/i.test(acceptance.notes ?? '');
  const context: ClientPackContext = {
    acceptance,
    lead,
    salesPack,
    proposal: fs.readFileSync(proposalPath, 'utf8'),
    sow: fs.readFileSync(sowPath, 'utf8'),
    proposedPriceRange: salesPack.priceRange,
    priceRangeStatus,
    fictional,
    leadPackPath,
    demoPackPath,
    salesPackPath,
  };
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'clients', acceptance.clientId);
  const outputRelative = path.relative(process.cwd(), outputDir);
  const historyPath = path.join(process.cwd(), 'data', 'website-studio', 'client-history.json');
  const history = readHistory(historyPath);
  const historyIndex = history.findIndex((record) => record.clientId === acceptance.clientId);
  const unresolved = unresolvedOnboarding(context);

  if (dryRun) {
    console.log('Website client pack dry run complete. No files or history were written.');
    console.log(`Client: ${acceptance.clientName} (${acceptance.clientId})${fictional ? ' — FICTIONAL VALIDATION FIXTURE' : ''}`);
    console.log(`Acceptance: ${acceptance.acceptanceStatus}; scope confirmed: ${acceptance.scopeConfirmed}`);
    console.log(`Selected offer: ${acceptance.selectedOffer}`);
    console.log(`Proposed price range: ${salesPack.priceRange}`);
    console.log(`Agreed price: ${acceptance.agreedPriceUsd === null ? 'not supplied' : `USD ${acceptance.agreedPriceUsd}`}`);
    console.log(`Price-range status: ${priceRangeStatus}`);
    console.log(`Output directory: ${outputRelative}`);
    console.log(`Unresolved onboarding requirements: ${unresolved.join('; ') || 'None recorded.'}`);
    console.log('No payment was verified, and no deployment or client action was performed.');
    return;
  }

  if (fs.existsSync(outputDir) && !force) {
    fail(`Client output already exists: ${outputRelative}. Use --force to replace only this client pack and history record.`);
  }
  if (historyIndex >= 0 && !force) {
    fail(`Client history already contains ${acceptance.clientId}. Use --force to replace the matching record.`);
  }

  const createdAt = historyIndex >= 0 ? history[historyIndex].createdAt : new Date().toISOString();
  const nextHistory = [...history];
  const historyRecord = buildHistoryRecord(context, createdAt, outputRelative);
  if (historyIndex >= 0) nextHistory[historyIndex] = historyRecord;
  else nextHistory.push(historyRecord);

  const stagingDir = `${outputDir}.tmp-${process.pid}`;
  try {
    if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
    fs.mkdirSync(stagingDir, { recursive: true });
    writeJson(path.join(stagingDir, 'client-record.json'), buildClientRecord(context, createdAt));
    fs.writeFileSync(path.join(stagingDir, 'onboarding-checklist.md'), renderOnboardingChecklist(context), 'utf8');
    fs.writeFileSync(path.join(stagingDir, 'asset-request.md'), renderAssetRequest(context), 'utf8');
    fs.writeFileSync(path.join(stagingDir, 'delivery-plan.md'), renderDeliveryPlan(context), 'utf8');
    fs.writeFileSync(path.join(stagingDir, 'qa-acceptance-plan.md'), renderQaAcceptancePlan(context), 'utf8');
    fs.writeFileSync(path.join(stagingDir, 'maintenance-plan.md'), renderMaintenancePlan(context), 'utf8');
    const files = fs.readdirSync(stagingDir).sort();
    if (files.length !== 6) throw new Error(`Expected exactly six client-pack files; found ${files.length}.`);

    fs.mkdirSync(path.dirname(historyPath), { recursive: true });
    writeJsonAtomic(historyPath, nextHistory);
    if (force && fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    fs.renameSync(stagingDir, outputDir);

    console.log(`Website client pack generated: ${outputRelative}`);
    console.log(`Client: ${acceptance.clientName}${fictional ? ' — FICTIONAL VALIDATION FIXTURE' : ''}`);
    console.log(`Offer: ${acceptance.selectedOffer}`);
    console.log(`Acceptance: accepted; scope confirmed`);
    console.log(`Price range: ${salesPack.priceRange}; agreed: USD ${acceptance.agreedPriceUsd ?? 'not supplied'}; status: ${priceRangeStatus}`);
    console.log('Statuses: onboarding not_started; QA not_started; maintenance proposed.');
    console.log('No payment was verified, no credentials were stored, and deployment remains unauthorized.');
  } catch (error) {
    if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
    fail(errorMessage(error));
  }
}

function unresolvedOnboarding(context: ClientPackContext): string[] {
  const { acceptance } = context;
  const unresolved = [
    !acceptance.primaryContactName && !acceptance.primaryContactEmail ? 'primary contact' : null,
    !acceptance.targetStartDate || !acceptance.targetDeliveryDate ? 'target dates' : null,
    acceptance.domainStatus === 'unknown' ? 'domain ownership/status' : null,
    acceptance.hostingStatus === 'unknown' ? 'hosting ownership/status' : null,
    !/^(received|complete|approved)$/i.test(acceptance.brandAssetsStatus) ? 'brand assets' : null,
    !/^(received|complete|approved)$/i.test(acceptance.contentStatus) ? 'website content' : null,
    'payment terms',
    'secure access method',
    'legal/privacy responsibility',
    'final approval process',
  ];
  return unresolved.filter((value): value is string => Boolean(value));
}

function readHistory(historyPath: string): ClientHistoryRecord[] {
  if (!fs.existsSync(historyPath)) return [];
  return readJson<ClientHistoryRecord[]>(historyPath, 'client history');
}

function readJson<T>(filePath: string, label: string): T {
  if (!fs.existsSync(filePath)) fail(`Missing ${label}: ${path.relative(process.cwd(), filePath)}`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    fail(`Invalid ${label}: ${path.relative(process.cwd(), filePath)}`);
  }
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeJsonAtomic(filePath: string, value: unknown): void {
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  writeJson(temporaryPath, value);
  fs.renameSync(temporaryPath, filePath);
}

function validateFlags(commandArgs: string[]): void {
  const allowed = new Set(['--input', '--dry-run', '--force']);
  for (let index = 0; index < commandArgs.length; index += 1) {
    const argument = commandArgs[index];
    if (!argument.startsWith('--')) continue;
    const flag = argument.includes('=') ? argument.split('=')[0] : argument;
    if (!allowed.has(flag)) fail(`Unsupported flag: ${flag}`);
    if (flag === '--input' && !argument.includes('=')) index += 1;
  }
}

function readFlag(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index >= 0) return commandArgs[index + 1];
  return commandArgs.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown website client-pack failure.';
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
