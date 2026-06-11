export const leadKeywords = [
  'Playwright',
  'Cypress',
  'Selenium',
  'QA Automation',
  'SDET',
  'Test Automation',
  'Regression Testing',
  'CI/CD',
  'SaaS',
  'web app',
  'dashboard',
  'startup',
  'agency',
  'software studio',
];

export function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return leadKeywords.filter((keyword) => lower.includes(keyword.toLowerCase()));
}
