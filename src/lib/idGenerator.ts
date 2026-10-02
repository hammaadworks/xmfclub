import { encodeCrockford, decodeCrockford, normalizeCrockford } from './crockford';

export interface IdGeneratorOptions {
  joiningDate?: string | Date | null;
  customSuffix?: string | null;
  existingIds: string[]; // List of all member IDs in that prefix namespace
}

/**
 * Computes the next member ID following Douglas Crockford Base32 specifications.
 * Format: XMF + YY + ZZ (2-character Crockford suffix, starting from '01').
 * 
 * - Sequential allocation starts from '01' (1). '00' is reserved for custom assignment.
 * - Uses "Lowest Unused Gap" allocation: if VIP takes 'ZZ', sequential allocation still picks '01', '02', etc.
 * - Custom / VIP allocation: Validates 2-character Crockford code (00 to ZZ) and checks for collision.
 * - Spillover: Automatically rolls over to 3 characters ('100' to 'ZZZ') ONLY when all 1,024 slots are full.
 */
export function computeNextMemberId(options: IdGeneratorOptions): string {
  const { joiningDate, customSuffix, existingIds } = options;

  let yearSuffix = String(new Date().getFullYear()).slice(-2);
  if (joiningDate) {
    const d = new Date(joiningDate);
    if (!isNaN(d.getTime())) {
      yearSuffix = String(d.getFullYear()).slice(-2);
    }
  }
  const prefix = `XMF${yearSuffix}`;

  // 1. Explicit Custom / VIP ID requested
  if (customSuffix && customSuffix.trim()) {
    const { valid, normalized, error } = normalizeCrockford(customSuffix.trim());
    if (!valid) {
      throw new Error(error || 'Invalid custom ID suffix.');
    }
    if (normalized.length !== 2) {
      throw new Error('Custom ID suffix must be exactly 2 characters (e.g. 00 to ZZ).');
    }

    const candidateId = `${prefix}${normalized}`;
    if (existingIds.some(id => id && id.toUpperCase() === candidateId.toUpperCase())) {
      throw new Error(`ID "${candidateId}" is already allocated. Please choose another ID.`);
    }

    return candidateId;
  }

  // 2. Default Sequential Crockford Base32 with Lowest Unused Gap
  const allocatedNumbers = new Set<number>();
  const upperPrefix = prefix.toUpperCase();
  for (const id of existingIds) {
    if (id && id.toUpperCase().startsWith(upperPrefix)) {
      const suffix = id.toUpperCase().slice(upperPrefix.length);
      const val = decodeCrockford(suffix);
      if (val >= 0) {
        allocatedNumbers.add(val);
      }
    }
  }

  // Search 2-character space from 1 (01) to 1023 (ZZ)
  for (let n = 1; n <= 1023; n++) {
    if (!allocatedNumbers.has(n)) {
      return `${prefix}${encodeCrockford(n, 2)}`;
    }
  }

  // Spillover to 3 characters: 1024 (100) to 32767 (ZZZ)
  for (let n = 1024; n <= 32767; n++) {
    if (!allocatedNumbers.has(n)) {
      return `${prefix}${encodeCrockford(n, 3)}`;
    }
  }

  throw new Error(`All ID spaces for year ${prefix} are completely full.`);
}
