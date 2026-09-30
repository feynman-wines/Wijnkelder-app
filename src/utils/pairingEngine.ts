import { Wine } from '../types/wine';
import { getWineDrinkStatus } from './drinkStatus';

export interface PairingResult {
  wine: Wine;
  score: number;
  culinaryReason: string;
  matchReasons: string[];
  serveertip?: string;
  caveat?: string;
  isGoodMatch: boolean;
}

interface DishProfile {
  name: string;
  dishCategories: string[];
  preferredWineTypes: string[];
  discouragedWineTypes: string[];
  grapePreferences: string[];
  keywords: string[];
  flavorProfile: string;
}

const DISH_RULES: Record<string, DishProfile> = {
  lam: {
    name: 'Lamsvlees & Lamskotelet',
    dishCategories: [
      'lam', 'lams', 'lamskotelet', 'lamskoteletten', 'lamsrack', 'lamsbout',
      'lamsvlees', 'lamsstoof', 'lamsvleesschotel', 'lamsrug', 'couscous', 'parelcouscous'
    ],
    preferredWineTypes: ['Rood'],
    discouragedWineTypes: ['Wit & rosé'],
    grapePreferences: [
      'Merlot', 'Cabernet Sauvignon', 'Syrah', 'Shiraz', 'Cabernet Franc',
      'Tempranillo', 'Sangiovese', 'Grenache', 'Pinot Noir', 'Nebbiolo', 'Blaufränkisch', 'Lemberger'
    ],
    keywords: ['lamsvlees', 'lam', 'lams', 'rood vlees', 'gegrild vlees', 'kruidige sauzen', 'kruidige gerechten'],
    flavorProfile: 'hartig, sappig lamsvet en mediterrane specerijen'
  },
  mediterraan: {
    name: 'Mediterrane & Midden-Oosterse gerechten',
    dishCategories: [
      'couscous', 'parelcouscous', 'tajine', 'tahin', 'komijn', 'mediterraans',
      'falafel', 'gegrilde groenten', 'harissa', 'midden-oosters'
    ],
    preferredWineTypes: ['Rood', 'Wit & rosé'],
    discouragedWineTypes: [],
    grapePreferences: ['Syrah', 'Grenache', 'Tempranillo', 'Merlot', 'Viognier'],
    keywords: ['kruidige gerechten', 'gegrilde groenten', 'stoofschotels'],
    flavorProfile: 'kruidig, aards en aromatisch'
  },
  witvis: {
    name: 'Fijne witvis & platvis',
    dishCategories: ['witvis', 'kabeljauw', 'zeebaars', 'schol', 'tong', 'dorade', 'snoekbaars', 'heilbot'],
    preferredWineTypes: ['Wit & rosé'],
    discouragedWineTypes: ['Rood'],
    grapePreferences: ['Sauvignon Blanc', 'Chardonnay', 'Verdejo', 'Pinot Blanc', 'Riesling', 'Viognier', 'Grüner Veltliner', 'Albariño', 'Chenin Blanc'],
    keywords: ['vis', 'witvis', 'zeevruchten', 'gegrilde vis', 'gebakken vis', 'kabeljauw', 'zeebaars'],
    flavorProfile: 'fris, delicaat en mineraal'
  },
  vis: {
    name: 'Rijke vis & zalm',
    dishCategories: ['vis', 'forel', 'zalm', 'tonijn', 'visgerechten', 'makreel'],
    preferredWineTypes: ['Wit & rosé'],
    discouragedWineTypes: ['Rood'],
    grapePreferences: ['Chardonnay', 'Pinot Gris', 'Sauvignon Blanc', 'Viognier', 'Rosé'],
    keywords: ['vis', 'zalm', 'forel', 'tonijn'],
    flavorProfile: 'vette vis met zachte texturen'
  },
  schaaldieren: {
    name: 'Schaal- en schelpdieren',
    dishCategories: ['garnalen', 'kreeft', 'krab', 'oesters', 'mosselen', 'coquilles', 'scampi'],
    preferredWineTypes: ['Wit & rosé', 'Overig'],
    discouragedWineTypes: ['Rood'],
    grapePreferences: ['Chardonnay', 'Champagne', 'Sauvignon Blanc', 'Riesling'],
    keywords: ['zeevruchten', 'mosselen', 'schaaldieren', 'oesters'],
    flavorProfile: 'zilte frisheid en delicate ziltigheid'
  },
  stoofpot: {
    name: 'Rijke stoofschotels',
    dishCategories: ['stoofpot', 'stoofvlees', 'boeuf bourguignon', 'hachee', 'goulash', 'stoofschotel', 'braadvlees'],
    preferredWineTypes: ['Rood'],
    discouragedWineTypes: ['Wit & rosé'],
    grapePreferences: ['Malbec', 'Syrah', 'Shiraz', 'Cabernet Sauvignon', 'Merlot', 'Nebbiolo', 'Tempranillo', 'Grenache'],
    keywords: ['stoofpot', 'stoofvlees', 'stoofschotels', 'stoofschotel', 'wild', 'rood vlees'],
    flavorProfile: 'diepgaande umami, zachte vezels en intense saus'
  },
  wild: {
    name: 'Wild & gevogelte uit het wild',
    dishCategories: ['wild', 'hert', 'ree', 'everzwijn', 'fazant', 'eend', 'haas'],
    preferredWineTypes: ['Rood'],
    discouragedWineTypes: ['Wit & rosé'],
    grapePreferences: ['Nebbiolo', 'Syrah', 'Pinot Noir', 'Cabernet Sauvignon', 'Sangiovese'],
    keywords: ['wild', 'hert', 'eend', 'rood vlees'],
    flavorProfile: 'krachtige aardse tonen en intens wildvlees'
  },
  roodvlees: {
    name: 'Gegrild rood vlees & biefstuk',
    dishCategories: [
      'rood vlees', 'biefstuk', 'bavette', 'bavet', 'flank steak', 'steak',
      'entrecote', 'ribeye', 'ossenhaas', 'tournedos', 'chateaubriand',
      'longhaas', 'sukade', 'diamanthaas', 'rund', 'rundvlees',
      'bbq', 'gegrild vlees', 'burger', 'kotelet'
    ],
    preferredWineTypes: ['Rood'],
    discouragedWineTypes: ['Wit & rosé'],
    grapePreferences: ['Cabernet Sauvignon', 'Malbec', 'Merlot', 'Syrah', 'Tempranillo', 'Sangiovese', 'Nebbiolo'],
    keywords: ['rood vlees', 'biefstuk', 'bavette', 'gegrild vlees', 'bbq', 'rundvlees'],
    flavorProfile: 'gekaramelliseerde korst, sappig vlees, eiwitten en vetten'
  },
  gevogelte: {
    name: 'Gevogelte & wit vlees',
    dishCategories: ['kip', 'kalkoen', 'parelhoen', 'gevogelte', 'kwartel'],
    preferredWineTypes: ['Wit & rosé', 'Rood'],
    discouragedWineTypes: [],
    grapePreferences: ['Chardonnay', 'Pinot Noir', 'Merlot', 'Viognier'],
    keywords: ['gevogelte', 'kip', 'kalkoen'],
    flavorProfile: 'mild wit vlees en verfijnde aroma\'s'
  },
  kaas: {
    name: 'Kazen & kaasplanken',
    dishCategories: ['kaas', 'kaasplank', 'harde kaas', 'oude kaas', 'geitenkaas', 'blauwe kaas', 'brie', 'camembert'],
    preferredWineTypes: ['Rood', 'Wit & rosé', 'Overig'],
    discouragedWineTypes: [],
    grapePreferences: ['Port', 'Sauvignon Blanc', 'Chardonnay', 'Nebbiolo', 'Sangiovese'],
    keywords: ['kaas', 'harde kazen', 'kazen', 'geitenkaas', 'oude kazen'],
    flavorProfile: 'romige vetten, ziltigheid en umami'
  },
  pasta: {
    name: 'Italiaanse pasta & risotto',
    dishCategories: ['pasta', 'lasagne', 'bolognese', 'carbonara', 'risotto', 'tomaat', 'pizza'],
    preferredWineTypes: ['Rood', 'Wit & rosé'],
    discouragedWineTypes: [],
    grapePreferences: ['Sangiovese', 'Barbera', 'Nebbiolo', 'Pinot Grigio'],
    keywords: ['pasta', 'italiaans', 'tomaat', 'risotto'],
    flavorProfile: 'zuren van tomaat of romigheid van kaas en zetmeel'
  },
  varken: {
    name: 'Varkensvlees',
    dishCategories: ['varkenshaas', 'varkensvlees', 'buikspek', 'procureur', 'ribroast', 'spareribs', 'varken'],
    preferredWineTypes: ['Rood', 'Wit & rosé'],
    discouragedWineTypes: [],
    grapePreferences: ['Pinot Noir', 'Chardonnay', 'Merlot', 'Gamay', 'Grenache', 'Tempranillo', 'Viognier'],
    keywords: ['varkensvlees', 'varken', 'varkenshaas', 'wit vlees', 'gevogelte'],
    flavorProfile: 'zacht zoetig vet en malse structuur'
  }
};

