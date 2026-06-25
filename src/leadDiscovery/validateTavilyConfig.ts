import fs = require('fs');
import path = require('path');
import { getTavilyRuntimeConfig } from '../integrations/tavily/tavilyClient';
import { providerByName, readProviderGuardrails, readProviderRegistry, selectSearchProvider } from './providerRouter';

interface TavilyHealthReport {
  generatedAt: string;
  apiKeyConfigured: boolean;
  providerEnabled: boolean;
  providerSelected: string;
  fallbackEnabled: boolean;
  healthStatus: 'healthy' | 'missing_api_key' | 'disabled' | 'degraded';
  recommendations: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics');
const markdownPath = path.join(outputDir, 'tavily-health.md');
const jsonPath = path.join(outputDir, 'tavily-health.json');

export function validateTavilyConfig(now = new Date()): TavilyHealthReport {
  const generatedAt = now.toISOString();
  const runtime = getTavilyRuntimeConfig();
  const registry = readProviderRegistry();
  const guardrails = readProviderGuardrails();
  const selection = selectSearchProvider();
  const tavily = providerByName(registry.providers, 'tavily');
  const fallback = providerByName(registry.providers, 'bing_rss');
  const providerEnabled = Boolean(tavily?.enabled);
  const fallbackEnabled = Boolean(guardrails.fallbackEnabled && fallback?.enabled);
  const recommendations = recommendationsFor(runtime.hasApiKey, providerEnabled, selection.providerName, fallbackEnabled);
  const report: TavilyHealthReport = {
    generatedAt,
    apiKeyConfigured: runtime.hasApiKey,
    providerEnabled,
    providerSelected: selection.providerName,
    fallbackEnabled,
    healthStatus: healthStatusFor(runtime.hasApiKey, providerEnabled, selection.providerName),
    recommendations,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function healthStatusFor(apiKeyConfigured: boolean, providerEnabled: boolean, providerSelected: string): TavilyHealthReport['healthStatus'] {
  if (!providerEnabled) return 'disabled';
  if (!apiKeyConfigured) return 'missing_api_key';
  if (providerSelected !== 'tavily') return 'degraded';
  return 'healthy';
}

function recommendationsFor(apiKeyConfigured: boolean, providerEnabled: boolean, providerSelected: string, fallbackEnabled: boolean): string[] {
  const recommendations: string[] = [];
  if (!providerEnabled) recommendations.push('Enable Tavily in data/lead-discovery/providers/providers.json before production lead discovery.');
  if (!apiKeyConfigured) recommendations.push('Set TAVILY_API_KEY in local .env or .env.local. Do not commit the key.');
  if (providerSelected !== 'tavily') recommendations.push('Review provider router: Tavily should be the selected primary provider.');
  if (fallbackEnabled) recommendations.push('Fallback is enabled. Keep it disabled unless manually troubleshooting Tavily availability.');
  if (recommendations.length === 0) recommendations.push('Tavily primary provider configuration is ready for controlled search.');
  return recommendations;
}

function renderMarkdown(report: TavilyHealthReport): string {
  return `# Tavily Health

Generated: ${report.generatedAt}

- API key configured: ${report.apiKeyConfigured ? 'yes' : 'no'}
- Tavily provider enabled: ${report.providerEnabled ? 'yes' : 'no'}
- Provider selected: ${report.providerSelected}
- Fallback enabled: ${report.fallbackEnabled ? 'yes' : 'no'}
- Health status: ${report.healthStatus}

## Recommendations

${report.recommendations.map((recommendation) => `- ${recommendation}`).join('\n')}

Secrets are not logged. No search, scraping, login, contact extraction, or outreach was performed by this health check.
`;
}

function main(): void {
  try {
    const report = validateTavilyConfig();
    console.log(`Tavily health generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`Provider selected: ${report.providerSelected}`);
    console.log(`Health status: ${report.healthStatus}`);
    console.log('No secrets logged. Health check only.');
  } catch (error) {
    console.error('Tavily Health Check: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
