type EnvConfig = {
  baseUrl: string;
  apiBaseUrl?: string;
  aiApiUrl?: string;
  testUserEmail?: string;
  testUserPassword?: string;
};

const getEnv = (name: string, fallback?: string): string | undefined => {
  return process.env[name] ?? fallback;
};

export const env: EnvConfig = {
  baseUrl: getEnv('BASE_URL', 'http://localhost:3000')!,
  apiBaseUrl: getEnv('API_BASE_URL'),
  aiApiUrl: getEnv('AI_API_URL'),
  testUserEmail: getEnv('TEST_USER_EMAIL'),
  testUserPassword: getEnv('TEST_USER_PASSWORD')
};

export const hasTestCredentials = Boolean(env.testUserEmail && env.testUserPassword);
export const hasApiBaseUrl = Boolean(env.apiBaseUrl);
