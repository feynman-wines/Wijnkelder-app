import React, { useState, useMemo } from 'react';
import { 
  Wine as WineIcon, 
  TrendingUp, 
  Euro, 
  Calendar, 
  MapPin, 
  Award, 
  BarChart3, 
  PieChart, 
  Sparkles, 
  Clock, 
  Grape, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Layers, 
  ArrowRight,
  Filter,
  X,
  ChevronRight
} from 'lucide-react';
import { Wine } from '../../types/wine';
import { getWineDrinkStatus } from '../../utils/drinkStatus';
import { parseSingleWinePrice } from '../../utils/priceHelper';

interface StatsViewProps {
  wines: Wine[];
  onSelectWine: (wine: Wine) => void;
}

interface FilterModalState {
  title: string;
  subtitle: string;
  wines: Wine[];
}

export const StatsView: React.FC<StatsViewProps> = ({ wines, onSelectWine }) => {
  const [filterModal, setFilterModal] = useState<FilterModalState | null>(null);

  const activeWines = useMemo(() => {
    return wines.filter(w => (Number(w.aantal) || 0) > 0);
  }, [wines]);

  // Helper parse year
  const parseYear = (yearStr?: string | number): number | null => {
    if (!yearStr) return null;
    const val = parseInt(String(yearStr).replace(/[^0-9]/g, ''));
    return isNaN(val) ? null : val;
  };

  // 1. Key Metrics Calculation
  interface StatsSummary {
    totalBottles: number;
    uniqueWinesCount: number;
    totalValue: number;
    avgBottlePrice: number;
    highestPriceWine: { wine: Wine; price: number } | null;
    oldestWine: { wine: Wine; year: number } | null;
    totalConsumedBottles: number;
    totalNotesCount: number;
    avgScore: string;
  }

  const statsSummary: StatsSummary = useMemo(() => {
    let totalValue = 0;
    let pricedBottlesCount = 0;
    let totalBottles = 0;
    let highestPriceWine: { wine: Wine; price: number } | null = null;
    let oldestWine: { wine: Wine; year: number } | null = null;
    let totalConsumedBottles = 0;
    let totalNotesCount = 0;
    let totalScoreSum = 0;
    let scoredNotesCount = 0;

    activeWines.forEach(w => {
      const count = Number(w.aantal) || 0;
      totalBottles += count;

      const price = parseSingleWinePrice(w.prijs);
      if (price > 0) {
        totalValue += price * count;
        pricedBottlesCount += count;
        if (!highestPriceWine || price > highestPriceWine.price) {
          highestPriceWine = { wine: w, price };
        }
      }

      const yr = parseYear(w.jaar);
      if (yr && yr > 1900 && yr <= new Date().getFullYear()) {
        if (!oldestWine || yr < oldestWine.year) {
          oldestWine = { wine: w, year: yr };
        }
      }
    });

    wines.forEach(w => {
      totalConsumedBottles += (w.consumed || 0);
      if (w.notes && w.notes.length > 0) {
        totalNotesCount += w.notes.length;
        w.notes.forEach(n => {
          const sc = typeof n.score === 'number' ? n.score : parseFloat(String(n.score));
          if (!isNaN(sc) && sc > 0) {
            totalScoreSum += sc;
            scoredNotesCount += 1;
          }
        });
      }
    });

    const avgBottlePrice = pricedBottlesCount > 0 ? totalValue / pricedBottlesCount : 0;
    const avgScore = scoredNotesCount > 0 ? (totalScoreSum / scoredNotesCount).toFixed(1) : '-';

    return {
      totalBottles,
      uniqueWinesCount: activeWines.length,
      totalValue,
      avgBottlePrice,
      highestPriceWine,
      oldestWine,
      totalConsumedBottles,
      totalNotesCount,
      avgScore
    };
  }, [activeWines, wines]);

  // 2. Type breakdown for Pie / Donut Chart
  const typeBreakdown = useMemo(() => {
    const map: Record<string, { count: number; bottles: number; value: number; color: string; hex: string }> = {
      'Rood': { count: 0, bottles: 0, value: 0, color: 'bg-rose-700', hex: '#be123c' },
      'Wit & rosé': { count: 0, bottles: 0, value: 0, color: 'bg-amber-500', hex: '#f59e0b' },
      'Mousserend': { count: 0, bottles: 0, value: 0, color: 'bg-emerald-500', hex: '#10b981' },
      'Overig': { count: 0, bottles: 0, value: 0, color: 'bg-purple-600', hex: '#9333ea' }
    };

    activeWines.forEach(w => {
      let type = w.type || 'Overig';
      if (!map[type]) {
        if (type.toLowerCase().includes('wit') || type.toLowerCase().includes('rosé')) type = 'Wit & rosé';
        else if (type.toLowerCase().includes('mouss') || type.toLowerCase().includes('champ')) type = 'Mousserend';
        else type = 'Overig';
      }
      const bottles = Number(w.aantal) || 0;
      const price = parseSingleWinePrice(w.prijs);
      map[type].count += 1;
      map[type].bottles += bottles;
      map[type].value += price * bottles;
    });

    const total = statsSummary.totalBottles || 1;
    return Object.entries(map).map(([type, data]) => ({
      type,
      ...data,
      pct: Math.round((data.bottles / total) * 100)
    })).filter(t => t.bottles > 0).sort((a, b) => b.bottles - a.bottles);
  }, [activeWines, statsSummary.totalBottles]);

  // Calculate SVG Pie/Donut Chart Paths
  const pieSegments = useMemo(() => {
    const total = statsSummary.totalBottles || 1;
    let accumulatedAngle = 0;

    return typeBreakdown.map(item => {
      const angle = (item.bottles / total) * 360;
      const startAngle = accumulatedAngle;
      const endAngle = accumulatedAngle + angle;
      accumulatedAngle = endAngle;

      const x1 = 100 + 70 * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = 100 + 70 * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = 100 + 70 * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = 100 + 70 * Math.sin((Math.PI * (endAngle - 90)) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      return {
        ...item,
        pathData,
        startAngle,
        endAngle
      };
    });
  }, [typeBreakdown, statsSummary.totalBottles]);

  // 3. Drinkvenster Histogram
  const drinkWindowHistogram = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const categories: Record<string, { count: number; bottles: number; label: string; color: string; desc: string; filterFn: (w: Wine) => boolean }> = {
      urgent: {
        count: 0,
        bottles: 0,
        label: 'Nu drinken (2026)',
        color: 'bg-rose-500',
        desc: 'Op dronk of nadert eind van drinkvenster',
        filterFn: w => {
          const s = getWineDrinkStatus(w);
          return s.endYear ? s.endYear <= currentYear : false;
        }
      },
      short: {
        count: 0,
        bottles: 0,
        label: '2027 – 2028',
        color: 'bg-amber-500',
        desc: 'Binnen 1-2 jaar op dronk',
        filterFn: w => {
          const s = getWineDrinkStatus(w);
          return s.endYear ? s.endYear > currentYear && s.endYear <= currentYear + 2 : false;
        }
      },
      medium: {
        count: 0,
        bottles: 0,
        label: '2029 – 2031',
        color: 'bg-emerald-500',
        desc: 'Ideale middellange bewaring',
        filterFn: w => {
          const s = getWineDrinkStatus(w);
          return s.endYear ? s.endYear > currentYear + 2 && s.endYear <= currentYear + 5 : false;
        }
      },
      long: {
        count: 0,
        bottles: 0,
        label: '2032+',
        color: 'bg-blue-500',
        desc: 'Grote bewaarwijnen voor later',
        filterFn: w => {
          const s = getWineDrinkStatus(w);
          return s.endYear ? s.endYear > currentYear + 5 : false;
        }
      }
    };

    activeWines.forEach(w => {
      const bCount = Number(w.aantal) || 0;
      const dInfo = getWineDrinkStatus(w);
      const endYear = dInfo.endYear;

      if (!endYear) {
        categories.short.count += 1;
        categories.short.bottles += bCount;
      } else if (endYear <= currentYear) {
        categories.urgent.count += 1;
        categories.urgent.bottles += bCount;
      } else if (endYear <= currentYear + 2) {
        categories.short.count += 1;
        categories.short.bottles += bCount;
      } else if (endYear <= currentYear + 5) {
        categories.medium.count += 1;
        categories.medium.bottles += bCount;
      } else {
        categories.long.count += 1;
        categories.long.bottles += bCount;
      }
    });

    const total = statsSummary.totalBottles || 1;
    return Object.entries(categories).map(([key, item]) => ({
      key,
      ...item,
      pct: Math.round((item.bottles / total) * 100)
    }));
  }, [activeWines, statsSummary.totalBottles]);

  // 4. Country distribution
  const countryBreakdown = useMemo(() => {
    const map: Record<string, { count: number; bottles: number; value: number }> = {};
    activeWines.forEach(w => {
      const land = (w.land || 'Onbekend').trim();
      if (!map[land]) map[land] = { count: 0, bottles: 0, value: 0 };
      const bottles = Number(w.aantal) || 0;
      map[land].count += 1;
      map[land].bottles += bottles;
      map[land].value += parseSingleWinePrice(w.prijs) * bottles;
    });

    return Object.entries(map).map(([land, data]) => ({
      land,
      ...data,
      pct: statsSummary.totalBottles > 0 ? Math.round((data.bottles / statsSummary.totalBottles) * 100) : 0
    })).sort((a, b) => b.bottles - a.bottles);
  }, [activeWines, statsSummary.totalBottles]);

  // 5. Vintage Distribution (Jaargangen Histogram)
  const vintageHistogram = useMemo(() => {
    const map: Record<string, { bottles: number; count: number }> = {};
    activeWines.forEach(w => {
      const yr = parseYear(w.jaar);
      const bCount = Number(w.aantal) || 0;
      const key = yr ? String(yr) : 'NV';
      if (!map[key]) map[key] = { bottles: 0, count: 0 };
      map[key].bottles += bCount;
      map[key].count += 1;
    });

    const entries = Object.entries(map).map(([year, data]) => ({ year, ...data }));
    entries.sort((a, b) => {
      if (a.year === 'NV') return 1;
      if (b.year === 'NV') return -1;
      return parseInt(a.year) - parseInt(b.year);
    });

    const maxBottles = Math.max(...entries.map(e => e.bottles), 1);
    return { entries, maxBottles };
  }, [activeWines]);

  // 6. Price Tiers (Waarde segmentatie)
  const priceTiers = useMemo(() => {
    const tiers = [
      { key: 'budget', label: '< € 15', desc: 'Alledaags & aperitief', min: 0, max: 15, bottles: 0, count: 0, color: 'bg-stone-500' },
      { key: 'mid', label: '€ 15 – € 30', desc: 'Kwaliteit & etentjes', min: 15, max: 30, bottles: 0, count: 0, color: 'bg-emerald-500' },
      { key: 'premium', label: '€ 30 – € 60', desc: 'Diners & speciale momenten', min: 30, max: 60, bottles: 0, count: 0, color: 'bg-rose-500' },
      { key: 'prestige', label: '> € 60', desc: 'Topcuvées & bewaariconen', min: 60, max: 999999, bottles: 0, count: 0, color: 'bg-amber-400' }
    ];

    activeWines.forEach(w => {
      const p = parseSingleWinePrice(w.prijs);
      const b = Number(w.aantal) || 0;
      const tier = tiers.find(t => p >= t.min && p < t.max) || tiers[0];
      tier.bottles += b;
      tier.count += 1;
    });

    const total = statsSummary.totalBottles || 1;
    return tiers.map(t => ({
      ...t,
      pct: Math.round((t.bottles / total) * 100)
    }));
  }, [activeWines, statsSummary.totalBottles]);

  // 7. Top Grapes
  const topGrapes = useMemo(() => {
    const map: Record<string, { bottles: number; count: number }> = {};
    activeWines.forEach(w => {
      if (!w.druif) return;
      const grapes = w.druif.split(/[,/&]/).map(g => g.trim()).filter(Boolean);
      const bottles = Number(w.aantal) || 0;
      grapes.forEach(g => {
        if (!map[g]) map[g] = { bottles: 0, count: 0 };
        map[g].bottles += bottles;
        map[g].count += 1;
      });
    });

    return Object.entries(map)
      .map(([grape, data]) => ({ grape, ...data }))
      .sort((a, b) => b.bottles - a.bottles)
      .slice(0, 8);
  }, [activeWines]);

  // Click Handlers to open wine list modal
  const handleOpenTypeWines = (type: string) => {
    const matched = activeWines.filter(w => {
      if (type === 'Rood') return w.type === 'Rood';
      if (type === 'Wit & rosé') return w.type.toLowerCase().includes('wit') || w.type.toLowerCase().includes('rosé');
      if (type === 'Mousserend') return w.type.toLowerCase().includes('mouss') || w.type.toLowerCase().includes('champ');
      return true;
    });
    setFilterModal({
      title: `Type: ${type}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen verdeeld over ${matched.length} wijnen`,
      wines: matched
    });
  };

  const handleOpenGrapeWines = (grape: string) => {
    const matched = activeWines.filter(w => (w.druif || '').toLowerCase().includes(grape.toLowerCase()));
    setFilterModal({
      title: `Druivenras: ${grape}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen verdeeld over ${matched.length} unieke wijnen`,
      wines: matched
    });
  };

  const handleOpenCountryWines = (land: string) => {
    const matched = activeWines.filter(w => (w.land || '').toLowerCase().trim() === land.toLowerCase().trim());
    setFilterModal({
      title: `Land: ${land}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen uit ${land}`,
      wines: matched
    });
  };

  const handleOpenVintageWines = (year: string) => {
    const matched = activeWines.filter(w => {
      if (year === 'NV') return !w.jaar || isNaN(Number(w.jaar));
      return String(w.jaar) === year;
    });
    setFilterModal({
      title: `Oogstjaar: ${year}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen uit jaargang ${year}`,
      wines: matched
    });
  };

  const handleOpenPriceTierWines = (min: number, max: number, label: string) => {
    const matched = activeWines.filter(w => {
      const p = parseSingleWinePrice(w.prijs);
      return p >= min && p < max;
    });
    setFilterModal({
      title: `Prijssegment: ${label}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen in deze categorie`,
      wines: matched
    });
  };

  const handleOpenDrinkWindowWines = (key: string, label: string) => {
    const currentYear = new Date().getFullYear();
    const matched = activeWines.filter(w => {
      const d = getWineDrinkStatus(w);
      if (key === 'urgent') return d.endYear ? d.endYear <= currentYear : false;
      if (key === 'short') return d.endYear ? d.endYear > currentYear && d.endYear <= currentYear + 2 : false;
      if (key === 'medium') return d.endYear ? d.endYear > currentYear + 2 && d.endYear <= currentYear + 5 : false;
      if (key === 'long') return d.endYear ? d.endYear > currentYear + 5 : false;
      return false;
    });
    setFilterModal({
      title: `Drinkvenster: ${label}`,
      subtitle: `${matched.reduce((s, w) => s + w.aantal, 0)} flessen met dit bewaarpotentieel`,
      wines: matched
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-rose-950/40 border border-stone-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Analyse & Waarde
              </span>
              <span className="text-xs text-stone-400">Interactief dashboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-100">
              Kelderstatistieken
            </h2>
            <p className="text-sm text-stone-400 max-w-2xl mt-1">
              Inzicht in je voorraad, berekende waarde, drinkvensters en verdeling per herkomst, type en oogstjaar. Klik op elk element om de bijbehorende wijnen te bekijken.
            </p>
          </div>

          {/* Quick Total Cellar Value */}
          <div className="flex items-center gap-4 bg-stone-950/80 border border-stone-800 p-4 rounded-2xl backdrop-blur shrink-0">
            <div className="text-right">
              <div className="text-xs text-stone-400 font-medium">Totale Kelderwaarde</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                € {statsSummary.totalValue.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-stone-400">Gem. € {statsSummary.avgBottlePrice.toFixed(2)} per fles</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Euro className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Flessen in voorraad */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Voorraad</span>
            <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400 border border-rose-900/40">
              <WineIcon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-stone-100 font-mono">
              {statsSummary.totalBottles} <span className="text-sm font-normal text-stone-400">flessen</span>
            </div>
            <div className="text-xs text-stone-400 mt-1">
              Verdeeld over <strong className="text-stone-200">{statsSummary.uniqueWinesCount}</strong> unieke labels
            </div>
          </div>
        </div>

        {/* Card 2: Gemiddelde flesprijs */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Gem. Prijs / Fles</span>
            <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
              € {statsSummary.avgBottlePrice.toFixed(2)}
            </div>
            <div className="text-xs text-stone-400 mt-1">
              Winkelwaarde per fles
            </div>
          </div>
        </div>

        {/* Card 3: Meest waardevolle fles */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Top Fles</span>
            <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400 border border-amber-900/40">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            {statsSummary.highestPriceWine ? (
              <div 
                onClick={() => onSelectWine(statsSummary.highestPriceWine!.wine)}
                className="cursor-pointer group"
                title="Klik om te bekijken"
              >
                <div className="text-xl sm:text-2xl font-bold text-amber-400 font-mono group-hover:text-amber-300 transition">
                  € {statsSummary.highestPriceWine.price.toFixed(2)}
                </div>
                <div className="text-xs text-stone-300 font-medium truncate mt-1 group-hover:underline flex items-center gap-1">
                  <span>{statsSummary.highestPriceWine.wine.naam}</span>
                  <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
                </div>
              </div>
            ) : (
              <div className="text-sm text-stone-500">Geen prijzen ingevuld</div>
            )}
          </div>
        </div>

        {/* Card 4: Totaal genoten / ontkurkt */}
        <div className="p-5 rounded-2xl bg-stone-900 border border-stone-800 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Genoten & Ontkurkt</span>
            <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-900/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-300 font-mono">
              {statsSummary.totalConsumedBottles} <span className="text-sm font-normal text-stone-400">gedronken</span>
            </div>
            <div className="text-xs text-stone-400 mt-1">
              {statsSummary.totalNotesCount} proefnotities · Gem. score: <strong className="text-amber-400">{statsSummary.avgScore} ★</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Cirkeldiagram (Donut) Wijntype + Drinkvenster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cirkeldiagram (Pie/Donut Chart) for Wijntypes */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-stone-100">Verdeling per Wijntype</h3>
              </div>
              <span className="text-xs text-stone-400">Cirkeldiagram</span>
            </div>
            <p className="text-xs text-stone-400 mb-6">
              Klik op een segment of type om direct de wijnen in die categorie te bekijken.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {/* SVG Donut Chart */}
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {pieSegments.map(seg => (
                    <path
                      key={seg.type}
                      d={seg.pathData}
                      fill={seg.hex}
                      className="cursor-pointer transition-opacity hover:opacity-80 stroke-stone-900 stroke-2"
                      onClick={() => handleOpenTypeWines(seg.type)}
                    >
                      <title>{`${seg.type}: ${seg.bottles} flessen (${seg.pct}%)`}</title>
                    </path>
                  ))}
                  {/* Center Circle for Donut hole */}
                  <circle cx="100" cy="100" r="42" fill="#1c1917" />
                </svg>

                {/* Center text inside donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-xl font-bold font-mono text-stone-100 leading-none">
                    {statsSummary.totalBottles}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider mt-0.5">flessen</span>
                </div>
              </div>

              {/* Legend & Clickable List */}
              <div className="flex-1 w-full space-y-2">
                {typeBreakdown.map(item => (
                  <div
                    key={item.type}
                    onClick={() => handleOpenTypeWines(item.type)}
                    className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800 border border-stone-800/80 hover:border-stone-700 transition cursor-pointer flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.hex }} />
                      <div>
                        <span className="font-bold text-stone-200 group-hover:text-rose-300 transition">
                          {item.type}
                        </span>
                        <span className="text-[11px] text-stone-400 ml-1.5">({item.count} uniek)</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <div className="font-bold text-stone-100">{item.bottles} fl. <span className="text-stone-400 font-normal">({item.pct}%)</span></div>
                        <div className="text-[10px] text-stone-500 font-mono">€ {item.value.toFixed(0)}</div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-300 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drinkvenster Histogram & Rijping */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-stone-100">Drinkvenster & Rijping</h3>
              </div>
              <span className="text-xs text-stone-400">Wanneer drinken?</span>
            </div>
            <p className="text-xs text-stone-400 mb-6">
              Klik op een tijdsvenster om alle flessen te zien die in die periode op dronk zijn.
            </p>

            {/* Stacked Progress Bar */}
            <div className="w-full h-4 rounded-full bg-stone-800 flex overflow-hidden mb-6">
              {drinkWindowHistogram.map(item => item.pct > 0 && (
                <div
                  key={item.key}
                  className={`${item.color} transition-all cursor-pointer hover:opacity-90`}
                  style={{ width: `${item.pct}%` }}
                  title={`${item.label}: ${item.bottles} flessen (${item.pct}%)`}
                  onClick={() => handleOpenDrinkWindowWines(item.key, item.label)}
                />
              ))}
            </div>

            {/* Clickable Items List */}
            <div className="space-y-2.5">
              {drinkWindowHistogram.map(item => (
                <div
                  key={item.key}
                  onClick={() => handleOpenDrinkWindowWines(item.key, item.label)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800 border border-stone-800/80 hover:border-stone-700 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                    <div>
                      <div className="text-sm font-semibold text-stone-200 group-hover:text-rose-300 transition">{item.label}</div>
                      <div className="text-[11px] text-stone-400">{item.desc}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-sm font-bold text-stone-100">{item.bottles} <span className="text-xs font-normal text-stone-400">fl.</span></div>
                      <div className="text-[11px] text-stone-400">{item.pct}%</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-300 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Jaargangenverdeling Staafdiagram (Vintage Histogram) */}
      <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-lg font-bold text-stone-100">Jaargangenverdeling (Oogstjaren)</h3>
              <p className="text-xs text-stone-400">
                Staafdiagram van alle oogstjaren. Klik op een staaf om alle wijnen uit dat jaar te bekijken.
              </p>
            </div>
          </div>
          <div className="text-xs text-stone-400 bg-stone-950 px-3 py-1.5 rounded-xl border border-stone-800 self-start sm:self-auto">
            Oudste jaargang: <strong className="text-amber-300 font-mono">{statsSummary.oldestWine ? `${statsSummary.oldestWine.year}` : 'NV'}</strong>
          </div>
        </div>

        {/* Clear Bar Chart with SVG/Tailwind styling */}
        <div className="pt-8 pb-4 px-2 bg-stone-950/60 rounded-2xl border border-stone-800/80 overflow-x-auto">
          <div className="flex items-end gap-3 sm:gap-4 min-w-[500px] h-52 pb-6 border-b border-stone-800">
            {vintageHistogram.entries.map(item => {
              const heightPct = Math.max(16, Math.round((item.bottles / vintageHistogram.maxBottles) * 100));
              return (
                <div
                  key={item.year}
                  onClick={() => handleOpenVintageWines(item.year)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Bottle Count Badge on top of bar */}
                  <span className="text-xs font-bold font-mono text-blue-300 mb-1 group-hover:scale-110 transition">
                    {item.bottles}
                  </span>

                  {/* The Vertical Bar */}
                  <div className="w-full max-w-[40px] bg-stone-800 rounded-t-lg overflow-hidden flex items-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-blue-700 via-blue-500 to-cyan-400 group-hover:from-blue-600 group-hover:to-cyan-300 transition-all rounded-t-lg shadow-lg shadow-blue-950/60"
                      style={{ height: `${heightPct}%` }}
                      title={`Jaargang ${item.year}: ${item.bottles} flessen (${item.count} wijnen)`}
                    />
                  </div>

                  {/* Year Label Underneath */}
                  <span className="text-xs font-bold text-stone-400 group-hover:text-stone-100 transition mt-2 font-mono">
                    {item.year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3: Landen & Herkomst + Waardesegmenten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Herkomst per Land */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-stone-100">Herkomst per Land</h3>
              </div>
              <span className="text-xs text-stone-400">{countryBreakdown.length} landen</span>
            </div>
            <p className="text-xs text-stone-400 mb-4">
              Klik op een land om de bijbehorende wijnen te zien.
            </p>

            <div className="space-y-2.5">
              {countryBreakdown.map(item => {
                const flag = 
                  item.land.toLowerCase().includes('frank') ? '🇫🇷' :
                  item.land.toLowerCase().includes('ital') ? '🇮🇹' :
                  item.land.toLowerCase().includes('span') ? '🇪🇸' :
                  item.land.toLowerCase().includes('port') ? '🇵🇹' :
                  item.land.toLowerCase().includes('duit') ? '🇩🇪' :
                  item.land.toLowerCase().includes('oost') ? '🇦🇹' :
                  item.land.toLowerCase().includes('argen') ? '🇦🇷' :
                  item.land.toLowerCase().includes('chil') ? '🇨🇱' :
                  item.land.toLowerCase().includes('zuid-a') ? '🇿🇦' :
                  item.land.toLowerCase().includes('verenig') || item.land.toLowerCase().includes('usa') ? '🇺🇸' : '🌍';

                return (
                  <div
                    key={item.land}
                    onClick={() => handleOpenCountryWines(item.land)}
                    className="p-2.5 rounded-xl bg-stone-950/60 hover:bg-stone-800 border border-stone-800/80 hover:border-stone-700 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-200 group-hover:text-emerald-300 transition flex items-center gap-2">
                        <span className="text-sm">{flag}</span> {item.land}
                      </span>
                      <span className="text-stone-300 font-mono font-medium">
                        {item.bottles} flessen <span className="text-stone-500 font-normal">({item.pct}%)</span> · € {item.value.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Waardesegmenten */}
        <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Euro className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-stone-100">Waardesegmenten</h3>
              </div>
              <span className="text-xs text-stone-400">Prijsklassen</span>
            </div>
            <p className="text-xs text-stone-400 mb-4">
              Klik op een segment om de flessen in die prijsklasse te bekijken.
            </p>

            <div className="space-y-3">
              {priceTiers.map(tier => (
                <div
                  key={tier.key}
                  onClick={() => handleOpenPriceTierWines(tier.min, tier.max, tier.label)}
                  className="p-3.5 rounded-2xl bg-stone-950/60 hover:bg-stone-800 border border-stone-800/80 hover:border-stone-700 transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${tier.color}`} />
                    <div>
                      <div className="text-sm font-bold text-stone-200 group-hover:text-amber-300 transition">{tier.label}</div>
                      <div className="text-xs text-stone-400">{tier.desc}</div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <div className="text-sm font-bold font-mono text-stone-100">{tier.bottles} <span className="text-xs font-normal text-stone-400">fl.</span></div>
                      <div className="text-xs text-stone-400">{tier.pct}% van kelder</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-300 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Top Druivenrassen (Clickable) */}
      <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grape className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-lg font-bold text-stone-100">Favoriete Druivenrassen</h3>
              <p className="text-xs text-stone-400">Klik op een druif om alle wijnen met dit ras te filteren.</p>
            </div>
          </div>
          <span className="text-xs text-stone-400">Top 8 rassen</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topGrapes.map((item, idx) => (
            <div
              key={item.grape}
              onClick={() => handleOpenGrapeWines(item.grape)}
              className="p-4 rounded-2xl bg-stone-950/60 hover:bg-purple-950/40 border border-stone-800/80 hover:border-purple-700/60 transition cursor-pointer flex flex-col justify-between group shadow-sm"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-purple-400 font-bold">#{idx + 1}</span>
                <span className="text-xs font-bold font-mono text-stone-100 bg-stone-850 px-2 py-0.5 rounded-md border border-stone-700">
                  {item.bottles} fl.
                </span>
              </div>
              <div className="text-sm font-bold text-stone-200 group-hover:text-purple-200 transition truncate" title={item.grape}>
                {item.grape}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
                <span>{item.count} verschillende wijnen</span>
                <ChevronRight className="w-3 h-3 text-stone-600 group-hover:text-purple-300 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Wine Selection Modal / Drawer */}
      {filterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-stone-100 flex items-center gap-2">
                  <span>🍷</span>
                  <span>{filterModal.title}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">{filterModal.subtitle}</p>
              </div>
              <button
                onClick={() => setFilterModal(null)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Wine List */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-3 flex-1">
              {filterModal.wines.length === 0 ? (
                <div className="text-center py-8 text-stone-500 text-sm">
                  Geen actieve flessen gevonden in deze selectie.
                </div>
              ) : (
                filterModal.wines.map(w => (
                  <div
                    key={w.id}
                    onClick={() => {
                      setFilterModal(null);
                      onSelectWine(w);
                    }}
                    className="p-3.5 rounded-2xl bg-stone-950/70 hover:bg-stone-800 border border-stone-800/80 hover:border-rose-900/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-850 flex items-center justify-center text-lg shrink-0 border border-stone-800">
                        {w.photo ? (
                          <img src={w.photo} alt={w.naam} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span>{w.type === 'Rood' ? '🍷' : w.type.includes('Wit') ? '🥂' : '🍾'}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-stone-200 group-hover:text-rose-300 transition flex items-center gap-2">
                          <span>{w.naam}</span>
                          {w.jaar && <span className="font-mono text-xs text-rose-400">{w.jaar}</span>}
                        </div>
                        <div className="text-xs text-stone-400">
                          {w.wijnhuis} · {w.land} {w.streek ? `(${w.streek})` : ''}
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {w.plank ? `📍 Plank ${w.plank}` : w.opslag}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold font-mono text-sm text-stone-100">
                        {w.aantal} {w.aantal === 1 ? 'fles' : 'flessen'}
                      </div>
                      {w.prijs && <div className="text-xs text-stone-400 font-mono">{w.prijs}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-stone-800 bg-stone-950 text-center">
              <button
                onClick={() => setFilterModal(null)}
                className="px-5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