const STOPWORDS = new Set([
  'met', 'van', 'een', 'voor', 'bij', 'aan', 'het', 'als', 'uit', 'and', 'with', 'the', 'sauce', 'saus', 'en', 'op', 'in', 'te', 'naar', 'tot', 'om', 'door', 'over'
]);

function extractStems(query: string): string[] {
  const words = query
    .toLowerCase()
    .split(/[\s,+/&]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOPWORDS.has(w));

  const stems: string[] = [];
  for (const w of words) {
    stems.push(w);
    // Dutch culinary stem variations
    if (w.startsWith('lams') || w.startsWith('lam')) stems.push('lam', 'lamsvlees');
    if (w.includes('kotelet')) stems.push('kotelet', 'gegrild');
    if (w.includes('couscous')) stems.push('couscous', 'parelcouscous', 'mediterraan');
    if (w.includes('stoof')) stems.push('stoof', 'stoofvlees', 'stoofpot');
    if (w.includes('vis')) stems.push('vis', 'witvis');
    if (w.includes('vlees')) stems.push('rood vlees', 'vlees');
    if (w.includes('bavet') || w.includes('steak') || w.includes('ribeye') || w.includes('entrecot') || w.includes('rund') || w.includes('biefstuk')) {
      stems.push('rood vlees', 'biefstuk', 'bavette');
    }
    if (w.includes('rozemarijn') || w.includes('tijm') || w.includes('kruid')) {
      stems.push('kruidig', 'mediterraan');
    }
  }
  return Array.from(new Set(stems));
}

