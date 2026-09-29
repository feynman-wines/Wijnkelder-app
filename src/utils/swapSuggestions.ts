import { Wine } from '../types/wine';
import { getWineDrinkStatus } from './drinkStatus';

export interface SwapCandidate {
  wine: Wine;
  plank: string;
  reason: string;
  badge: string;
  priorityScore: number;
}

/**
 * Evaluates which bottles in the climate cabinet can best be moved out
 * (to "Donker / Rustig" or consumed soon) to make room for new high-potential aging wines.
 */
export function getCabinetSwapCandidates(wines: Wine[]): SwapCandidate[] {
  const inCabinet = wines.filter(w => {
    const p = String(w.plank ?? '').trim();
    return p !== '' && (Number(w.aantal) || 0) > 0;
  });

  const candidates: SwapCandidate[] = inCabinet.map(wine => {
    const status = getWineDrinkStatus(wine);
    const endYear = status.endYear || 9999;
    const adv = wine.klimaatAdvies || '+/-';
    const plankStr = String(wine.plank);

    let priorityScore = 0;
    let reason = '';
    let badge = '';

    // Category 1: Originally tagged as "-" (stored in cabinet because there was space)
    if (adv === '-') {
      priorityScore = 1000 - endYear;
      badge = 'Opvulwijn (-)';
      reason = `Ligt in de kast als extra benutting (advies -). Kan zonder kwaliteitsverlies naar donker/rustig verhuisd worden.`;
    }
    // Category 2: Neutral advice (+/-) with earlier drinking window (2028–2030)
    else if (adv === '+/-') {
      priorityScore = 500 - endYear;
      badge = `Drinkvenster ${endYear} (+/-)`;
      reason = `Drinkhorizon eindigt in ${endYear}. Kan binnenkort gedronken worden of naar donker/rustig.`;
    }
    // Category 3: Urgent or expired wines
    else if (status.status === 'urgent' || status.status === 'expired' || endYear <= 2027) {
      priorityScore = 800 - endYear;
      badge = `Binnenkort drinken (${endYear})`;
      reason = `Nadert einde drinkvenster (${endYear}). Binnenkort ontkurken!`;
    }
    // Category 4: Standard wines with earlier maturity
    else {
      priorityScore = 100 - endYear;
      badge = `Tot ${endYear}`;
      reason = `Drinkvenster tot ${endYear}.`;
    }

    return {
      wine,
      plank: plankStr,
      reason,
      badge,
      priorityScore
    };
  });

  // Sort descending: highest priority to remove comes first
  return candidates.sort((a, b) => b.priorityScore - a.priorityScore);
}
