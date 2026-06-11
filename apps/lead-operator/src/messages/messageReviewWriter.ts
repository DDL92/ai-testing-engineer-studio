import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import type { MessageReviewItem, MessageReviewQueue, MessageReviewStatus } from './messageReviewTypes';

export function writeMessageReviewQueueMarkdown(queue: MessageReviewQueue): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'message-review-queue.md');
  fs.writeFileSync(filePath, `${formatMessageReviewQueue(queue).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatMessageReviewQueue(queue: MessageReviewQueue): string {
  return `# Message Review Queue

Generated: ${queue.generatedAt}

## Summary

- Pending review: ${queue.summary.pending_review}
- Approved but not sent: ${queue.summary.approved}
- Needs edit: ${queue.summary.needs_edit}
- Rejected: ${queue.summary.rejected}
- Sent: ${queue.summary.sent}
- Archived: ${queue.summary.archived}

## Pending Review

${formatItems(queue.items.filter((item) => item.status === 'pending_review'))}

## Approved But Not Sent

${formatItems(queue.items.filter((item) => item.status === 'approved'))}

## Needs Edit

${formatItems(queue.items.filter((item) => item.status === 'needs_edit'))}

## Rejected

${formatItems(queue.items.filter((item) => item.status === 'rejected'))}

## Sent

${formatItems(queue.items.filter((item) => item.status === 'sent'))}

## Archived

${formatItems(queue.items.filter((item) => item.status === 'archived'))}

## Recent Status Changes

${formatRecentChanges(queue.items)}

## Recommended Next Actions

- Scan drafts: npm run message:queue
- Approve reviewed draft: npm run message:review -- --file <draft-file> --status approved --note "Reviewed"
- Mark needs edit: npm run message:review -- --file <draft-file> --status needs_edit --note "Shorten CTA"
- Mark manually sent: npm run message:sent -- --file <draft-file> --channel linkedin --note "Sent manually"
- Optimize draft: npm run message:optimize -- --file sales-marketing-engine/operator/approval-queue/<draft-file> --type follow_up
- Dashboard: http://localhost:4173/message-queue
`;
}

function formatItems(items: MessageReviewItem[]): string {
  return items.length
    ? items.map((item) => `- ${item.fileName}${item.leadId ? ` (${item.leadId})` : ''}: ${item.messageType}/${item.channel}. Warnings: ${item.qualityWarnings.length}. Note: ${item.note || 'None.'}`).join('\n')
    : '- None.';
}

function formatRecentChanges(items: MessageReviewItem[]): string {
  const recent = items
    .flatMap((item) => item.statusHistory.map((history) => ({ item, history })))
    .sort((a, b) => b.history.changedAt.localeCompare(a.history.changedAt))
    .slice(0, 10);
  return recent.length
    ? recent.map(({ item, history }) => `- ${history.changedAt}: ${item.fileName} -> ${history.status}. ${history.note || 'No note.'}`).join('\n')
    : '- None.';
}

export function emptySummary(): Record<MessageReviewStatus, number> {
  return {
    pending_review: 0,
    approved: 0,
    needs_edit: 0,
    rejected: 0,
    sent: 0,
    archived: 0,
  };
}