function buildCulinaryReason(
  wine: Wine,
  dishQuery: string,
  matchedProfile?: DishProfile,
  directFoodMatch?: string
): string {
  const grape = wine.druif || 'deze blend';
  const wineType = wine.type;
  const isRed = wineType === 'Rood';
  const queryLower = dishQuery.toLowerCase();

  // Lamb specific reasoning
  if (queryLower.includes('lam') || queryLower.includes('kotelet')) {
    if (isRed) {
      if (grape.toLowerCase().includes('cabernet') || grape.toLowerCase().includes('merlot')) {
        return `De rijpe tannines en het geconcentreerde donkere fruit van de ${grape} snijden prachtig door het karakteristieke vet van het lamsvlees. De kruidige houttoetsen vullen de parelcouscous en geroosterde korst fenomenaal aan.`;
      }
      if (grape.toLowerCase().includes('syrah') || grape.toLowerCase().includes('shiraz') || grape.toLowerCase().includes('grenache')) {
        return `Syrah en Grenache brengen zwarte peper, garrigue-kruidigheid en sappige body mee die naadloos harmoniëren met het hartige lamsvlees en de mediterrane specerijen in de parelcouscous.`;
      }
      if (grape.toLowerCase().includes('pinot noir') || grape.toLowerCase().includes('frühburgunder')) {
        return `De verfijnde zuren en zachte aardse tonen van de ${grape} omarmen de sappige lamskotelet zonder de delicate parelcouscous te overstemmen.`;
      }
      return `Een krachtige rode wijn met structuur die het hartige karakter en het smaakvolle vet van de lamskotelet harmonieus in evenwicht brengt.`;
    }
  }

  // Red meat / Bavette / Steak reasoning
  if (queryLower.includes('bavet') || queryLower.includes('biefstuk') || queryLower.includes('steak') || queryLower.includes('ribeye') || queryLower.includes('rund') || queryLower.includes('rood vlees')) {
    if (isRed) {
      return `De sappige vlezige textuur van de bavette/rundvlees en de geroosterde aroma's van het bakken vragen om een rode wijn met body en structuur. De tannines en het rijpe fruit van de ${grape} (${wine.naam}) versmelten prachtig met de eiwitten en de rozemarijn.`;
    }
  }

  // Fish / Seafood reasoning
  if (queryLower.includes('vis') || queryLower.includes('zeebaars') || queryLower.includes('kabeljauw')) {
    if (!isRed) {
      return `De levendige zuren en minerale tonen van de ${grape} verfrissen het palet en sluiten aan bij de delicate, zilte textuur van de vis.`;
    }
  }

  // Stew / Stoofpot
  if (queryLower.includes('stoof')) {
    if (isRed) {
      return `De diepgang en ronde body van de ${grape} bieden het benodigde tegengewicht aan de rijke, lang gegaarde saus van het stoofvlees.`;
    }
  }

  // Direct food text match from database
  if (directFoodMatch) {
    return `In het authentieke wijnprofiel wordt "${directFoodMatch}" specifiek vermeld als ideale combinatie; de smaakintensiteit van de ${grape} sluit er direct op aan.`;
  }

  // General profile match
  if (matchedProfile) {
    return `De stijl van ${wine.naam} (${wineType}, ${grape}) is van nature complementair aan ${matchedProfile.flavorProfile}.`;
  }

  return `De smaakstructuur en rijping van ${wine.naam} (${wine.jaar}) vullen de componenten van "${dishQuery}" op gebalanceerde wijze aan.`;
}

