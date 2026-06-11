export function validateEmail(email: string | undefined): void {
  if (!email) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
}

export function validateHttpUrl(value: string | undefined, label: string): void {
  if (!value) return;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid ${label} URL: ${value}`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label} URL must start with http:// or https://`);
  }
}
