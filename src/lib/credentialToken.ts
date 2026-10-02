import { encodeCrockford, decodeCrockford, normalizeCrockford, CROCKFORD_ALPHABET } from './crockford';

export const BATCH_SIZE = 32;

export interface BatchTokensResult {
  batchNumber: number;
  prefix: string;
  tokens: string[];
  startToken: string;
  endToken: string;
}

/**
 * Calculates exactly 32 tokens for a given batch number (starting at 0).
 * Prefix is encodeCrockford(batchNumber, 5).
 * Suffix cycles through CROCKFORD_ALPHABET ('0' through 'Z').
 */
export function calculateBatchTokens(batchNumber: number): BatchTokensResult {
  if (batchNumber < 0 || !Number.isInteger(batchNumber)) {
    throw new Error('Batch number must be a non-negative integer.');
  }

  // 5 characters for the batch index (supports 32^5 = 33,554,432 batches)
  const prefix = encodeCrockford(batchNumber, 5);
  const tokens: string[] = [];

  for (let i = 0; i < 32; i++) {
    tokens.push(`${prefix}${CROCKFORD_ALPHABET[i]}`);
  }

  return {
    batchNumber,
    prefix,
    tokens,
    startToken: tokens[0],
    endToken: tokens[31],
  };
}

/**
 * Extracts batch number and item index from a 6-character token.
 */
export function parseCredentialToken(token: string): { valid: boolean; batchNumber?: number; itemIndex?: number; normalized?: string } {
  const { valid, normalized } = normalizeCrockford(token);
  if (!valid || normalized.length !== 6) {
    return { valid: false };
  }

  const batchPrefix = normalized.slice(0, 5);
  const itemChar = normalized.slice(5, 6);

  const batchNumber = decodeCrockford(batchPrefix);
  const itemIndex = decodeCrockford(itemChar);

  if (batchNumber < 0 || itemIndex < 0) {
    return { valid: false };
  }

  return { valid: true, batchNumber, itemIndex, normalized };
}

export const CANONICAL_CREDENTIAL_BASE_URL = 'https://www.xmfclub.com';

/**
 * Generates the canonical resolution URL for QR codes and NFC tags.
 * Mandatory format: https://www.xmfclub.com/<qrc_or_tag>/<tokens_code>
 */
export function buildCredentialUrl(
  type: 'qrc' | 'tag',
  token: string,
  baseUrl = CANONICAL_CREDENTIAL_BASE_URL
): string {
  const { valid, normalized } = normalizeCrockford(token);
  if (!valid) throw new Error(`Invalid credential token: ${token}`);
  return `${baseUrl}/${type}/${normalized}`;
}

/**
 * Exports batch credentials as a CSV string
 */
export function exportBatchCsv(
  type: 'qrc' | 'tag',
  tokens: string[],
  batchNumber: number,
  baseUrl = CANONICAL_CREDENTIAL_BASE_URL
): string {
  const rows = ['Index,Sequence,Token,Type,URL'];
  tokens.forEach((t, i) => {
    const seq = `#${(batchNumber * 32 + i + 1).toString().padStart(4, '0')}`;
    const url = buildCredentialUrl(type, t, baseUrl);
    rows.push(`${i + 1},"${seq}","${t}","${type}","${url}"`);
  });
  return rows.join('\n');
}

/**
 * Exports batch credentials as a JSON string
 */
export function exportBatchJson(
  type: 'qrc' | 'tag',
  tokens: string[],
  batchNumber: number,
  baseUrl = CANONICAL_CREDENTIAL_BASE_URL
): string {
  return JSON.stringify(
    {
      type,
      batchNumber,
      batchNumberPadded: batchNumber.toString().padStart(5, '0'),
      quantity: tokens.length,
      startToken: tokens[0] || '',
      endToken: tokens[tokens.length - 1] || '',
      exportedAt: new Date().toISOString(),
      baseUrl,
      items: tokens.map((t, i) => ({
        index: i + 1,
        sequence: `#${(batchNumber * 32 + i + 1).toString().padStart(4, '0')}`,
        token: t,
        url: buildCredentialUrl(type, t, baseUrl),
      })),
    },
    null,
    2
  );
}
