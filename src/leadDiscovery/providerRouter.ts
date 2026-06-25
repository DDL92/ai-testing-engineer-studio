import fs = require('fs');
import path = require('path');
import { getTavilyRuntimeConfig } from '../integrations/tavily/tavilyClient';
import {
  ProviderConfig,
  ProviderName,
  ProviderRegistry,
  ProviderSelection,
  TavilyProviderGuardrails,
} from './providerTypes';

const providerRegistryPath = path.join(process.cwd(), 'data', 'lead-discovery', 'providers', 'providers.json');
const providerGuardrailsPath = path.join(process.cwd(), 'data', 'lead-discovery', 'providers', 'tavily-guardrails.json');

export function selectSearchProvider(): ProviderSelection {
  const registry = readProviderRegistry();
  const guardrails = readProviderGuardrails();
  const tavilyConfigured = getTavilyRuntimeConfig().hasApiKey;
  const tavily = providerByName(registry.providers, 'tavily');
  const bing = providerByName(registry.providers, 'bing_rss');
  const fallbackEnabled = Boolean(guardrails.fallbackEnabled && bing?.enabled);

  if (tavily?.enabled) {
    return {
      providerName: 'tavily',
      providerReason: tavilyConfigured
        ? 'Tavily selected as primary enabled provider.'
        : 'Tavily selected as primary provider, but API key is missing.',
      fallbackEnabled,
      tavilyConfigured,
      fallbackProvider: fallbackEnabled ? 'bing_rss' : undefined,
    };
  }

  if (fallbackEnabled) {
    return {
      providerName: 'bing_rss',
      providerReason: 'Tavily disabled; Bing RSS fallback explicitly enabled.',
      fallbackEnabled,
      tavilyConfigured,
    };
  }

  return {
    providerName: 'tavily',
    providerReason: 'No enabled fallback provider; Tavily remains required primary provider.',
    fallbackEnabled: false,
    tavilyConfigured,
  };
}

export function readProviderRegistry(): ProviderRegistry {
  if (!fs.existsSync(providerRegistryPath)) {
    throw new Error(`Provider registry not found: ${path.relative(process.cwd(), providerRegistryPath)}`);
  }
  return JSON.parse(fs.readFileSync(providerRegistryPath, 'utf8')) as ProviderRegistry;
}

export function readProviderGuardrails(): TavilyProviderGuardrails {
  if (!fs.existsSync(providerGuardrailsPath)) {
    throw new Error(`Provider guardrails not found: ${path.relative(process.cwd(), providerGuardrailsPath)}`);
  }
  return JSON.parse(fs.readFileSync(providerGuardrailsPath, 'utf8')) as TavilyProviderGuardrails;
}

export function providerByName(providers: ProviderConfig[], providerName: ProviderName): ProviderConfig | undefined {
  return providers.find((provider) => provider.providerName === providerName);
}
