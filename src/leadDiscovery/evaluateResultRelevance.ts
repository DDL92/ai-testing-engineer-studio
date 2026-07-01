import fs = require('fs');
import path = require('path');
import { ResultRelevance, ResultRelevanceEvaluation } from './relevanceTypes';

interface BlockedDomainEntry {
  domain: string;
  category: ResultRelevance | string;
}

interface BlocklistFile {
  blockedDomains: BlockedDomainEntry[];
}

export interface ResultRelevanceInput {
  clientId: string;
  sourceUrl: string;
  sourceName: string;
  sourceCategory: string;
  title: string;
  snippet: string;
}

const blocklistDir = path.join(process.cwd(), 'data', 'lead-discovery', 'blocklists');
const titleBlockers = /\b(definition|meaning|synonyms?|grammar|dictionary|wikipedia|thesaurus)\b/i;
const referenceSignals = /\b(wiki|history|television|movie|streaming|encyclopedia|biography|cast|episode)\b/i;
const directorySignals = /\b(directory|list of|top rated|best of|reviews|charity navigator|guidestar|greatnonprofits)\b/i;
const marketplaceSignals = /\b(marketplace|vendors?|vendor profile|find vendors?|the knot|weddingwire|zola|eventective)\b/i;
const vendorSignals = /\b(catering company|catering companies|caterer profile|restaurant|venue|official website|service provider)\b/i;
const discussionPathSignals = /\b(forum|forums|wedding-forums|boards|discussion|thread|community|groups)\b/i;
const listingPathSignals = /\b(vendor|vendors|marketplace|profile|directory|listing|pricing|reviews?)\b/i;

export function evaluateResultRelevance(input: ResultRelevanceInput): ResultRelevanceEvaluation {
  const host = hostFor(input.sourceUrl);
  const urlPath = pathFor(input.sourceUrl);
  const discussionPageAllowed = isAllowedDiscussionPage(host, urlPath, input.sourceName, input.sourceCategory);
  const blocklistHit = findBlockedDomain(host, input.clientId);
  if (blocklistHit && !discussionPageAllowed) {
    const relevance = categoryToRelevance(blocklistHit.category);
    return {
      resultRelevance: relevance,
      relevanceReasons: [`blocked domain: ${blocklistHit.domain}`, `domain category: ${blocklistHit.category}`],
      domainBlocked: true,
      domainCategory: String(blocklistHit.category),
    };
  }

  const text = `${input.title} ${input.snippet} ${input.sourceName} ${input.sourceCategory} ${host}`;
  const title = input.title;
  if (titleBlockers.test(title)) return decision('definition_page', ['title indicates definition, dictionary, grammar, wiki, or thesaurus page']);
  if (!discussionPageAllowed && marketplaceSignals.test(text)) return decision('marketplace', ['result appears to be a vendor marketplace']);
  if (directorySignals.test(text)) return decision('directory', ['result appears to be a directory or generic list']);
  if (vendorSignals.test(text)) return decision('vendor', ['result appears to represent a vendor, venue, or service provider']);
  if (referenceSignals.test(text)) return decision('reference_page', ['result appears to be reference, entertainment, or generic information content']);

  const buyerSignals = /\b(looking for|need|needed|recommend|recommendations|anyone know|seeking|searching|planning a wedding|planning event|corporate event catering|charity event catering|private dinner catering|need bar service|event rentals needed|food service needed)\b/i;
  if (buyerSignals.test(`${input.title} ${input.snippet}`)) {
    return {
      resultRelevance: 'relevant',
      relevanceReasons: ['result title or snippet indicates buyer intent'],
      domainBlocked: false,
      domainCategory: 'none',
    };
  }

  return {
    resultRelevance: 'likely_irrelevant',
    relevanceReasons: ['result title and snippet do not show buyer intent'],
    domainBlocked: false,
    domainCategory: 'none',
  };
}

function decision(resultRelevance: ResultRelevance, relevanceReasons: string[]): ResultRelevanceEvaluation {
  return {
    resultRelevance,
    relevanceReasons,
    domainBlocked: false,
    domainCategory: 'none',
  };
}

function findBlockedDomain(host: string, clientId: string): BlockedDomainEntry | null {
  const entries = [
    ...readBlocklist('global-blocked-domains.json'),
    ...(clientId === 'flora_and_fauna_foods_001' ? readBlocklist('flora-blocked-domains.json') : []),
  ];
  return entries.find((entry) => host === entry.domain || host.endsWith(`.${entry.domain}`)) ?? null;
}

function readBlocklist(fileName: string): BlockedDomainEntry[] {
  const filePath = path.join(blocklistDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  return (JSON.parse(fs.readFileSync(filePath, 'utf8')) as BlocklistFile).blockedDomains;
}

function categoryToRelevance(category: string): ResultRelevance {
  if (category === 'definition_page') return 'definition_page';
  if (category === 'reference_page') return 'reference_page';
  if (category === 'directory') return 'directory';
  if (category === 'vendor') return 'vendor';
  if (category === 'marketplace') return 'marketplace';
  return 'blocked_domain';
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

function pathFor(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function isAllowedDiscussionPage(host: string, urlPath: string, sourceName: string, sourceCategory: string): boolean {
  const text = `${host} ${urlPath} ${sourceName} ${sourceCategory}`.toLowerCase();
  if (!discussionPathSignals.test(text)) return false;
  if (listingPathSignals.test(urlPath.replace(/wedding-forums/g, ''))) return false;
  return true;
}
