import path = require('path');
import {
  buildFollowupQueue,
  loadOutreachRecords,
  writeFollowupQueueOutput,
} from './outreachTrackingRules';

function main(): void {
  const records = loadOutreachRecords();
  const outputPath = writeFollowupQueueOutput(records);
  const queue = buildFollowupQueue(records);

  console.log(`Follow-up queue generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Follow-ups due: ${queue.length}`);
  console.log('No follow-up messages were generated or sent. Human approval is required before any action.');
}

main();
