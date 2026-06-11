import fs = require('fs');
import path = require('path');

const requiredFiles = [
  'docs/business/client-acquisition-system.md',
  'docs/business/offers.md',
  'docs/business/lead-scoring.md',
  'docs/business/lead-sources.md',
  'docs/business/lead-source-expansion.md',
  'docs/business/daily-operating-sop.md',
  'docs/business/upwork-strategy.md',
  'docs/business/outreach-operating-system.md',
  'docs/business/follow-up-cadence.md',
  'docs/business/manual-contact-enrichment.md',
  'docs/business/crm-review-workflow.md',
  'docs/business/revenue-tracking.md',
  'docs/business/closing-workflow.md',
  'docs/business/monthly-goal-tracking.md',
  'docs/business/weekly-executive-dashboard.md',
  'docs/business/weekly-review-sop.md',
  'docs/business/dashboard-viewer.md',
  'docs/business/action-cockpit.md',
  'docs/business/ai-message-optimizer.md',
  'docs/business/message-quality-rules.md',
  'docs/business/message-review-queue.md',
  'docs/business/source-quality-scoring.md',
  'apps/lead-operator/README.md',
  'apps/dashboard-viewer/README.md',
  'data/leads/sources.json',
  'data/leads/message-review-queue.json',
  'data/leads/source-quality.json',
  '.github/workflows/daily-lead-operator.yml',
  '.github/workflows/weekly-business-dashboard.yml',
  'docs/automation/mac-daily-lead-operator.md',
  'automation/n8n/README.md',
  'automation/n8n/daily-lead-operator.workflow.example.json',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length > 0) {
  console.error(`Missing required business files:\n${missing.map((file) => `- ${file}`).join('\n')}`);
  process.exit(1);
}

console.log(`Business validation passed for ${requiredFiles.length} file(s).`);
