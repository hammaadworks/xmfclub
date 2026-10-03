import { describe, it, expect } from 'vitest';
import { formatAndValidateHexUid, autoFormatHexInput } from './uidFormatter';

describe('uidFormatter', () => {
  describe('formatAndValidateHexUid', () => {
    it('formats valid 4-byte hex UID without delimiters', () => {
      const res = formatAndValidateHexUid('04A35B1C');
      expect(res.valid).toBe(true);
      expect(res.formatted).toBe('04:A3:5B:1C');
      expect(res.error).toBeUndefined();
    });

    it('formats valid 7-byte hex UID without delimiters', () => {
      const res = formatAndValidateHexUid('04A32B1C885D80');
      expect(res.valid).toBe(true);
      expect(res.formatted).toBe('04:A3:2B:1C:88:5D:80');
      expect(res.error).toBeUndefined();
    });

    it('handles lowercase hex and formats to uppercase', () => {
      const res = formatAndValidateHexUid('04a32b1c885d80');
      expect(res.valid).toBe(true);
      expect(res.formatted).toBe('04:A3:2B:1C:88:5D:80');
    });

    it('handles existing hyphens, spaces, and colons gracefully', () => {
      const res1 = formatAndValidateHexUid('04-a3-2b-1c-88-5d-80');
      expect(res1.valid).toBe(true);
      expect(res1.formatted).toBe('04:A3:2B:1C:88:5D:80');

      const res2 = formatAndValidateHexUid('04 a3 5b 1c');
      expect(res2.valid).toBe(true);
      expect(res2.formatted).toBe('04:A3:5B:1C');

      const res3 = formatAndValidateHexUid('04:A3:5B:1C');
      expect(res3.valid).toBe(true);
      expect(res3.formatted).toBe('04:A3:5B:1C');
    });

    it('rejects empty input', () => {
      const res = formatAndValidateHexUid('');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot be empty');
    });

    it('rejects invalid lengths (3-byte, 5-byte, 8-byte, etc.)', () => {
      const res3Byte = formatAndValidateHexUid('04A35B');
      expect(res3Byte.valid).toBe(false);
      expect(res3Byte.error).toContain('Current: 6 digits');

      const res5Byte = formatAndValidateHexUid('04A35B1C22');
      expect(res5Byte.valid).toBe(false);
      expect(res5Byte.error).toContain('Current: 10 digits');

      const res8Byte = formatAndValidateHexUid('04A35B1C885D80FF');
      expect(res8Byte.valid).toBe(false);
      expect(res8Byte.error).toContain('Current: 16 digits');
    });

    it('strips non-hex characters and evaluates length', () => {
      // 8 valid hex chars + invalid characters like 'G', 'Z', '!'
      const res = formatAndValidateHexUid('04G:A3Z:5B!:1C');
      expect(res.valid).toBe(true);
      expect(res.formatted).toBe('04:A3:5B:1C');
    });
  });

  describe('autoFormatHexInput', () => {
    it('formats incremental user input with colons', () => {
      expect(autoFormatHexInput('0')).toBe('0');
      expect(autoFormatHexInput('04')).toBe('04');
      expect(autoFormatHexInput('04a')).toBe('04:A');
      expect(autoFormatHexInput('04a3')).toBe('04:A3');
      expect(autoFormatHexInput('04a32b1c')).toBe('04:A3:2B:1C');
    });

    it('strips invalid characters on the fly', () => {
      expect(autoFormatHexInput('04ZX')).toBe('04');
      expect(autoFormatHexInput('04-A3')).toBe('04:A3');
    });

    it('limits output to 14 hex characters (7 bytes)', () => {
      const longInput = '04A32B1C885D80FFFF';
      const formatted = autoFormatHexInput(longInput);
      expect(formatted).toBe('04:A3:2B:1C:88:5D:80');
    });

    it('handles empty input', () => {
      expect(autoFormatHexInput('')).toBe('');
    });
  });
});
