import path = require('path');
import { scanSourceOfTruthUsage, writeSingleScan } from './consistencyRules';
const scan = scanSourceOfTruthUsage();
console.log(`Source-of-truth usage: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('sources')));
