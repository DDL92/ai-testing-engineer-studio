import path = require('path');

export const auditOutputDir = path.join(process.cwd(), 'reports', 'latest');
export const auditScreenshotDir = path.join(auditOutputDir, 'screenshots');
export const auditScreenshotPath = path.join(auditScreenshotDir, 'homepage.png');
