import path = require('path');
import { buildMobileReviewPackage, writeMobileSummaryOutput } from './mobileRules';

function main(): void {
  const review = buildMobileReviewPackage();
  const outputPath = writeMobileSummaryOutput(review);

  console.log(`Mobile summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top priority: ${review.actionQueue[0]?.title ?? 'none'}`);
  console.log(`Follow-ups due: ${review.followUpCenter.find((item) => item.label === 'Follow-Ups Due')?.value ?? '0'}`);
  console.log('Summary is read-only. No outreach, emails, proposals, invoices, payments, lead data updates, proposal data updates, or external actions were performed.');
}

main();
