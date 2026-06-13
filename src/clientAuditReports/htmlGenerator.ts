import { ClientAuditReport } from './types';

export function renderClientAuditHtml(report: ClientAuditReport): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(report.companyName)} QA Audit Report</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #1b2430;
      --muted: #586174;
      --line: #d8dee8;
      --panel: #f6f8fb;
      --accent: #1769aa;
      --accent-soft: #e9f2fb;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      background: #ffffff;
      font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
    }
    main {
      width: min(980px, calc(100% - 48px));
      margin: 0 auto;
      padding: 44px 0 64px;
    }
    .cover {
      border-bottom: 3px solid var(--accent);
      padding: 28px 0 34px;
      margin-bottom: 28px;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 36px;
      line-height: 1.12;
      letter-spacing: 0;
    }
    h2 {
      margin: 32px 0 12px;
      font-size: 20px;
      line-height: 1.25;
      border-bottom: 1px solid var(--line);
      padding-bottom: 6px;
    }
    h3 {
      margin: 20px 0 8px;
      font-size: 15px;
      color: var(--accent);
    }
    .subtitle {
      color: var(--muted);
      font-size: 18px;
      margin: 0 0 18px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 18px;
      margin-top: 18px;
      color: var(--muted);
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      border: 1px solid var(--line);
      background: var(--panel);
      padding: 12px 14px;
      border-radius: 6px;
    }
    .metric strong {
      display: block;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0;
    }
    .metric span {
      display: block;
      margin-top: 4px;
      font-size: 17px;
      font-weight: 650;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 18px;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 8px 10px;
      vertical-align: top;
      word-break: break-word;
    }
    th {
      background: var(--accent-soft);
      text-align: left;
      color: #143d63;
    }
    ul, ol {
      padding-left: 22px;
      margin: 8px 0 18px;
    }
    li { margin: 4px 0; }
    .opportunity {
      border: 1px solid var(--line);
      border-left: 4px solid var(--accent);
      padding: 10px 12px;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    .opportunity p {
      margin: 4px 0;
    }
    .disclaimer {
      background: #fff8e6;
      border: 1px solid #efd79c;
      padding: 12px 14px;
      border-radius: 6px;
    }
    @media print {
      main {
        width: auto;
        margin: 0;
        padding: 24px;
      }
      .opportunity, .metric, table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
<main>
  <section class="cover">
    <h1>${escapeHtml(report.companyName)}</h1>
    <p class="subtitle">QA Audit Report</p>
    <div class="meta">
      <div><strong>Generated Date:</strong> ${escapeHtml(formatDate(report.generatedAt))}</div>
      <div><strong>Prepared By:</strong> ${escapeHtml(report.preparedBy)}</div>
      <div><strong>Prepared For:</strong> ${escapeHtml(report.preparedFor)}</div>
      <div><strong>Report Type:</strong> Public evidence review</div>
    </div>
  </section>

  <section>
    <h2>Executive Summary</h2>
    <div class="summary">
      ${metric('Company', report.companyName)}
      ${metric('Opportunity Score', `${report.opportunityScore}/100`)}
      ${metric('Evidence Readiness', `${report.evidenceReadiness}/100`)}
      ${metric('Recommended Service', report.recommendedService)}
    </div>
    <p><strong>Recommended Next Action:</strong> ${escapeHtml(report.recommendedNextAction)}</p>
  </section>

  <section>
    <h2>Lighthouse Evidence</h2>
    ${renderKeyValueTable([
    ['Performance', scoreLabel(report.lighthouseEvidence?.performance ?? null)],
    ['Accessibility', scoreLabel(report.lighthouseEvidence?.accessibility ?? null)],
    ['Best Practices', scoreLabel(report.lighthouseEvidence?.bestPractices ?? null)],
    ['SEO', scoreLabel(report.lighthouseEvidence?.seo ?? null)],
  ])}
  </section>

  <section>
    <h2>Playwright Evidence</h2>
    ${renderKeyValueTable([
    ['Pages Reviewed', String(report.playwrightEvidence?.pagesReviewed ?? 'Not Available')],
    ['Screenshots Captured', String(report.playwrightEvidence?.screenshotsCaptured ?? 'Not Available')],
    ['Console Observations', String(report.playwrightEvidence?.consoleObservations ?? 'Not Available')],
    ['Observed Public Flows', report.playwrightEvidence?.observedPublicFlows.join(', ') ?? 'Not Available'],
  ])}
  </section>

  <section>
    <h2>Potential Opportunities</h2>
    ${report.potentialOpportunities.map((opportunity) => `<div class="opportunity">
      <p><strong>${escapeHtml(opportunity.type)}</strong></p>
      <p>${escapeHtml(opportunity.description)}</p>
      <p><strong>Evidence:</strong> ${escapeHtml(opportunity.evidence)}</p>
      <p><strong>Confidence:</strong> ${escapeHtml(opportunity.confidence)}</p>
    </div>`).join('\n')}
  </section>

  <section>
    <h2>Recommended Coverage</h2>
    <h3>Smoke Coverage</h3>
    ${list(report.recommendedCoverage.smokeSuite)}
    <h3>Regression Coverage</h3>
    ${list(report.recommendedCoverage.regressionSuite)}
    <h3>Critical Path Coverage</h3>
    ${list(report.recommendedCoverage.criticalPathCoverage)}
  </section>

  <section>
    <h2>Recommended Engagement</h2>
    <p>${escapeHtml(report.recommendedService)}</p>
    <h3>Upgrade Path</h3>
    ${list(report.upgradePath)}
  </section>

  <section>
    <h2>Discovery Call Questions</h2>
    <ol>
      ${report.discoveryQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join('\n')}
    </ol>
  </section>

  <section>
    <h2>Disclaimer</h2>
    <div class="disclaimer">
      ${report.disclaimer.map((item) => `<p>${escapeHtml(item)}</p>`).join('\n')}
    </div>
  </section>
</main>
</body>
</html>`;
}

function metric(label: string, value: string): string {
  return `<div class="metric"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`;
}

function renderKeyValueTable(rows: Array<[string, string]>): string {
  return `<table><tbody>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('\n')}</tbody></table>`;
}

function list(items: string[]): string {
  if (items.length === 0) return '<p>Not available.</p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')}</ul>`;
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
