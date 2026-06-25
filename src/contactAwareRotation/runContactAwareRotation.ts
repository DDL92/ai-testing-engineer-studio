import path = require('path');
import { buildContactAwareRotation } from './rotationRules';

async function main(): Promise<void> {
  const report = await buildContactAwareRotation(readOptions());
  console.log(`Contact-aware rotation state: ${path.join('data', 'contact-aware-rotation', 'rotation-state.json')}`);
  console.log(`Status: ${report.status}`);
  console.log(`Selected lead: ${report.selectedLead?.companyName ?? 'None'}`);
  console.log(`Evaluated leads: ${report.evaluatedLeads.filter((lead) => lead.contactStatus !== 'NOT_EVALUATED').length}`);
  console.log('Manual review only. Nothing was sent.');
}

function readOptions(): { maxLeads?: number; refresh?: boolean } {
  const args = process.argv.slice(2);
  const maxIndex = args.indexOf('--max-leads');
  const maxLeads = maxIndex >= 0 ? Number(args[maxIndex + 1]) : undefined;
  return {
    ...(Number.isFinite(maxLeads) ? { maxLeads } : {}),
    refresh: args.includes('--refresh'),
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
