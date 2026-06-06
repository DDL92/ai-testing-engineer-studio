import { listMarkdownFiles, readText, writeMarkdown } from './operatorUtils';

function detectBestOffer(text: string): { offer: string; price: string; pain: string } {
  const lower = text.toLowerCase();
  if (/(ai|rag|prompt|chatbot|agent)/.test(lower)) {
    return { offer: 'AI Testing Audit', price: '$500-$1,000', pain: 'AI response quality, grounding, and safety risk' };
  }
  if (/(framework|setup|page object|pom|ci|typescript)/.test(lower)) {
    return { offer: 'Playwright Starter Framework', price: '$800-$1,500', pain: 'Need for maintainable CI-ready Playwright automation' };
  }
  if (/(retainer|ongoing|monthly|maintenance)/.test(lower)) {
    return { offer: 'Monthly QA Automation Retainer', price: '$750-$2,500/month', pain: 'Need for ongoing QA automation support' };
  }
  return { offer: 'Playwright QA Automation Audit', price: '$300-$500', pain: 'Manual regression and unclear automation priorities' };
}

export function generateProposalQueue(): void {
  const files = listMarkdownFiles('input/job-posts');
  const sections = files.flatMap((file) => {
    const text = readText(file);
    const { offer, price, pain } = detectBestOffer(text);
    return [
      `## ${file.replace('input/job-posts/', '')}`,
      '',
      'REVIEW BEFORE SENDING',
      '',
      `- Detected pain point: ${pain}`,
      `- Best offer to pitch: ${offer}`,
      `- Suggested price range: ${price}`,
      '',
      '### Short Proposal',
      '',
      `Hi, I can help with ${pain.toLowerCase()} by starting with a focused ${offer}. I would keep the scope practical, prioritize the highest-risk flows, and deliver clear next steps your team can use immediately.`,
      '',
      '### Medium Proposal',
      '',
      `Hi, your project looks like a strong fit for a ${offer}. I would focus on the highest-risk workflows first, define the right test coverage, and keep the delivery maintainable. The goal is to improve release confidence without overbuilding. I can provide clear deliverables, a practical timeline, and handoff notes so your team can continue from the first delivery.`,
      '',
      '### Smart Questions',
      '',
      '1. What are the top 2-3 flows that must not break before release?',
      '2. Do you already have a staging environment and test user available?',
      '',
      '### Follow-Up Message',
      '',
      `Hi, following up. A small first milestone could be the ${offer} so you get clear deliverables before committing to a larger scope.`,
      ''
    ];
  });

  const content = ['# Proposal Queue', '', 'All proposals require human review before sending.', '', ...sections].join('\n');
  writeMarkdown('generated/proposal-queue.md', content);
  writeMarkdown('approval-queue/proposals-ready-to-send.md', content);
}

if (require.main === module) generateProposalQueue();

