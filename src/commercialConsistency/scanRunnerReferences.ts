import path = require('path');
import { scanRunnerReferences, writeSingleScan } from './consistencyRules';
const scan = scanRunnerReferences();
console.log(`Runner consistency: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('runner')));
