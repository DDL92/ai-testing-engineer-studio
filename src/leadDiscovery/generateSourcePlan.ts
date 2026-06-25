import fs = require('fs');
import path = require('path');
import { LeadSourceConfig, LeadKeywordSet } from './sourceTypes';
import { LeadVertical } from './types';

interface SourceFile {
  vertical: LeadVertical;
  sources: Array<{
    name: string;
    category: LeadSourceConfig['category'];
    requiresLogin: boolean;
    automationRisk: LeadSourceConfig['automationRisk'];
    enabled: boolean;
    exampleKeywords: string[];
    notes: string;
  }>;
}

const sourceDir = path.join(process.cwd(), 'data', 'lead-discovery', 'sources');
const keywordDir = path.join(process.cwd(), 'data', 'lead-discovery', 'keywords');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery');
const planPath = path.join(outputDir, 'source-plan.md');
const summaryPath = path.join(outputDir, 'source-summary.json');

function main(): void {
  const generatedAt = new Date().toISOString();
  const sourceFiles = readJsonFiles<SourceFile>(sourceDir);
  const keywordSets = readJsonFiles<LeadKeywordSet>(keywordDir);
  const sources = sourceFiles.flatMap((file) => file.sources.map((source) => ({
    vertical: file.vertical,
    sourceName: source.name,
    category: source.category,
    enabled: source.enabled,
    requiresLogin: source.requiresLogin,
    automationRisk: source.automationRisk,
    keywords: source.exampleKeywords,
    notes: source.notes,
  } satisfies LeadSourceConfig)));
  const verticals = unique([...sourceFiles.map((file) => file.vertical), ...keywordSets.map((set) => set.vertical)]);
  const summary = {
    generatedAt,
    totalVerticals: verticals.length,
    totalSourceConfigs: sources.length,
    totalKeywordSets: keywordSets.length,
    enabledSources: sources.filter((source) => source.enabled).length,
    lowRiskSources: sources.filter((source) => source.automationRisk === 'low').length,
    sourcesRequiringManualReview: sources.filter((source) => source.requiresLogin || source.automationRisk !== 'low').length,
    verticals,
    safetyRules: [
      'No scraping implementation is included.',
      'No network requests are made.',
      'No paid APIs or purchased databases are used.',
      'No outreach, email, DM, or form submission is automated.',
      'Human review is required before lead delivery or contact.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(planPath, renderPlan(generatedAt, verticals, sources, keywordSets, summary), 'utf8');
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  console.log(`Source plan generated: ${path.relative(process.cwd(), planPath)}`);
  console.log(`Source summary generated: ${path.relative(process.cwd(), summaryPath)}`);
  console.log('Planning only. No scraping, network requests, paid APIs, or outreach automation were performed.');
}

function readJsonFiles<T>(directory: string): T[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(directory, fileName), 'utf8')) as T);
}

function renderPlan(
  generatedAt: string,
  verticals: LeadVertical[],
  sources: LeadSourceConfig[],
  keywordSets: LeadKeywordSet[],
  summary: {
    totalVerticals: number;
    totalSourceConfigs: number;
    totalKeywordSets: number;
    enabledSources: number;
    lowRiskSources: number;
    sourcesRequiringManualReview: number;
  },
): string {
  return `# AI Lead Discovery Source Plan

Generated: ${generatedAt}

## Summary

- Total verticals: ${summary.totalVerticals}
- Total source configs: ${summary.totalSourceConfigs}
- Total keyword sets: ${summary.totalKeywordSets}
- Enabled sources: ${summary.enabledSources}
- Low-risk sources: ${summary.lowRiskSources}
- Sources requiring manual review: ${summary.sourcesRequiringManualReview}
- Automation boundary: planning only; no scraping, network requests, paid APIs, or outreach automation.

${verticals.map((vertical) => renderVertical(vertical, sources, keywordSets)).join('\n\n')}
`;
}

function renderVertical(vertical: LeadVertical, sources: LeadSourceConfig[], keywordSets: LeadKeywordSet[]): string {
  const verticalSources = sources.filter((source) => source.vertical === vertical);
  const keywords = keywordSets.find((set) => set.vertical === vertical);
  return `## ${vertical}

### Sources Available

${verticalSources.map((source) => `- ${source.sourceName} (${source.category}) — enabled: ${source.enabled ? 'yes' : 'no'}, login: ${source.requiresLogin ? 'yes' : 'no'}, risk: ${source.automationRisk}. ${source.notes}`).join('\n') || '- None configured.'}

### Example Keywords

- Search phrases: ${keywords?.searchPhrases.slice(0, 5).join('; ') || 'None'}
- Service phrases: ${keywords?.servicePhrases.slice(0, 5).join('; ') || 'None'}
- Urgency phrases: ${keywords?.urgencyPhrases.slice(0, 5).join('; ') || 'None'}
- Budget phrases: ${keywords?.budgetPhrases.slice(0, 5).join('; ') || 'None'}
- Location phrases: ${keywords?.locationPhrases.slice(0, 5).join('; ') || 'None'}

### Example Intent Signals

${intentSignalsFor(vertical, keywords).map((signal) => `- ${signal}`).join('\n')}

### Recommended Future Discovery Approach

Use bounded, public-only search or manual collection first. Save raw public context into the manual intake format, deduplicate locally, score conservatively, and require human review before delivery.

### Risk Notes

Avoid logged-in scraping, private personal data, stale posts, and weak inferred intent. Treat every result as unverified until reviewed by a human.`;
}

function intentSignalsFor(vertical: LeadVertical, keywords?: LeadKeywordSet): string[] {
  const defaults: Record<LeadVertical, string[]> = {
    travel_leads: ['planning trip to Costa Rica', 'looking for honeymoon recommendations', 'surf trip Costa Rica'],
    catering_leads: ['need catering for 100 people', 'corporate lunch recommendations', 'wedding catering suggestions'],
    wedding_leads: ['looking for wedding vendors', 'need venue and catering', 'destination wedding planner recommendations'],
    real_estate_leads: ['moving before school year', 'need realtor recommendation', 'looking for rental near downtown'],
    website_leads: ['business with no website', 'outdated website', 'poor mobile experience'],
    qa_leads: ['startups hiring QA', 'product launch QA help', 'rapid growth company needs test automation'],
  };
  return unique([...(keywords?.searchPhrases ?? []), ...(keywords?.servicePhrases ?? []), ...defaults[vertical]]).slice(0, 6);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

if (require.main === module) main();
