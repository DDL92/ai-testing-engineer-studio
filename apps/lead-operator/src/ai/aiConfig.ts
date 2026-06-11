export type AiProviderName = 'openai' | 'deterministic';

export interface AiCopyConfig {
  enabled: boolean;
  provider: AiProviderName;
  model: string;
  hasApiKey: boolean;
  apiKey?: string;
  warnings: string[];
}

export function getAiCopyConfig(): AiCopyConfig {
  const enabled = parseBoolean(process.env.AI_COPY_ENABLED);
  const provider = parseProvider(process.env.AI_PROVIDER);
  const apiKey = process.env.OPENAI_API_KEY;
  const warnings: string[] = [];

  if (!enabled) warnings.push('AI copy is disabled. Using deterministic fallback.');
  if (enabled && provider === 'openai' && !apiKey) warnings.push('AI_COPY_ENABLED=true but OPENAI_API_KEY is missing. Using deterministic fallback.');

  return {
    enabled,
    provider: enabled && provider === 'openai' && apiKey ? 'openai' : 'deterministic',
    model: process.env.AI_COPY_MODEL || 'gpt-4o-mini',
    hasApiKey: Boolean(apiKey),
    apiKey,
    warnings,
  };
}

export function isAiCopyActive(config = getAiCopyConfig()): boolean {
  return config.enabled && config.provider === 'openai' && config.hasApiKey;
}

function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

function parseProvider(value: string | undefined): AiProviderName {
  return value === 'openai' ? 'openai' : 'deterministic';
}
