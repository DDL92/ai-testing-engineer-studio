import fs = require('fs');
import path = require('path');
import { auditOutputDir } from '../config/paths';
import { AuditResult } from '../types/audit';

export function writeAuditReports(result: AuditResult, outputDir = auditOutputDir): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'audit-result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'client-report.md'), `${clientReport(result)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'technical-report.md'), `${technicalReport(result)}\n`, 'utf8');
}

function clientReport(result: AuditResult): string {
  const keyFindings = result.findings.map((finding) => `- ${finding.title}: ${finding.details}`).join('\n');

  return `# Client QA Audit Report

## Executive Summary

A quick Playwright-based QA audit was run against ${result.targetUrl}. The page loaded at ${result.finalUrl} with ${result.visibleBodyContent.characterCount} visible text characters, ${result.forms.length} detected form(s), ${result.buttons.length} detected button(s), and ${result.navigationLinks.length} sampled navigation link(s).

## What Was Tested

- Homepage load and final resolved URL
- Page title and metadata
- Visible body content
- Forms, buttons, and navigation links
- Browser console errors
- Failed network requests
- Sample of internal links and HTTP status
- Screenshot capture

## Key Findings

${keyFindings}

## QA Risks

- Critical user paths may not have automated regression coverage yet.
- Forms and account actions can break silently without stable Playwright tests.
- Console or network errors should be reviewed before release if present.

## Automation Opportunities

- Add smoke coverage for homepage, signup/login, and dashboard access where applicable.
- Add form validation checks for high-value lead or checkout flows.
- Add CI execution with screenshots, traces, and HTML reports on failure.

## Recommended Next Steps

1. Review the screenshot and technical report.
2. Confirm the top 2-3 business-critical workflows.
3. Create a small Playwright smoke suite around those workflows.
4. Add CI reporting so failures are visible before release.

## Suggested Service Offer

Recommended ladder:

- Free Mini QA Audit
- $199 Detailed QA Audit
- $900 Playwright Starter Pack
- $1,500/month QA Maintenance
`;
}

function technicalReport(result: AuditResult): string {
  return `# Technical QA Audit Report

## Audit Metadata

- Target URL: ${result.targetUrl}
- Final URL: ${result.finalUrl}
- Page title: ${result.pageTitle || 'Not detected'}
- Timestamp: ${result.timestamp}
- Screenshot: ${result.screenshot}
- Viewport: ${result.metadata.viewport}
- Language: ${result.metadata.language}
- Description: ${result.metadata.description || 'Not detected'}

## Visible Body Content

- Has visible body: ${result.visibleBodyContent.hasVisibleBody}
- Character count: ${result.visibleBodyContent.characterCount}
- Sample: ${result.visibleBodyContent.textSample || 'No text captured'}

## Forms

${result.forms.length ? result.forms.map((form) => `- ${form.name}: method=${form.method}, action=${form.action}, inputs=${form.inputCount}, submitButtons=${form.submitButtonCount}`).join('\n') : '- None detected'}

## Buttons

${result.buttons.length ? result.buttons.map((button) => `- ${button.text} (${button.type})`).join('\n') : '- None detected'}

## Navigation Links

${result.navigationLinks.length ? result.navigationLinks.slice(0, 30).map((link) => `- ${link.text}: ${link.href} (${link.isInternal ? 'internal' : 'external'})`).join('\n') : '- None detected'}

## Console Errors

${result.consoleErrors.length ? result.consoleErrors.map((error) => `- ${error}`).join('\n') : '- None captured'}

## Failed Network Requests

${result.failedNetworkRequests.length ? result.failedNetworkRequests.map((request) => `- ${request}`).join('\n') : '- None captured'}

## Internal Link Status Sample

${result.internalLinkStatuses.length ? result.internalLinkStatuses.map((link) => `- ${link.status ?? 'N/A'} ${link.url}${link.ok ? '' : ` (${link.error ?? 'not ok'})`}`).join('\n') : '- No internal links sampled'}

## Recommended Automation Backlog

- Smoke test: homepage loads with title and visible content.
- Navigation test: key internal links resolve successfully.
- Form test: each critical form validates required fields.
- Console/network guard: fail CI on blocking browser errors for critical pages.
- Reporting: enable trace, screenshot, video, and HTML report on failure.
`;
}
