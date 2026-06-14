import path = require('path');
import { runTavilyPainMining, writePainMiningOutputs } from './painMiningRules';

async function main(): Promise<void> {
  const report = await runTavilyPainMining();
  const outputPaths = writePainMiningOutputs(report);

  console.log('Pain mining report generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Pain signals recorded: ${report.signals.length}`);
  console.log('Only locally recorded public signals are reported. No complaints or quotes were invented.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
