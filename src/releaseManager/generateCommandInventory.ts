import { buildStudioReleaseReport, renderCommandInventory, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('command-inventory.md', renderCommandInventory(report));
console.log(`Release command inventory generated: ${report.commands.length} commands.`);
