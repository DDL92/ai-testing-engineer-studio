import path = require('path');
import { scanDashboardReferences, writeSingleScan } from './consistencyRules';
const scan = scanDashboardReferences();
console.log(`Dashboard consistency: ${scan.status}; ${scan.findings.length} finding(s).`);
console.log(path.relative(process.cwd(), writeSingleScan('dashboard')));
