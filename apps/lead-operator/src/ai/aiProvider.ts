import { getAiCopyConfig, isAiCopyActive } from './aiConfig';
import { deterministicOptimize } from './deterministicFallback';
import { MessageOptimizationInput, buildOptimizerPrompt } from './promptTemplates';

export interface ProviderResult {
  content: string;
  aiEnabled: boolean;
  provider: string;
  model: string;
  warnings: string[];
}

export async function optimizeWithProvider(input: MessageOptimizationInput): Promise<ProviderResult> {
  const config = getAiCopyConfig();
  if (!isAiCopyActive(config)) {
    return {
      content: deterministicOptimize(input),
      aiEnabled: false,
      provider: 'deterministic',
      model: 'deterministic-fallback',
      warnings: config.warnings,
    };
  }

  try {
    const content = await callOpenAi(buildOptimizerPrompt(input), config.apiKey!, config.model);
    return {
      content: content.trim() || deterministicOptimize(input),
      aiEnabled: true,
      provider: 'openai',
      model: config.model,
      warnings: config.warnings,
    };
  } catch (error) {
    return {
      content: deterministicOptimize(input),
      aiEnabled: false,
      provider: 'deterministic',
      model: 'deterministic-fallback',
      warnings: [...config.warnings, `OpenAI optimization failed: ${error instanceof Error ? error.message : String(error)}. Used deterministic fallback.`],
    };
  }
}

async function callOpenAi(prompt: string, apiKey: string, model: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You improve human-reviewed B2B QA automation outreach copy. Return only the optimized message body.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) throw new Error(`OpenAI API returned ${response.status}`);
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return payload.choices?.[0]?.message?.content ?? '';
}
