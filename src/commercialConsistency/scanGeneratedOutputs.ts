import path = require('path');
import { scanGeneratedOutputs, writeSingleScan } from './consistencyRules';
const scan = scanGeneratedOutputs();
console.log(`Generated output consistency: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('outputs')));
