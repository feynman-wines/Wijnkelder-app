import { KlimaatAdvies, Wine } from '../types/wine';

export interface KlimaatAdviesInfo {
  score: KlimaatAdvies;
  title: string;
  badgeClass: string;
  dotClass: string;
  description: string;
  sommelierRule: string;
}

export const KLIMAAT_SCHAAL: Record<KlimaatAdvies, KlimaatAdviesInfo> = {
  '++': {
    score: '++',
    title: 'Moet er écht in',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/80',
    dotClass: 'bg-emerald-400',
    description: 'Cruciale bewaarwijn (>5–15 jaar potentieel, kwetsbaar, houtgelagerd, subtiele tannines of zuren).',
    sommelierRule: 'Schommelingen in temperatuur of luchtvochtigheid veroorzaken voortijdige oxidatie en drogen de kurk uit.'
  },
  '+': {
    score: '+',
    title: 'Aanbevolen',
    badgeClass: 'bg-teal-950 text-teal-300 border-teal-600/70',
    dotClass: 'bg-teal-400',
    description: 'Kwaliteitswijn met 3–7 jaar drinkvenster; heeft baat bij stabiele omstandigheden.',
    sommelierRule: 'Verdient rust en gelijkmatige rijping voor maximale complexiteit.'
  },
  '+/-': {
    score: '+/-',
    title: 'Indien ruimte over',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-600/70',
    dotClass: 'bg-amber-400',
    description: 'Stevige wijn of kortere horizon (1–3 jaar). Kan een stabiele donkere kelder/trapkast prima verdragen.',
    sommelierRule: 'Plaats bij voorkeur in de klimaatkast als er plek is, maar niet ten koste van topwijnen.'
  },
  '-': {
    score: '-',
    title: 'Niet nodig',
    badgeClass: 'bg-stone-800 text-stone-300 border-stone-600',
    dotClass: 'bg-stone-400',
    description: 'Toegankelijke wijn die binnen 6–12 maanden wordt gedronken.',
    sommelierRule: 'Donkere, koele plek in huis volstaat ruimschoots; klimaatkastcapaciteit bewaren voor bewaarwijnen.'
  },
  '--': {
    score: '--',
    title: 'Plekverspilling',
    badgeClass: 'bg-rose-950 text-rose-300 border-rose-700',
    dotClass: 'bg-rose-400',
    description: 'Eenvoudige slobberwijn, aperitief voor komend weekend of zwaar versterkte wijn (Port/Madeira).',
    sommelierRule: 'Neemt onnodig kostbare klimaatruimte in beslag.'
  }
};

export function getKlimaatAdviesInfo(advies: KlimaatAdvies | string | undefined): KlimaatAdviesInfo {
  if (advies && advies in KLIMAAT_SCHAAL) {
    return KLIMAAT_SCHAAL[advies as KlimaatAdvies];
  }
  return KLIMAAT_SCHAAL['+/-'];
}

export function evaluateKlimaatAdvies(wine: Partial<Wine>): { advies: KlimaatAdvies; reden: string } {
  const type = wine.type || 'Rood';
  const score = Number(wine.score) || 0;
  const drinkenTot = String(wine.drinkenTot || '');
  const optimaal = String(wine.optimaal || '');
  const druif = String(wine.druif || '').toLowerCase();
  const streek = String(wine.streek || '').toLowerCase();
  const wijnhuis = String(wine.wijnhuis || '').toLowerCase();

  // Long aging indicators
  const hasLongHorizon = /203[0-9]|204[0-9]/.test(drinkenTot) || /203[0-9]|204[0-9]/.test(optimaal);
  const isPrestigious = /barolo|brunello|bordeaux|burgundy|bourgogne|cahors|priorat|rioja gran reserva|amarone|napa|mendoza/.test(streek + ' ' + wijnhuis);
  const isFragileGrape = /pinot noir|nebbiolo|riesling|chardonnay/.test(druif);

  if ((score >= 4.2 && hasLongHorizon) || (isPrestigious && hasLongHorizon) || (isFragileGrape && hasLongHorizon)) {
    return {
      advies: '++',
      reden: 'Hoge bewaarpotentieel (>8-15 jaar) en complexe structuur. Constante temperatuur (12–14 °C) en trillingsvrij bewaren is essentieel om kurkkwaliteit en subtiele aroma’s te beschermen.'
    };
  }

  if (hasLongHorizon || score >= 4.0 || isPrestigious) {
    return {
      advies: '+',
      reden: 'Kwaliteitswijn met rijpingspotentieel tot voorbij 2030. Heeft baat bij een stabiel klimaat om vroegtijdige veroudering door temperatuurschommelingen tegen te gaan.'
    };
  }

  if (type === 'Rood' && !hasLongHorizon) {
    return {
      advies: '+/-',
      reden: 'Robuuste rode wijn voor consumptie binnen 2–3 jaar. Kan gerust op een koele, donkere plek liggen indien de klimaatkast vol is.'
    };
  }

  if (type.includes('Wit') || type.includes('rosé')) {
    return {
      advies: '-',
      reden: 'Frisse drinkwijn zonder lange houtlagering; bedoeld voor vlot genot binnen 1 jaar. Koel bewaren, maar klimaatkast niet noodzakelijk.'
    };
  }

  return {
    advies: '-',
    reden: 'Binnen 12 maanden drinken; stabiele kamertemperatuur of koele provisiekast volstaat.'
  };
}
