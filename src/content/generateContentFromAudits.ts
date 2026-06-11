import fs = require('fs');
import path = require('path');
import { buildContentDrafts } from './contentRules';
import { AuditContentSource, AuditFindingContent, ContentDraft } from './types';

const auditsRoot = path.join(process.cwd(), 'output', 'audits');
const outputPath = path.join(process.cwd(), 'output', 'content', 'content-calendar.md');

function main(): void {
  const sources = findAuditReports().map(readAuditContentSource);
  const drafts = buildContentDrafts(sources);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderContentCalendar(sources, drafts), 'utf8');

  console.log(`Content calendar generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Source audits: ${sources.length}`);
  console.log(`Drafts generated: ${drafts.length}`);
  console.log('No posts, APIs, AI calls, Canva, images, dashboards, or external services were used.');
}

function findAuditReports(): string[] {
  if (!fs.existsSync(auditsRoot)) return [];

  return fs.readdirSync(auditsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(auditsRoot, entry.name, 'audit-report.md'))
    .filter((auditPath) => fs.existsSync(auditPath))
    .sort();
}

function readAuditContentSource(auditPath: string): AuditContentSource {
  const markdown = fs.readFileSync(auditPath, 'utf8');
  const sourceLabel = path.basename(path.dirname(auditPath));

  return {
    auditPath: path.relative(process.cwd(), auditPath),
    sourceLabel,
    findings: extractFindings(markdown),
  };
}

function extractFindings(markdown: string): AuditFindingContent[] {
  const findingsSection = markdown.split('## Findings')[1]?.split('## Automation Opportunities')[0] ?? '';
  const chunks = findingsSection.split('\n### ').map((chunk) => chunk.trim()).filter(Boolean);

  return chunks.map((chunk) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    const title = lines[0]?.replace(/^###\s*/, '') ?? 'Untitled audit finding';

    return {
      title,
      severity: fieldValue(lines, 'Severity'),
      category: fieldValue(lines, 'Category'),
      description: fieldValue(lines, 'Description'),
      recommendation: fieldValue(lines, 'Recommendation'),
    };
  });
}

function fieldValue(lines: string[], label: string): string {
  const prefix = `- ${label}:`;
  const line = lines.find((candidate) => candidate.startsWith(prefix));
  return line ? line.slice(prefix.length).trim() : 'Not captured in local audit report.';
}

function renderContentCalendar(sources: AuditContentSource[], drafts: ContentDraft[]): string {
  return `# Content From Audits

## Source Audits

${renderSources(sources)}

## LinkedIn Drafts

${renderDrafts(drafts.filter((draft) => draft.format === 'linkedin-post'))}

## Instagram Carousel Outlines

${renderDrafts(drafts.filter((draft) => draft.format === 'instagram-carousel'))}

## Short Video Script Outlines

${renderDrafts(drafts.filter((draft) => draft.format === 'short-video-script'))}

## QA Lessons

${renderDrafts(drafts.filter((draft) => draft.format === 'qa-lesson' || draft.format === 'audit-insight'))}

## Recommended Publishing Order

1. QA lesson: publish first because it is the safest educational angle.
2. LinkedIn draft: use after manual review and wording cleanup.
3. Instagram carousel outline: design manually in AI Testing Engineer black / white / cyan direction.
4. Short-video outline: record manually only after reviewing the script for client safety.

## Safety Review Checklist

- Content is anonymized by default.
- No real client names are included unless explicitly approved and already marked demo/sample.
- No fake metrics, ROI, accessibility compliance, or performance claims are included.
- No company is shamed or described as having failed.
- No images, Canva files, social posts, APIs, AI calls, or publishing automations were created.
- Daniel must approve every draft before publishing.
`;
}

function renderSources(sources: AuditContentSource[]): string {
  if (sources.length === 0) {
    return '- No local audit reports found in output/audits/. Run npm run audit:site first.';
  }

  return sources.map((source) => [
    `- ${source.sourceLabel}: ${source.auditPath}`,
    `  - Findings extracted: ${source.findings.length}`,
    ...source.findings.map((finding) => `  - ${finding.title}`),
  ].join('\n')).join('\n');
}

function renderDrafts(drafts: ContentDraft[]): string {
  if (drafts.length === 0) return '- No drafts generated for this section.';

  return drafts.map((draft) => `### ${draft.title}

- Platform: ${draft.platform}
- Format: ${draft.format}
- Source: ${draft.source.auditPath}

${draft.body.map((line) => (line ? line : '')).join('\n')}

Safety notes:

${draft.safetyNotes.map((note) => `- ${note.rule} ${note.reason}`).join('\n')}
`).join('\n');
}

main();
