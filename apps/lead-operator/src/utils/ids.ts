import crypto = require('crypto');

export function stableId(...parts: string[]): string {
  return crypto.createHash('sha1').update(parts.join('|').toLowerCase()).digest('hex').slice(0, 12);
}
