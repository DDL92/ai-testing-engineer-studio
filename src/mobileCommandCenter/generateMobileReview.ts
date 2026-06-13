import path = require('path');
import { buildMobileReviewPackage, writeMobileReviewOutputs } from './mobileRules';

function main(): void {
  const review = buildMobileReviewPackage();
  const outputPaths = writeMobileReviewOutputs(review);

  console.log(`Mobile review package generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Action queue items: ${review.actionQueue.length}`);
  console.log('Read-only review package. No outreach, emails, proposals, invoices, payments, lead data updates, proposal data updates, or external actions were performed.');
}

main();
