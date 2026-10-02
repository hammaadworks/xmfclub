import { describe, it, expect } from 'vitest';
import {
  calculateBatchTokens,
  parseCredentialToken,
  buildCredentialUrl,
  exportBatchCsv,
  exportBatchJson,
  BATCH_SIZE,
} from './credentialToken';

describe('Credential Token Generator', () => {
  it('should generate 32 tokens for batch 0', () => {
    const result = calculateBatchTokens(0);
    expect(result.batchNumber).toBe(0);
    expect(result.prefix).toBe('00000');
    expect(result.tokens).toHaveLength(BATCH_SIZE);
    expect(result.startToken).toBe('000000');
    expect(result.endToken).toBe('00000Z');
  });

  it('should generate 32 tokens for batch 1', () => {
    const result = calculateBatchTokens(1);
    expect(result.batchNumber).toBe(1);
    expect(result.prefix).toBe('00001');
    expect(result.tokens).toHaveLength(BATCH_SIZE);
    expect(result.startToken).toBe('000010');
    expect(result.endToken).toBe('00001Z');
  });

  it('should generate tokens for batch 1024', () => {
    const result = calculateBatchTokens(1024);
    expect(result.batchNumber).toBe(1024);
    expect(result.prefix).toBe('00100'); // 1024 in base32 is 100, padded to 5 chars: 00100
    expect(result.tokens).toHaveLength(BATCH_SIZE);
    expect(result.startToken).toBe('001000');
    expect(result.endToken).toBe('00100Z');
  });

  it('should correctly parse a valid token', () => {
    const result = parseCredentialToken('000010');
    expect(result.valid).toBe(true);
    expect(result.batchNumber).toBe(1);
    expect(result.itemIndex).toBe(0);
    expect(result.normalized).toBe('000010');
  });

  it('should reject an invalid token', () => {
    const result = parseCredentialToken('00001U'); // U is invalid
    expect(result.valid).toBe(false);
  });

  it('should build a valid credential URL', () => {
    const url = buildCredentialUrl('qrc', '000010', 'https://www.xmfclub.com');
    expect(url).toBe('https://www.xmfclub.com/qrc/000010');
  });

  it('should default to mandatory canonical URL https://www.xmfclub.com/<type>/<token>', () => {
    const qrcUrl = buildCredentialUrl('qrc', '000010');
    expect(qrcUrl).toBe('https://www.xmfclub.com/qrc/000010');
    const tagUrl = buildCredentialUrl('tag', '000010');
    expect(tagUrl).toBe('https://www.xmfclub.com/tag/000010');
  });

  it('should export batch as CSV', () => {
    const { tokens } = calculateBatchTokens(0);
    const csv = exportBatchCsv('tag', tokens, 0, 'https://xmfclub.com');
    expect(csv).toContain('Index,Sequence,Token,Type,URL');
    expect(csv).toContain('1,"#0001","000000","tag","https://xmfclub.com/tag/000000"');
  });

  it('should export batch as JSON', () => {
    const { tokens } = calculateBatchTokens(0);
    const jsonStr = exportBatchJson('tag', tokens, 0, 'https://xmfclub.com');
    const parsed = JSON.parse(jsonStr);
    expect(parsed.quantity).toBe(32);
    expect(parsed.items).toHaveLength(32);
    expect(parsed.items[0].token).toBe('000000');
  });
});
