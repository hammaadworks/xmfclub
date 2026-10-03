/**
 * Physical Hex UID Formatter & Validator
 * Supports 4-byte (8 hex characters) and 7-byte (14 hex characters) hardware UIDs
 * Standard colon delimiter: XX:XX:XX:XX or XX:XX:XX:XX:XX:XX:XX
 */

export interface HexUidValidationResult {
  valid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validates and formats a physical Hex UID into colon-separated uppercase pairs.
 * Accepts raw hex with or without colons, spaces, hyphens.
 */
export function formatAndValidateHexUid(input: string): HexUidValidationResult {
  if (!input || !input.trim()) {
    return {
      valid: false,
      formatted: '',
      error: 'Physical UID cannot be empty.',
    };
  }

  // Strip non-hex characters (keep only 0-9, A-F)
  const clean = input.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

  // Allow exactly 4-byte (8 hex chars) or 7-byte (14 hex chars)
  if (clean.length !== 8 && clean.length !== 14) {
    return {
      valid: false,
      formatted: input.trim(),
      error: `Physical UID must be 4-byte (8 hex digits) or 7-byte (14 hex digits). Current: ${clean.length} digits.`,
    };
  }

  // Format with standard colons: XX:XX:XX:XX or XX:XX:XX:XX:XX:XX:XX
  const parts = clean.match(/.{1,2}/g);
  const formatted = parts ? parts.join(':') : clean;

  return {
    valid: true,
    formatted,
  };
}

/**
 * Real-time formatter for onChange handlers.
 * Uppercases, strips invalid hex, caps at 14 hex characters, and inserts colons.
 */
export function autoFormatHexInput(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[^0-9A-Fa-f]/g, '').toUpperCase().slice(0, 14);
  const parts = clean.match(/.{1,2}/g) || [];
  return parts.join(':');
}
