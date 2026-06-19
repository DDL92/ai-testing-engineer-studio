import path = require('path');
import { scanCommercialReferences, writeSingleScan } from './consistencyRules';
const scan = scanCommercialReferences();
console.log(`Commercial reference scan: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('references')));
