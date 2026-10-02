/**
 * Douglas Crockford's Base32 Specification
 * Reference: https://www.crockford.com/base32.html
 * 
 * - 32 symbols: 0-9, A-Z (excluding I, L, O, U)
 * - Error-tolerant decode: 'O'/'o' -> '0', 'I'/'i'/'L'/'l' -> '1'
 * - 'U'/'u' excluded to avoid accidental obscenity
 * - Case-insensitive
 */

export const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const VALUE_MAP = new Map<string, number>();
for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  VALUE_MAP.set(CROCKFORD_ALPHABET[i], i);
}

// Decode mappings for error-tolerant human transcription
VALUE_MAP.set('O', 0);
VALUE_MAP.set('I', 1);
VALUE_MAP.set('L', 1);

/**
 * Normalizes user input into valid Crockford Base32 characters.
 * Replaces O -> 0, I/L -> 1, uppercases letters, and rejects invalid chars (including U).
 */
export function normalizeCrockford(input: string): { valid: boolean; normalized: string; error?: string } {
  if (!input) {
    return { valid: false, normalized: '', error: 'Input cannot be empty.' };
  }

  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, '');

  if (cleaned.includes('U')) {
    return { 
      valid: false, 
      normalized: '', 
      error: "Letter 'U' is excluded in Crockford Base32 to prevent accidental obscenities." 
    };
  }

  let normalized = '';
  for (const char of cleaned) {
    if (char === 'O') {
      normalized += '0';
    } else if (char === 'I' || char === 'L') {
      normalized += '1';
    } else if (VALUE_MAP.has(char)) {
      normalized += char;
    } else {
      return { 
        valid: false, 
        normalized: '', 
        error: `Invalid character '${char}'. Crockford Base32 allows 0-9 and A-Z (except I, L, O, U).` 
      };
    }
  }

  return { valid: true, normalized };
}

/**
 * Encodes a non-negative integer into Crockford Base32.
 * Pads with leading '0' to satisfy minLength (default 2).
 * Examples:
 *   0  -> "00"
 *   1  -> "01"
 *   31 -> "0Z"
 *   32 -> "10"
 *   1023 -> "ZZ"
 *   1024 -> "100" (spillover)
 */
export function encodeCrockford(num: number, minLength: number = 2): string {
  if (num < 0 || !Number.isInteger(num)) {
    throw new Error('Number must be a non-negative integer.');
  }

  if (num === 0) {
    return '0'.repeat(Math.max(1, minLength));
  }

  let result = '';
  let n = num;

  while (n > 0) {
    const remainder = n % 32;
    result = CROCKFORD_ALPHABET[remainder] + result;
    n = Math.floor(n / 32);
  }

  while (result.length < minLength) {
    result = '0' + result;
  }

  return result;
}

/**
 * Decodes a Crockford Base32 string into its integer value.
 * Performs automatic normalization (O->0, I/L->1).
 * Returns -1 if invalid.
 */
export function decodeCrockford(str: string): number {
  const { valid, normalized } = normalizeCrockford(str);
  if (!valid || normalized.length === 0) {
    return -1;
  }

  let result = 0;
  for (let i = 0; i < normalized.length; i++) {
    const val = VALUE_MAP.get(normalized[i]);
    if (val === undefined) return -1;
    result = result * 32 + val;
  }

  return result;
}
