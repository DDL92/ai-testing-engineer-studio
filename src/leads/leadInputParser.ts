export interface LeadCliInput {
  company: string;
  website: string;
  industry: string;
  source: string;
  notes: string;
  painPoints: string[];
  contactName: string;
  contactRole: string;
  contactUrl: string;
  nextAction: string;
}

const requiredFlags = ['company', 'website', 'industry', 'source'];

export function parseLeadCliInput(args: string[]): LeadCliInput {
  const values = parseFlags(args);
  const missing = requiredFlags.filter((flag) => !values[flag]);

  if (missing.length > 0) {
    throw new Error(`Missing required argument(s): ${missing.map((flag) => `--${flag}`).join(', ')}`);
  }

  validateWebsite(values.website);

  return {
    company: values.company,
    website: values.website,
    industry: values.industry,
    source: values.source,
    notes: values.notes ?? '',
    painPoints: values.painPoints ? splitPainPoints(values.painPoints) : inferPainPoints(values.notes ?? ''),
    contactName: values.contactName ?? '',
    contactRole: values.contactRole ?? '',
    contactUrl: values.contactUrl ?? '',
    nextAction: values.nextAction ?? 'Review lead pack, confirm fit, and decide whether to prepare a QA audit angle.',
  };
}

function parseFlags(args: string[]): Record<string, string> {
  const values: Record<string, string> = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;

    if (arg.includes('=')) {
      const [rawKey, ...rawValueParts] = arg.slice(2).split('=');
      values[rawKey] = rawValueParts.join('=').trim();
      continue;
    }

    const key = arg.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      values[key] = '';
      continue;
    }

    values[key] = value.trim();
    index += 1;
  }

  return values;
}

function validateWebsite(website: string): void {
  let url: URL;

  try {
    url = new URL(website);
  } catch {
    throw new Error(`Invalid --website value: ${website}. Use an absolute http or https URL.`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Invalid --website protocol: ${url.protocol}. Use http or https only.`);
  }
}

function splitPainPoints(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferPainPoints(notes: string): string[] {
  const text = notes.toLowerCase();
  const painPoints: string[] = [];

  addIfFound(text, painPoints, ['signup', 'sign up', 'onboarding'], 'signup/onboarding coverage');
  addIfFound(text, painPoints, ['checkout', 'cart'], 'checkout regression risk');
  addIfFound(text, painPoints, ['payment', 'billing'], 'payment flow risk');
  addIfFound(text, painPoints, ['login', 'auth', 'authentication'], 'login/session reliability');
  addIfFound(text, painPoints, ['regression'], 'regression testing opportunity');
  addIfFound(text, painPoints, ['flaky'], 'flaky test stabilization');
  addIfFound(text, painPoints, ['performance'], 'performance review opportunity');
  addIfFound(text, painPoints, ['mobile'], 'mobile flow review');
  addIfFound(text, painPoints, ['api'], 'API regression coverage');
  addIfFound(text, painPoints, ['ci/cd', 'cicd', 'release'], 'CI/CD release confidence');

  return painPoints;
}

function addIfFound(text: string, painPoints: string[], keywords: string[], painPoint: string): void {
  if (keywords.some((keyword) => text.includes(keyword))) {
    painPoints.push(painPoint);
  }
}
