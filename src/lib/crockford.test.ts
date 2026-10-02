import { describe, it, expect } from 'vitest';
import { 
  CROCKFORD_ALPHABET, 
  encodeCrockford, 
  decodeCrockford, 
  normalizeCrockford 
} from './crockford';

describe('Crockford Base32', () => {
  it('has exactly 32 unique symbols excluding I, L, O, U', () => {
    expect(CROCKFORD_ALPHABET.length).toBe(32);
    expect(CROCKFORD_ALPHABET).not.toContain('I');
    expect(CROCKFORD_ALPHABET).not.toContain('L');
    expect(CROCKFORD_ALPHABET).not.toContain('O');
    expect(CROCKFORD_ALPHABET).not.toContain('U');
  });

  describe('encodeCrockford', () => {
    it('encodes boundary values with default minLength 2', () => {
      expect(encodeCrockford(0)).toBe('00');
      expect(encodeCrockford(1)).toBe('01');
      expect(encodeCrockford(9)).toBe('09');
      expect(encodeCrockford(10)).toBe('0A');
      expect(encodeCrockford(31)).toBe('0Z');
      expect(encodeCrockford(32)).toBe('10');
      expect(encodeCrockford(1023)).toBe('ZZ');
    });

    it('spills over cleanly to 3 characters at 1024 (spillover case)', () => {
      expect(encodeCrockford(1024, 2)).toBe('100');
      expect(encodeCrockford(1025, 2)).toBe('101');
      expect(encodeCrockford(32767, 2)).toBe('ZZZ');
    });

    it('throws on negative numbers', () => {
      expect(() => encodeCrockford(-1)).toThrow();
    });
  });

  describe('decodeCrockford', () => {
    it('decodes standard numbers correctly', () => {
      expect(decodeCrockford('00')).toBe(0);
      expect(decodeCrockford('01')).toBe(1);
      expect(decodeCrockford('0A')).toBe(10);
      expect(decodeCrockford('0Z')).toBe(31);
      expect(decodeCrockford('10')).toBe(32);
      expect(decodeCrockford('ZZ')).toBe(1023);
      expect(decodeCrockford('100')).toBe(1024);
    });

    it('tolerates human transcription errors (O->0, I/L->1)', () => {
      expect(decodeCrockford('oo')).toBe(0);
      expect(decodeCrockford('OO')).toBe(0);
      expect(decodeCrockford('0O')).toBe(0);
      expect(decodeCrockford('0i')).toBe(1);
      expect(decodeCrockford('0L')).toBe(1);
      expect(decodeCrockford('1l')).toBe(33); // 1 * 32 + 1 = 33
    });

    it('returns -1 for invalid inputs', () => {
      expect(decodeCrockford('UU')).toBe(-1);
      expect(decodeCrockford('!@')).toBe(-1);
      expect(decodeCrockford('')).toBe(-1);
    });
  });

  describe('normalizeCrockford', () => {
    it('normalizes valid strings and converts case', () => {
      const res = normalizeCrockford('a9');
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('A9');
    });

    it('corrects O and I/L', () => {
      const res = normalizeCrockford('ol');
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('01');
    });

    it('rejects U with clear helpful error', () => {
      const res = normalizeCrockford('2U');
      expect(res.valid).toBe(false);
      expect(res.error).toContain("Letter 'U' is excluded");
    });

    it('rejects invalid symbols', () => {
      const res = normalizeCrockford('2$');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Invalid character');
    });
  });

  describe('Round-trip verification', () => {
    it('correctly round-trips integers from 0 to 2000', () => {
      for (let i = 0; i <= 2000; i++) {
        const encoded = encodeCrockford(i, 2);
        const decoded = decodeCrockford(encoded);
        expect(decoded).toBe(i);
      }
    });
  });
});
