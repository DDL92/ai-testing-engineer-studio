export interface MessageQualityResult {
  passed: boolean;
  warnings: string[];
  suggestedFixes: string[];
}

export function checkMessageQuality(message: string, input: { hasAuditEvidence?: boolean } = {}): MessageQualityResult {
  const warnings: string[] = [];
  const suggestedFixes: string[] = [];
  const normalized = message.toLowerCase();
  const words = message.trim().split(/\s+/).filter(Boolean);

  flag(/guarantee|guaranteed|will definitely|ensure[s]? revenue|double your|10x|best in the world/, 'Potential overclaiming.', 'Replace guarantees with practical, evidence-based language.');
  flag(/i found bugs|we found bugs|bugs in your app|your app is broken/, 'Claims bugs were found.', 'Only mention bugs if an audit report supports the claim.');
  if (!input.hasAuditEvidence && /audit found|from the audit|based on the audit|public-page findings/.test(normalized)) {
    warnings.push('References audit findings without evidence in context.');
    suggestedFixes.push('Use conditional language or run a lead audit first.');
  }
  flag(/dashboard|admin panel|private area|logged in|behind login|customer data/, 'Mentions private app areas.', 'Avoid private-area claims unless credentials and scope were explicitly provided.');
  if (words.length > 180) {
    warnings.push('Message is too long.');
    suggestedFixes.push('Cut to one relevant observation, one value proposition, and one CTA.');
  }
  if (words.length < 20) {
    warnings.push('Message may be too generic or thin.');
    suggestedFixes.push('Add one QA automation-specific reason and a clear CTA.');
  }
  flag(/limited time|act now|last chance|don't miss|exclusive offer|free money/, 'Salesy or spam-like phrasing.', 'Use calm, specific, professional wording.');
  flag(/sir\/madam|dear hiring manager|to whom it may concern|esteemed/, 'Generic opener.', 'Personalize with company or project context when available.');
  if (!/playwright|qa|test|testing|automation|regression|smoke/.test(normalized)) {
    warnings.push('Missing relevance to QA automation.');
    suggestedFixes.push('Add a concise Playwright, QA, regression, or automation angle.');
  }
  if (!/\?|would it|open to|worth|should i|can i|does that/.test(normalized)) {
    warnings.push('Missing clear CTA.');
    suggestedFixes.push('Add a low-pressure question or next step.');
  }
  flag(/\$\d+|revenue|mrr|roi|profit|conversion lift/, 'Potential unsupported revenue claim.', 'Avoid revenue claims unless they are clearly framed as pricing or internal goals.');
  flag(/you need to|you must|obviously|clearly you|mistake|failure/, 'Aggressive tone.', 'Use collaborative, optional language.');
  flag(/bulk|blast|automated message|scraped|mass outreach/, 'Spam-like automation phrasing.', 'Keep the message manual, targeted, and reviewable.');

  return {
    passed: warnings.length === 0,
    warnings,
    suggestedFixes: Array.from(new Set(suggestedFixes)),
  };

  function flag(pattern: RegExp, warning: string, fix: string): void {
    if (!pattern.test(normalized)) return;
    warnings.push(warning);
    suggestedFixes.push(fix);
  }
}
