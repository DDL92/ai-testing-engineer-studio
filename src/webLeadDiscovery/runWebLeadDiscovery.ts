import path = require('path');
import { runTavilyLeadDiscovery, writeWebDiscoveryOutputs } from './webDiscoveryRules';

async function main(): Promise<void> {
  const report = await runTavilyLeadDiscovery();
  const outputPaths = writeWebDiscoveryOutputs(report);

  console.log('Web lead discovery generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Recorded web leads: ${report.leads.length}`);
  console.log(`Status: ${report.status}`);
  console.log('Manual approval required. No leads were invented or contacted.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
