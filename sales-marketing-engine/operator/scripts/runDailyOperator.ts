import { qualifyLeads } from './qualifyLeads';
import { generateDailySalesBrief } from './generateDailySalesBrief';
import { generateMessagesToSend } from './generateMessagesToSend';
import { generateProposalQueue } from './generateProposalQueue';
import { generateFollowUpsDue } from './generateFollowUpsDue';
import { generateContentPack } from './generateContentPack';
import { generatePipelineSummary } from './generatePipelineSummary';

export function runDailyOperator(): void {
  qualifyLeads();
  generateDailySalesBrief();
  generateMessagesToSend();
  generateProposalQueue();
  generateFollowUpsDue();
  generateContentPack();
  generatePipelineSummary();
}

if (require.main === module) runDailyOperator();

