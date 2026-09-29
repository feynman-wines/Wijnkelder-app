import { Wine, DrinkStatus, DrinkStatusInfo } from '../types/wine';

export function extractYears(textVal: string | number | undefined | null): number[] {
  if (!textVal) return [];
  const str = String(textVal);
  const matches = str.match(/20\d{2}/g);
  return matches ? matches.map(Number) : [];
}

export function getWineDrinkStatus(wine: Wine, currentYear: number = new Date().getFullYear()): DrinkStatusInfo {
  const optimalYears = extractYears(wine.optimaal);
  const drinkenTotYears = extractYears(wine.drinkenTot);

  const startOptimal = optimalYears.length > 0 ? Math.min(...optimalYears) : undefined;
  const endOptimal = optimalYears.length > 0 ? Math.max(...optimalYears) : undefined;
  const absoluteEnd = drinkenTotYears.length > 0 ? Math.max(...drinkenTotYears) : endOptimal;

  // 1. Expired check
  if (absoluteEnd && absoluteEnd < currentYear) {
    return {
      status: 'expired',
      label: 'Drinkvenster voorbij',
      badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800/60',
      subtext: `Was drinkbaar tot ${absoluteEnd}`,
      reason: `Het drinkvenster (${wine.drinkenTot || wine.optimaal}) is verstreken. Drink deze fles zo spoedig mogelijk.`,
      startYear: startOptimal,
      endYear: absoluteEnd,
      isNearingEnd: true,
      yearsRemaining: 0
    };
  }

  // 2. Urgent check: Last year of optimal window or absolute end
  const effectiveEnd = endOptimal || absoluteEnd;
  if (effectiveEnd && effectiveEnd === currentYear) {
    return {
      status: 'urgent',
      label: 'Drink dit jaar (2026)',
      badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-600 animate-pulse',
      subtext: `Laatste jaar optimaal (${effectiveEnd})`,
      reason: `Dit is het laatste optimale drinkjaar (${effectiveEnd}). Voorkom dat de wijn over zijn piek heengaat!`,
      startYear: startOptimal,
      endYear: effectiveEnd,
      isNearingEnd: true,
      yearsRemaining: 0
    };
  }

  // 3. Almost end check: Next 1-2 years
  if (effectiveEnd && effectiveEnd <= currentYear + 2 && (startOptimal === undefined || startOptimal <= currentYear)) {
    const diff = effectiveEnd - currentYear;
    return {
      status: 'almost_end',
      label: diff === 1 ? 'Nog 1 jaar optimaal' : 'Nog 2 jaar optimaal',
      badgeClass: 'bg-orange-950/80 text-orange-300 border-orange-700/60',
      subtext: `Drinkperiode tot ${effectiveEnd}`,
      reason: `De wijn nadert het einde van zijn optimale venster (${effectiveEnd}). Plan in voor dit of volgend seizoen.`,
      startYear: startOptimal,
      endYear: effectiveEnd,
      isNearingEnd: true,
      yearsRemaining: diff
    };
  }

  // 4. Too young / not reached start yet
  if (startOptimal && currentYear < startOptimal) {
    const diff = startOptimal - currentYear;
    return {
      status: 'too_young',
      label: `Laten rusten (vanaf ${startOptimal})`,
      badgeClass: 'bg-stone-800 text-stone-300 border-stone-700',
      subtext: `Nog ${diff} jaar te vroeg`,
      reason: `Nog niet op dronk. Bewaarvenster start in ${startOptimal}. Zuren en tannines hebben tijd nodig.`,
      startYear: startOptimal,
      endYear: effectiveEnd,
      isNearingEnd: false,
      yearsRemaining: effectiveEnd ? effectiveEnd - currentYear : undefined
    };
  }

  // 5. In optimal window - distinguishes early maturation (like Bramare 2021: 2026-2038) vs true peak
  if (startOptimal && endOptimal) {
    const totalSpan = endOptimal - startOptimal;
    
    // If wine has a long aging potential (7+ years) and we are in the first 25% or first 2 years
    if (totalSpan >= 7 && (currentYear - startOptimal) <= 2) {
      const peakEstimatedStart = startOptimal + Math.round(totalSpan * 0.35);
      const peakEstimatedEnd = startOptimal + Math.round(totalSpan * 0.75);
      return {
        status: 'maturing',
        label: 'Laten rijpen (nog jong)',
        badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60',
        subtext: `Piek verwacht ${peakEstimatedStart}–${peakEstimatedEnd}`,
        reason: `Krachtige bewaarwijn met een venster van ${totalSpan} jaar (${startOptimal}–${endOptimal}). Nu al drinkbaar (evt. decanteren), maar ontwikkelt over 4–8 jaar pas zijn ware diepgang en tertiaire aroma's.`,
        startYear: startOptimal,
        endYear: endOptimal,
        isNearingEnd: false,
        yearsRemaining: endOptimal - currentYear
      };
    }
  }

  // Default: Peak maturity
  return {
    status: 'peak',
    label: 'Nu op dronk',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    subtext: effectiveEnd ? `Optimaal tot ${effectiveEnd}` : 'Drinkrijp',
    reason: `Zit perfect in zijn ideale drinkvenster. De balans tussen fruit, zuren en tannines is optimaal.`,
    startYear: startOptimal,
    endYear: effectiveEnd,
    isNearingEnd: false,
    yearsRemaining: effectiveEnd ? effectiveEnd - currentYear : undefined
  };
}

export function isNuInteressant(wine: Wine, currentYear: number = new Date().getFullYear()): { interesting: boolean; reason: string } {
  if (wine.aantal <= 0) return { interesting: false, reason: '' };
  
  const statusInfo = getWineDrinkStatus(wine, currentYear);

  // CRITICAL RULE: If status is 'maturing' or 'too_young' (like Bramare), it is NOT in "Nu interessant"
  if (statusInfo.status === 'maturing' || statusInfo.status === 'too_young') {
    return { interesting: false, reason: '' };
  }

  // 1. Expired or Urgent (must drink to prevent waste)
  if (statusInfo.status === 'expired') {
    return {
      interesting: true,
      reason: `⚠️ Drinkvenster is verstreken (${wine.drinkenTot || wine.optimaal}). Drink als eerste!`
    };
  }

  if (statusInfo.status === 'urgent') {
    return {
      interesting: true,
      reason: `🚨 Nadert einde: 2026 is het laatste optimale drinkjaar!`
    };
  }

  if (statusInfo.status === 'almost_end') {
    return {
      interesting: true,
      reason: `⏳ Binnenkort drinken: nadert het einde van zijn venster (${statusInfo.endYear}).`
    };
  }

  // 2. Favorite and at Peak
  if (wine.favorite && statusInfo.status === 'peak') {
    return {
      interesting: true,
      reason: `★ Jouw favoriet én nu op het absolute hoogtepunt van smaak!`
    };
  }

  // 3. High Vivino score (>= 4.2) and at Peak
  const scoreNum = Number(wine.score) || 0;
  if (scoreNum >= 4.2 && statusInfo.status === 'peak') {
    return {
      interesting: true,
      reason: `Topscore Vivino (${scoreNum.toFixed(1)}) en nu perfect op dronk.`
    };
  }

  // 4. Multiple bottles and at Peak
  if (statusInfo.status === 'peak' && wine.aantal >= 3) {
    return {
      interesting: true,
      reason: `Volledig op dronk en ruime voorraad (${wine.aantal} flessen). Ideaal voor diner.`
    };
  }

  return { interesting: false, reason: '' };
}
