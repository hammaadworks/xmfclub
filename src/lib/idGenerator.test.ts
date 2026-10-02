import { describe, it, expect } from 'vitest';
import { computeNextMemberId } from './idGenerator';
import { encodeCrockford } from './crockford';

describe('computeNextMemberId', () => {
  const joiningDate = '2026-04-15';

  it('starts at 01 when no members exist in that year', () => {
    const id = computeNextMemberId({
      joiningDate,
      existingIds: [],
    });
    expect(id).toBe('XMF2601');
  });

  it('allocates the next sequential number', () => {
    const id = computeNextMemberId({
      joiningDate,
      existingIds: ['XMF2601'],
    });
    expect(id).toBe('XMF2602');
  });

  it('does NOT spill over if a VIP was assigned XMF26ZZ (high-water mark protection)', () => {
    // If VIP took ZZ (1023), sequential allocator must still assign 01!
    const id = computeNextMemberId({
      joiningDate,
      existingIds: ['XMF26ZZ'],
    });
    expect(id).toBe('XMF2601');
  });

  it('smoothly skips gaps taken by VIP members', () => {
    // Suppose 01, 02 are taken, and a VIP took 03
    const id = computeNextMemberId({
      joiningDate,
      existingIds: ['XMF2601', 'XMF2602', 'XMF2603'],
    });
    expect(id).toBe('XMF2604');
  });

  it('allows custom assignment of 00 if requested', () => {
    const id = computeNextMemberId({
      joiningDate,
      customSuffix: '00',
      existingIds: ['XMF2601'],
    });
    expect(id).toBe('XMF2600');
  });

  it('allows custom assignment of ZZ if free', () => {
    const id = computeNextMemberId({
      joiningDate,
      customSuffix: 'ZZ',
      existingIds: ['XMF2601'],
    });
    expect(id).toBe('XMF26ZZ');
  });

  it('throws error when custom ID is already allocated', () => {
    expect(() =>
      computeNextMemberId({
        joiningDate,
        customSuffix: 'ZZ',
        existingIds: ['XMF26ZZ'],
      })
    ).toThrow(/already allocated/);
  });

  it('normalizes custom ID input (e.g. lowercase, O->0, L->1)', () => {
    const id = computeNextMemberId({
      joiningDate,
      customSuffix: 'ol',
      existingIds: [],
    });
    expect(id).toBe('XMF2601'); // 'ol' -> '01'
  });

  it('rejects custom ID with U or invalid length', () => {
    expect(() =>
      computeNextMemberId({
        joiningDate,
        customSuffix: '2U',
        existingIds: [],
      })
    ).toThrow(/Letter 'U' is excluded/);

    expect(() =>
      computeNextMemberId({
        joiningDate,
        customSuffix: 'A',
        existingIds: [],
      })
    ).toThrow(/must be exactly 2 characters/);
  });

  it('spills over to 3 characters (100) only when all 1,023 2-character slots are full', () => {
    // Fill all 1 to 1023
    const allTwoCharIds: string[] = [];
    for (let i = 1; i <= 1023; i++) {
      allTwoCharIds.push(`XMF26${encodeCrockford(i, 2)}`);
    }

    const id = computeNextMemberId({
      joiningDate,
      existingIds: allTwoCharIds,
    });
    expect(id).toBe('XMF26100'); // 8 characters!
  });

  it('derives correct 2-digit year prefix from joining date', () => {
    const id2024 = computeNextMemberId({
      joiningDate: '2024-11-20',
      existingIds: [],
    });
    expect(id2024).toBe('XMF2401');

    const id2025 = computeNextMemberId({
      joiningDate: '2025-01-05',
      existingIds: [],
    });
    expect(id2025).toBe('XMF2501');
  });
});
