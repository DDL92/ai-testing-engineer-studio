import { generateWeeklyBusinessReview } from './generateWeeklyBusinessReview';
import { generatePipelineSummary } from './generatePipelineSummary';
import { generateFollowUpsDue } from './generateFollowUpsDue';

export function runWeeklyOperator(): void {
  generateWeeklyBusinessReview();
  generatePipelineSummary();
  generateFollowUpsDue();
}

if (require.main === module) runWeeklyOperator();

