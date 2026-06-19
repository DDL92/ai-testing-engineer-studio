import path = require('path');
import { scanMobileReferences, writeSingleScan } from './consistencyRules';
const scan = scanMobileReferences();
console.log(`Mobile consistency: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('mobile')));
