import { AuditContentSource, AuditFindingContent, ContentDraft, ContentSafetyNote } from './types';

const defaultSafetyNotes: ContentSafetyNote[] = [
  {
    rule: 'Use anonymized phrasing by default.',
    reason: 'Content should educate without naming or shaming companies.',
  },
  {
    rule: 'Do not invent metrics, audit findings, or compliance claims.',
    reason: 'Only local audit text should inform drafts.',
  },
  {
    rule: 'Human approval is required before publishing.',
    reason: 'Drafts may need client-safety and brand review.',
  },
];

export function buildContentDrafts(sources: AuditContentSource[]): ContentDraft[] {
  const primarySource = sources[0];
  if (!primarySource) return [];

  const primaryFinding = preferredFinding(primarySource.findings);
  const automationFinding = primarySource.findings.find((finding) => finding.category === 'automation-opportunity') ?? primaryFinding;

  return [
    buildLinkedInDraft(primarySource, primaryFinding),
    buildInstagramCarousel(primarySource, primaryFinding, automationFinding),
    buildShortVideoScript(primarySource, primaryFinding),
    buildQaLesson(primarySource, automationFinding),
  ];
}

function buildLinkedInDraft(source: AuditContentSource, finding: AuditFindingContent): ContentDraft {
  return {
    id: 'linkedin-audit-landmarks',
    platform: 'linkedin',
    format: 'linkedin-post',
    title: 'LinkedIn draft: small QA signals that deserve manual review',
    source: toContentSource(source),
    safetyNotes: defaultSafetyNotes,
    body: [
      'A recent QA audit found a potential issue that is easy to overlook: key page landmarks were not detected during a passive homepage review.',
      '',
      'That does not automatically mean the product is broken.',
      'It means a QA engineer should manually review whether navigation, main content, and footer structure are visible, understandable, and stable enough for smoke coverage.',
      '',
      `The useful testing question: "${questionFromFinding(finding)}"`,
      '',
      'A useful smoke test would check:',
      '- The page loads with a meaningful title',
      '- Primary navigation is visible when expected',
      '- Main content is present after load',
      '- Important links are visible without clicking destructive flows',
      '',
      'Small checks like these do not replace product QA, but they catch early signals before a release turns messy.',
      '',
      'Manual review first. Automation second.',
    ],
  };
}

function buildInstagramCarousel(source: AuditContentSource, finding: AuditFindingContent, automationFinding: AuditFindingContent): ContentDraft {
  return {
    id: 'instagram-carousel-homepage-smoke-tests',
    platform: 'instagram',
    format: 'instagram-carousel',
    title: 'Instagram carousel outline: homepage smoke tests',
    source: toContentSource(source),
    safetyNotes: defaultSafetyNotes,
    body: [
      'Brand direction: AI Testing Engineer, black / white / cyan, educational, no generated images.',
      'Slide 1: Homepage QA checks most teams skip',
      'Slide 2: A recent QA audit found a potential landmark visibility issue',
      `Slide 3: Check 1 - ${plainFindingTitle(finding)}`,
      'Slide 4: Check 2 - page title and visible content',
      'Slide 5: Check 3 - navigation and important links',
      `Slide 6: Automation idea - ${plainFindingTitle(automationFinding)}`,
      'Slide 7: What not to automate first - login, payment, and form submission without explicit approval',
      'Slide 8: QA takeaway - smoke tests should prove the page is stable before deeper flows',
      'Slide 9: CTA - Follow @aitestingengineer for practical QA automation lessons',
    ],
  };
}

function buildShortVideoScript(source: AuditContentSource, finding: AuditFindingContent): ContentDraft {
  return {
    id: 'short-video-passive-audit-signal',
    platform: 'short-video',
    format: 'short-video-script',
    title: 'Short-video script: passive audit signal',
    source: toContentSource(source),
    safetyNotes: defaultSafetyNotes,
    body: [
      'Hook: One QA audit signal I always check before writing deeper automation.',
      `Point 1: A passive audit may flag a potential issue like ${plainFindingTitle(finding).toLowerCase()}.`,
      'Point 2: That is not a public blame moment. It is a manual-review signal.',
      'Point 3: Before testing forms, payments, or logged-in flows, start with safe checks: title, navigation, main content, links, and screenshot evidence.',
      'Point 4: If those basics are unstable, deeper automation will be noisy.',
      'Close: Start with small smoke tests, then expand only after the workflow is approved.',
    ],
  };
}

function buildQaLesson(source: AuditContentSource, finding: AuditFindingContent): ContentDraft {
  return {
    id: 'qa-lesson-landmarks-before-flows',
    platform: 'linkedin',
    format: 'qa-lesson',
    title: 'QA lesson: review landmarks before deeper workflows',
    source: toContentSource(source),
    safetyNotes: defaultSafetyNotes,
    body: [
      'QA lesson: do not jump straight into complex end-to-end flows.',
      '',
      'A useful first audit step is to confirm that the homepage exposes the basic structure users depend on.',
      '',
      `Local audit signal used for this lesson: ${finding.title}.`,
      `Recommended manual review from the audit: ${finding.recommendation}`,
      '',
      'Practical Playwright starter checks:',
      '- Open the approved URL',
      '- Assert the title is present',
      '- Assert expected landmarks or visible content exist',
      '- Capture a screenshot on failure',
      '- Avoid login, payment, and form submission unless explicitly scoped',
      '',
      'The point is not to claim full coverage. The point is to create a stable first safety net.',
    ],
  };
}

function preferredFinding(findings: AuditFindingContent[]): AuditFindingContent {
  return findings.find((finding) => finding.title.toLowerCase().includes('main content'))
    ?? findings.find((finding) => finding.title.toLowerCase().includes('navigation'))
    ?? findings[0]
    ?? {
      title: 'Recommended manual review',
      severity: 'low',
      category: 'content',
      description: 'No detailed finding was available.',
      recommendation: 'Review the local audit report before creating content.',
    };
}

function toContentSource(source: AuditContentSource) {
  return {
    auditPath: source.auditPath,
    sourceLabel: source.sourceLabel,
    findingTitles: source.findings.map((finding) => finding.title),
  };
}

function questionFromFinding(finding: AuditFindingContent): string {
  if (finding.category === 'navigation') return 'Can users and tests reliably find the primary navigation?';
  if (finding.category === 'content') return 'Can users and tests reliably find the main content after load?';
  if (finding.category === 'automation-opportunity') return 'What safe smoke test would catch this early?';
  return 'What should be manually reviewed before deeper automation?';
}

function plainFindingTitle(finding: AuditFindingContent): string {
  return finding.title
    .replace(/^Potential issue:\s*/i, '')
    .replace(/^Automation opportunity:\s*/i, '')
    .replace(/^Recommended manual review:\s*/i, '');
}
