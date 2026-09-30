// Helper utility to detect duplicate or similar Shipper names (e.g. AWARD SHIPPING vs AWARDS SHIPPING)

export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

export function getSimilarityScore(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  // Plural/singular checks like AWARD vs AWARDS
  if (s1.length >= 4 && s2.length >= 4 && (s1.includes(s2) || s2.includes(s1))) {
    return 0.88;
  }

  // Levenshtein distance algorithm
  const track = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return 1 - distance / maxLen;
}

export interface DuplicateGroup {
  originalName1: string;
  originalName2: string;
  similarity: number;
}

export function findDuplicateShipperNames(shipperNames: string[]): DuplicateGroup[] {
  const uniqueNames = Array.from(new Set(shipperNames.map((n) => n.trim()))).filter(Boolean);
  const duplicates: DuplicateGroup[] = [];

  for (let i = 0; i < uniqueNames.length; i++) {
    for (let j = i + 1; j < uniqueNames.length; j++) {
      const name1 = uniqueNames[i];
      const name2 = uniqueNames[j];
      const score = getSimilarityScore(name1, name2);

      if (score >= 0.75 && normalizeString(name1) !== normalizeString(name2)) {
        duplicates.push({
          originalName1: name1,
          originalName2: name2,
          similarity: score,
        });
      }
    }
  }

  return duplicates;
}
