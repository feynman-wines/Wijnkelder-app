export type WineType = 'Rood' | 'Wit & rosé' | 'Overig' | 'Mousserend' | 'Dessert';

export type KlimaatAdvies = '++' | '+' | '+/-' | '-' | '--';

export interface WineNote {
  id: string;
  date: string;
  score: string | number;
  dish?: string;
  occasion?: string;
  text: string;
}

export interface WineActivity {
  date: string;
  action: string;
  change?: number;
}

export interface Wine {
  id: string;
  naam: string;
  wijnhuis: string;
  druif: string;
  jaar: number | string;
  type: string;
  land: string;
  streek: string;
  alcohol: number | string;
  prijs: string;
  score: number | string;
  drinkenTot: string;
  optimaal: string;
  eten: string;
  opmerkingen: string;
  opslag: string;
  aantal: number;
  plank: number | string;
  temperatuur: string;
  favorite?: boolean;
  photo?: string;
  notes?: WineNote[];
  consumed?: number;
  archivedAt?: string;
  archiveDismissed?: boolean;
  addedAt?: string;
  activity?: WineActivity[];
  klimaatAdvies: KlimaatAdvies;
  klimaatReden: string;
  klimaatPrioriteit?: number | string;
}

export type DrinkStatus = 
  | 'urgent'      // Nadert einde dit jaar (2026) -> Drink eerst!
  | 'almost_end'  // Binnen 1-2 jaar einde drinkperiode (2027-2028)
  | 'peak'        // Nu optimaal op dronk
  | 'maturing'    // Laten rijpen (nog jong, bijv. Bramare 2021)
  | 'too_young'   // Nog te jong
  | 'expired';    // Drinkvenster verlopen (met spoed drinken)

export interface DrinkStatusInfo {
  status: DrinkStatus;
  label: string;
  badgeClass: string;
  subtext: string;
  reason: string;
  startYear?: number;
  endYear?: number;
  isNearingEnd: boolean;
  yearsRemaining?: number;
}