export function findWinePairings(
  wines: Wine[],
  dishQuery: string,
  preferredTypeFilter: string = ''
): PairingResult[] {
  const query = dishQuery.toLowerCase().trim();
  const searchStems = extractStems(query);

  // Identify matching dish profiles
  const matchingProfiles: DishProfile[] = [];
  for (const [key, profile] of Object.entries(DISH_RULES)) {
    const hitsKey = searchStems.some(s => s.includes(key) || key.includes(s));
    const hitsSub = profile.dishCategories.some(cat =>
      searchStems.some(s => s.includes(cat) || cat.includes(s))
    );
    if (hitsKey || hitsSub) {
      matchingProfiles.push(profile);
    }
  }

  const results: PairingResult[] = wines
    .filter(w => w.aantal > 0)
    .filter(w => !preferredTypeFilter || w.type === preferredTypeFilter)
    .map(wine => {
      let score = 0;
      const reasons: string[] = [];
      let caveat: string | undefined = undefined;
      const foodText = (wine.eten || '').toLowerCase();
      const druifText = (wine.druif || '').toLowerCase();
      const status = getWineDrinkStatus(wine);

      // Track if there is any genuine culinary connection
      let hasCulinaryAffinity = false;
      let directFoodMatchName: string | undefined = undefined;

      // 1. Direct text or stem mention in wine's 'eten' field
      for (const stem of searchStems) {
        if (foodText.includes(stem)) {
          score += 45;
          hasCulinaryAffinity = true;
          directFoodMatchName = stem;
          reasons.push(`Spijsadvies adviseert specifiek "${stem}"`);
          break;
        }
      }

      // Also check if 'lamsvlees' in wine text matches 'lam'
      if (!directFoodMatchName && (query.includes('lam') || query.includes('kotelet')) && foodText.includes('lam')) {
        score += 50;
        hasCulinaryAffinity = true;
        directFoodMatchName = 'lamsvlees';
        reasons.push(`Wijnhuis noemt uitdrukkelijk "lamsvlees" als match`);
      }

      // 2. Profile matching (witvis vs rood vlees vs lam vs stoofpot)
      if (matchingProfiles.length > 0) {
        for (const profile of matchingProfiles) {
          // Preferred wine type bonus
          if (profile.preferredWineTypes.includes(wine.type)) {
            score += 35;
            hasCulinaryAffinity = true;
            reasons.push(`Rode wijn is essentieel voor het vetafbrekende effect bij ${profile.name.toLowerCase()}`);
          }

          // Discouraged wine type penalty (e.g. delicate white with lamb/beef, or heavy red with sole)
          if (profile.discouragedWineTypes.includes(wine.type)) {
            score -= 80; // Heavy penalty: white wine must not beat red for lamb
            caveat = `Let op: ${wine.type} mist de benodigde tannines om het vet en de uitgesproken smaak van ${dishQuery} te pareren.`;
          }

          // Grape matches
          const grapeMatch = profile.grapePreferences.find(g => druifText.includes(g.toLowerCase()));
          if (grapeMatch) {
            score += 30;
            hasCulinaryAffinity = true;
            reasons.push(`Druif ${grapeMatch} levert de juiste tannines en kruidige aroma's`);
          }

          // Keyword matches in food field
          for (const kw of profile.keywords) {
            if (foodText.includes(kw)) {
              score += 25;
              hasCulinaryAffinity = true;
              reasons.push(`Aansluiting op smaakprofiel: "${kw}"`);
              break;
            }
          }
        }
      }

      // CRITICAL: If a wine has ZERO culinary affinity with the dish, penalize it heavily so random whites/reds don't score high!
      if (!hasCulinaryAffinity) {
        score -= 40;
      }

      // 3. Drink status factor (only positive if wine is ready, but secondary to food match)
      if (status.status === 'urgent') {
        score += 12;
        reasons.push(`Drinkadvies: 2026 is laatste optimale drinkjaar`);
      } else if (status.status === 'almost_end') {
        score += 8;
        reasons.push(`Nadert einde van drinkvenster (${status.endYear})`);
      } else if (status.status === 'peak') {
        score += 10;
        reasons.push(`Op optimaal smaakhoogtepunt`);
      }

      // 4. Vivino score factor (slight bonus for top rated bottles)
      const vivino = Number(wine.score) || 0;
      if (vivino > 0) {
        score += Math.round(vivino * 2.5);
      }
      if (wine.favorite) {
        score += 5;
        reasons.push(`Jouw favoriete wijn ★`);
      }

      // Build rich culinary reasoning
      const culinaryReason = buildCulinaryReason(
        wine,
        dishQuery,
        matchingProfiles[0],
        directFoodMatchName
      );

      // Serving suggestion
      const serveertip = wine.type === 'Rood'
        ? (Number(wine.jaar) >= 2018 ? 'Serveertip: 16–18 °C. Trek 1 uur van tevoren open of schenk over in karaf voor soepele tannines.' : 'Serveertip: 16–17 °C in ruim Bordeaux/Bourgogneglas.')
        : 'Serveertip: Gekoeld serveren (9–11 °C).';

      const isGoodMatch = hasCulinaryAffinity && (!caveat || score > 40);

      return {
        wine,
        score: Math.max(5, score),
        culinaryReason,
        matchReasons: reasons.slice(0, 3),
        serveertip,
        caveat,
        isGoodMatch
      };
    })
    .filter(r => r.score > 20) // Filter out pure mismatches
    .sort((a, b) => b.score - a.score);

  return results.slice(0, 6);
}
