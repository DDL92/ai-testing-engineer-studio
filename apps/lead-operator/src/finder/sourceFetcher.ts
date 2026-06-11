import fs = require('fs');
import http = require('http');
import https = require('https');
import path = require('path');
import { LeadSource } from '../types/lead';

export interface FetchedSource {
  source: LeadSource;
  content: string;
  warning?: string;
}

export async function fetchEnabledSources(sources: LeadSource[]): Promise<FetchedSource[]> {
  const results: FetchedSource[] = [];

  for (const source of sources.filter((item) => item.enabled)) {
    if (source.type === 'manual_json' || source.type === 'manual_text') {
      results.push(readManualSource(source));
      continue;
    }

    if (!source.url) {
      results.push({ source, content: '', warning: `Source ${source.id} is missing a URL.` });
      continue;
    }

    try {
      results.push({ source, content: await fetchPublicText(source.url) });
    } catch (error) {
      results.push({ source, content: '', warning: `${source.name}: ${error instanceof Error ? error.message : 'Unknown fetch error'}` });
    }
  }

  return results;
}

function readManualSource(source: LeadSource): FetchedSource {
  if (!source.path) return { source, content: '', warning: `Source ${source.id} is missing a path.` };
  const fullPath = path.join(process.cwd(), source.path);
  if (!fs.existsSync(fullPath)) return { source, content: '', warning: `Manual source not found: ${source.path}` };
  return { source, content: fs.readFileSync(fullPath, 'utf8') };
}

function fetchPublicText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const request = client.get(parsed, { timeout: 15000, headers: { 'User-Agent': 'AI-Testing-Engineer-Studio-Lead-Operator/1.0' } }, (response) => {
      if ((response.statusCode ?? 0) >= 400) {
        reject(new Error(`HTTP ${response.statusCode}`));
        response.resume();
        return;
      }

      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        data += chunk;
        if (data.length > 500000) request.destroy(new Error('Source too large for safe Sprint 1 fetch.'));
      });
      response.on('end', () => resolve(data));
    });

    request.on('timeout', () => request.destroy(new Error('Fetch timed out.')));
    request.on('error', reject);
  });
}
