import { Wine } from '../types/wine';

/**
 * Normalizes a string for robust wine comparison (stripping diacritics, punctuation, common stopwords).
 */
function normalizeWineString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents (e.g. château -> chateau)
    .replace(/\bzeven\b/g, '7')
    .replace(/\bseven\b/g, '7')
    .replace(/\bacht\b/g, '8')
    .replace(/\beight\b/g, '8')
    .replace(/\bnegen\b/g, '9')
    .replace(/\bnine\b/g, '9')
    .replace(/\btien\b/g, '10')
    .replace(/\bten\b/g, '10')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bsint\b/g, 'st')
    .replace(/\bdomaine\b/g, '')
    .replace(/\bchateau\b/g, '')
    .replace(/\bwijngaard\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

export interface WineMatchResult {
  existingWine: Wine;
  isExactVintage: boolean;
  matchScore: number; // 0 to 1
}

/**
 * Finds if a new wine (entered or scanned) matches an existing wine in the cellar.
 */
export function findMatchingCellarWine(
  newWine: Partial<Wine>,
  cellarWines: Wine[]
): WineMatchResult | null {
  const newName = normalizeWineString(newWine.naam || '');
  const newHouse = normalizeWineString(newWine.wijnhuis || '');
  const newYear = newWine.jaar ? String(newWine.jaar).trim() : '';

  if (!newName || newName.length < 2) return null;

  const newCombined = `${newHouse} ${newName}`.trim();
  const newTokens = newName.split(' ').filter(t => t.length > 1);

  let bestMatch: WineMatchResult | null = null;
  let highestScore = 0;

  for (const existing of cellarWines) {
    const exName = normalizeWineString(existing.naam || '');
    const exHouse = normalizeWineString(existing.wijnhuis || '');
    const exCombined = `${exHouse} ${exName}`.trim();
    const exYear = existing.jaar ? String(existing.jaar).trim() : '';

    let score = 0;

    // Direct exact string matches
    if (exName === newName || exCombined === newCombined) {
      score = 1.0;
    } else if (exName.includes(newName) || newName.includes(exName)) {
      score = 0.9;
    } else if (exCombined.includes(newName) || newCombined.includes(exName)) {
      score = 0.85;
    } else {
      // Token overlap check
      const exTokens = exName.split(' ').filter(t => t.length > 1);
      const matchingTokens = newTokens.filter(t => exTokens.includes(t) || exCombined.includes(t));
      if (newTokens.length > 0 && matchingTokens.length === newTokens.length) {
        score = 0.8;
      } else if (matchingTokens.length >= 2 || (newTokens.length === 1 && matchingTokens.length === 1 && newTokens[0].length >= 4)) {
        score = 0.7;
      }
    }

    if (score >= 0.7) {
      const isExactVintage = Boolean(newYear && exYear && newYear === exYear);
      // Give slight priority to matching vintage
      const finalScore = score + (isExactVintage ? 0.05 : 0);

      if (finalScore > highestScore) {
        highestScore = finalScore;
        bestMatch = {
          existingWine: existing,
          isExactVintage,
          matchScore: finalScore
        };
      }
    }
  }

  return bestMatch;
}
