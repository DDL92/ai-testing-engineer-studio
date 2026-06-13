import path = require('path');
import { buildMobileReviewPackage, writeMobileQueueOutput } from './mobileRules';

function main(): void {
  const review = buildMobileReviewPackage();
  const outputPath = writeMobileQueueOutput(review);

  console.log(`Mobile action queue generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Queue items: ${review.actionQueue.length}`);
  console.log('Queue is review-only. It does not send messages, proposals, invoices, payments, or modify data.');
}

main();
