import fs = require('fs');
import path = require('path');
import { buildVisualBrief, applyDeterministicCorrection, generateDemoHtml } from '../websiteStudio/demoGenerator';
import { renderAssetPrompts, renderCommercialComparison } from '../websiteStudio/demoReport';
import type { LeadPack } from '../websiteStudio/demoTypes';
import { validateAndCaptureDemo } from '../websiteStudio/demoValidator';
import { readWebsiteLeads } from '../websiteStudio/leadAdapter';
import { getNicheProfile } from '../websiteStudio/nicheProfiles';
import { auditCurrentWebsite, lighthouseAvailability, skippedSiteAudit } from '../websiteStudio/siteAudit';

const args = process.argv.slice(2);

void main().catch((error) => fail(error instanceof Error ? error.message : 'Website demo generation failed.'));

async function main(): Promise<void> {
  validateFlags(args);
  const id = readFlag(args, '--id');
  if (!id) fail('Missing required --id <lead-id>.');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(id)) fail(`Unsafe lead ID: ${id}`);

  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const skipAudit = args.includes('--skip-audit');
  const record = readWebsiteLeads().find((candidate) => candidate.lead.id === id);
  if (!record) fail(`Website lead not found: ${id}`);

  const packPath = path.join(process.cwd(), 'output', 'website-studio', 'leads', id, 'lead-pack.json');
  if (!fs.existsSync(packPath)) fail(`Website lead pack not found: ${path.relative(process.cwd(), packPath)}`);
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf8')) as LeadPack;
  if (pack.leadId !== id) fail(`Website lead pack does not match lead ID: ${id}`);

  const eligible = record.analysis.decision === 'PRIORITY' || record.analysis.decision === 'QUALIFIED';
  if (!eligible && !force) {
    fail(`Lead ${id} is ${record.analysis.decision}. Use --force for manual execution of REVIEW or LOW_PRIORITY leads.`);
  }

  const profile = getNicheProfile(record.lead.industry);
  const outputDir = path.join(process.cwd(), 'output', 'website-studio', 'demos', id);
  const outputExistedBeforeRun = fs.existsSync(outputDir);
  const auditWouldRun = Boolean(record.lead.website && !skipAudit);
  const lighthouse = lighthouseAvailability();

  if (dryRun) {
    console.log('Website demo dry run complete. No files were written and no browser or server was launched.');
    console.log(`Lead: ${record.lead.companyName} (${id})`);
    console.log(`Eligibility: ${eligible ? record.analysis.decision : `${record.analysis.decision} via --force`}`);
    console.log(`Design profile: ${profile.category} — ${profile.visualMood}`);
    console.log(`Output directory: ${path.relative(process.cwd(), outputDir)}`);
    console.log(`Current website audit: ${auditWouldRun ? 'would run' : record.lead.website ? 'skipped by flag' : 'not applicable; no website URL'}`);
    console.log(`Lighthouse: ${lighthouse.status} — ${lighthouse.explanation}`);
    console.log('Manual review required.');
    return;
  }

  if (fs.existsSync(outputDir) && !force) {
    fail(`Demo output already exists: ${path.relative(process.cwd(), outputDir)}. Use --force to replace only this demo directory.`);
  }

  try {
    if (force && fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });

    const audit = auditWouldRun
      ? await auditCurrentWebsite(id, record.lead.website as string)
      : skippedSiteAudit(id, record.lead.website, skipAudit ? 'Current website audit was skipped by --skip-audit.' : 'No current website URL was supplied.');
    const brief = buildVisualBrief(record, profile);
    const indexPath = path.join(outputDir, 'index.html');
    fs.writeFileSync(indexPath, generateDemoHtml(brief, profile), 'utf8');
    writeJson(path.join(outputDir, 'visual-brief.json'), brief);
    writeJson(path.join(outputDir, 'audit.json'), audit);
    fs.writeFileSync(path.join(outputDir, 'asset-prompts.md'), renderAssetPrompts(record, profile), 'utf8');

    const validation = await validateAndCaptureDemo(id, outputDir, (failures) => {
      const html = fs.readFileSync(indexPath, 'utf8');
      fs.writeFileSync(indexPath, applyDeterministicCorrection(html, failures), 'utf8');
    });
    writeJson(path.join(outputDir, 'demo-validation.json'), validation);
    fs.writeFileSync(
      path.join(outputDir, 'commercial-comparison.md'),
      renderCommercialComparison(record, pack, brief, audit),
      'utf8',
    );

    console.log(`Website demo pack generated: ${path.relative(process.cwd(), outputDir)}`);
    console.log(`Lead: ${record.lead.companyName}`);
    console.log(`Profile: ${profile.category}`);
    console.log(`Audit: ${audit.reachable === null ? 'UNKNOWN' : audit.reachable ? 'reachable' : 'not applicable or unavailable'}`);
    console.log(`Lighthouse: ${audit.lighthouse.status}`);
    console.log(`Demo validation: ${validation.overallStatus}`);
    console.log('Screenshots: screenshots/desktop.png, screenshots/mobile.png');
    console.log('Manual review is required. No outreach was generated or sent.');

    if (validation.overallStatus === 'FAIL') {
      process.exitCode = 1;
    }
  } catch (error) {
    if (!outputExistedBeforeRun && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }
    if (isBrowserUnavailable(error)) {
      fail(`${errorMessage(error)}\nPlaywright Chromium is unavailable. Install it with: npx playwright install chromium`);
    }
    fail(errorMessage(error));
  }
}

function validateFlags(commandArgs: string[]): void {
  const allowed = new Set(['--id', '--force', '--dry-run', '--skip-audit']);
  for (let index = 0; index < commandArgs.length; index += 1) {
    const argument = commandArgs[index];
    if (!argument.startsWith('--')) continue;
    const flag = argument.includes('=') ? argument.split('=')[0] : argument;
    if (!allowed.has(flag)) fail(`Unsupported flag: ${flag}`);
    if (flag === '--id' && !argument.includes('=')) index += 1;
  }
}

function readFlag(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index >= 0) return commandArgs[index + 1];
  return commandArgs.find((argument) => argument.startsWith(`${flag}=`))?.slice(flag.length + 1);
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isBrowserUnavailable(error: unknown): boolean {
  return /executable doesn't exist|browser.*not found|playwright install/i.test(errorMessage(error));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown website demo generation failure.';
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
