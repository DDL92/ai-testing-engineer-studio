import { readText, safeText, todayIso, writeMarkdown } from './operatorUtils';

function firstTopic(): string {
  const topics = readText('input/content-topics.md')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter((line) => line && !line.startsWith('#'));
  const index = new Date().getDate() % Math.max(1, topics.length);
  return safeText(topics[index] ?? topics[0]);
}

export function generateContentPack(): void {
  const topic = firstTopic();
  const serviceTie = topic.toLowerCase().includes('ai') || topic.toLowerCase().includes('rag')
    ? 'AI Testing Audit'
    : 'Playwright QA Automation Audit';

  const content = [
    '# Content Pack Today',
    '',
    'REVIEW BEFORE POSTING',
    '',
    `Generated: ${todayIso()}`,
    `Topic: ${topic}`,
    `Suggested service tie-in: ${serviceTie}`,
    '',
    '## LinkedIn Post',
    '',
    `${topic}`,
    '',
    'Most teams do not need more noise in their QA process. They need a practical way to identify risk, protect critical flows, and turn repeated manual checks into reliable regression coverage.',
    '',
    'A small audit can clarify what to automate first, what to defer, and which tests will improve release confidence fastest.',
    '',
    `CTA: Ask for the ${serviceTie} outline.`,
    '',
    '## Instagram 9-Slide Carousel',
    '',
    `Slide 1: ${topic}`,
    'Slide 2: The problem is usually hidden in repeated manual checks',
    'Slide 3: Release risk grows when critical flows are not protected',
    'Slide 4: Do not start by automating everything',
    'Slide 5: Start with the highest-risk workflow',
    'Slide 6: Add stable checks and clear assertions',
    'Slide 7: Review failures with screenshots, traces, and reports',
    'Slide 8: Expand only after the first tests are stable',
    'Slide 9: Follow @aitestingengineer',
    '',
    '## Short Video Script Under 45 Seconds',
    '',
    `Hook: ${topic}`,
    'Problem: Teams often wait until regression testing is painful before creating a clear automation plan.',
    'Insight: Start with the highest-risk flows and build only the first useful layer of coverage.',
    `CTA: Ask for the ${serviceTie} outline.`,
    '',
    '## X Thread',
    '',
    `1. ${topic}`,
    '2. The goal is not to automate everything.',
    '3. The goal is to reduce release risk where it matters.',
    '4. Start with critical flows, stable locators, and clear assertions.',
    '5. Turn the result into a roadmap your team can maintain.',
    `6. CTA: Ask for the ${serviceTie} outline.`,
    '',
    '## CTA',
    '',
    `Ask for the ${serviceTie} outline.`
  ].join('\n');

  writeMarkdown('generated/content-pack-today.md', content);
  writeMarkdown('approval-queue/content-ready-to-post.md', content);
}

if (require.main === module) generateContentPack();

