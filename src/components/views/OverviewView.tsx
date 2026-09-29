import React, { useState } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, TrendingUp, Layers, MapPin, Calendar, ShieldCheck, Dice5, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { Wine } from '../../types/wine';
import { isNuInteressant, getWineDrinkStatus } from '../../utils/drinkStatus';
import { WineCard } from '../WineCard';
import { CabinetCapacityWidget } from '../CabinetCapacityWidget';

interface OverviewViewProps {
  wines: Wine[];
  cabinetCapacity: number;
  onUpdateCapacity: (newCap: number) => void;
  onSelectWine: (wine: Wine) => void;
  onDrinkOne: (wine: Wine) => void;
  onToggleFavorite: (wine: Wine) => void;
  onUpdateWine?: (wine: Wine) => void;
  onNavigateToCalendar: () => void;
  onNavigateToStock: (statusFilter?: string) => void;
  onNavigateToAdvice?: () => void;
  onNavigateToStats?: () => void;
  onOpenTonightSommelier: () => void;
}

export function parsePriceRange(priceStr: string | undefined): [number, number] {
  if (!priceStr) return [0, 0];
  const cleaned = String(priceStr).replace(/,/g, '.');
  const matches = (cleaned.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  if (matches.length === 0) return [0, 0];
  return [matches[0], matches[1] ?? matches[0]];
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  wines,
  cabinetCapacity,
  onUpdateCapacity,
  onSelectWine,
  onDrinkOne,
  onToggleFavorite,
  onUpdateWine,
  onNavigateToCalendar,
  onNavigateToStock,
  onNavigateToAdvice,
  onNavigateToStats,
  onOpenTonightSommelier
}) => {
  const [showValue, setShowValue] = useState(false);

  const activeWines = wines.filter(w => w.aantal > 0);
  const totalBottles = activeWines.reduce((sum, w) => sum + (Number(w.aantal) || 0), 0);

  // Urgent wines: end is 2026 or expired
  const urgentWines = activeWines.filter(w => {
    const s = getWineDrinkStatus(w);
    return s.status === 'urgent' || s.status === 'expired';
  });

  // Peak drinking wines
  const peakWines = activeWines.filter(w => {
    const s = getWineDrinkStatus(w);
    return s.status === 'peak';
  });

  // Calculate estimated total cellar value
  const totalValueRange = activeWines.reduce(
    (acc, w) => {
      const [min, max] = parsePriceRange(w.prijs);
      const count = Number(w.aantal) || 0;
      return [acc[0] + min * count, acc[1] + max * count];
    },
    [0, 0]
  );

  // "Nu interessant" strictly filtered (excludes long-term maturing wines like Bramare)
  const interestingList = activeWines
    .map(w => ({
      wine: w,
      ...isNuInteressant(w)
    }))
    .filter(item => item.interesting)
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6 sm:px-6">
      {/* Tonight Sommelier & Quick Decision Banner */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/80 via-stone-900 to-amber-950/50 border border-rose-800/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700/60 text-rose-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sommelier Keuzehulp</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-100">
            Wat drinken we vanavond?
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
            Geen zin om lang te zoeken? Laat de sommelier een fles trekken op basis van jouw stemming of wat nu op dronk is.
          </p>
        </div>

        <button
          onClick={onOpenTonightSommelier}
          className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-sm transition-all shadow-xl shadow-rose-950/60 active:scale-95 shrink-0 cursor-pointer z-10"
        >
          <Dice5 className="w-5 h-5 text-amber-200 animate-pulse" />
          <span>Verras me / Fles kiezen</span>
        </button>
      </div>

      {/* KPI Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div 
          onClick={() => onNavigateToStock('')}
          className="p-4 rounded-2xl bg-stone-900 border border-stone-800 shadow-sm flex flex-col justify-between cursor-pointer hover:border-stone-700 transition group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
              Totale Voorraad
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-300 transition" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-mono">
            {totalBottles} <span className="text-base font-normal text-stone-400">flessen</span>
          </div>
          <p className="text-xs text-stone-400 mt-1">{activeWines.length} unieke wijnen geregistreerd</p>
        </div>

        <div
          onClick={() => onNavigateToStock('peak')}
          className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 shadow-sm cursor-pointer hover:border-emerald-600 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Nu op dronk
            </div>
            <span className="text-xs text-emerald-400">🍇 Piek</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
            {peakWines.length} <span className="text-base font-normal text-emerald-400/80">flessen</span>
          </div>
          <p className="text-xs text-emerald-200/80 mt-1 flex items-center gap-1">
            <span>Direct drinkklaar in voorraad</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </p>
        </div>

        <div
          onClick={onNavigateToCalendar}
          className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 shadow-sm cursor-pointer hover:border-amber-600 transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
              Drink eerst (2026)
            </div>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
            {urgentWines.length} <span className="text-base font-normal text-amber-400/80">flessen</span>
          </div>
          <p className="text-xs text-amber-200/80 mt-1 flex items-center gap-1">
            <span>Naderen einde drinkperiode</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
          </p>
        </div>
      </div>

      {/* Alert banner if urgent wines exist */}
      {urgentWines.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/80 via-stone-900 to-stone-900 border border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-900/60 text-amber-300 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">
                {urgentWines.length} {urgentWines.length === 1 ? 'wijn nadert' : 'wijnen naderen'} het einde van hun drinkperiode in 2026!
              </h3>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">
                Drink deze flessen bij voorkeur komend seizoen om te voorkomen dat frisheid en fruit verloren gaan.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToCalendar}
            className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-100 font-semibold text-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md"
          >
            <span>Bekijk in Wijnkalender</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Nu interessant on left, Climate Capacity Meter & Food Pairing on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Nu Interessant */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-bold text-stone-100">
                  Nu interessant om te drinken
                </h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Alleen wijnen die nú op hun piek zijn of hun einde naderen (jonge bewaarwijnen zoals Bramare zijn hier uitgesloten).
              </p>
            </div>
          </div>

          {interestingList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {interestingList.map(({ wine, reason }) => (
                <div key={wine.id} className="relative group">
                  <WineCard
                    wine={wine}
                    onClick={() => onSelectWine(wine)}
                    onDrinkOne={e => {
                      e.stopPropagation();
                      onDrinkOne(wine);
                    }}
                    onToggleFavorite={e => {
                      e.stopPropagation();
                      onToggleFavorite(wine);
                    }}
                  />
                  {reason && (
                    <div className="mt-1 px-3 py-1 text-[11px] rounded-lg bg-stone-900/90 text-stone-300 border border-stone-800 flex items-center gap-1.5">
                      <span>💡</span>
                      <span className="truncate">{reason}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-2">
              <p className="text-sm text-stone-300 font-medium">
                Geen flessen die met spoed gedronken hoeven te worden.
              </p>
              <p className="text-xs text-stone-500">
                Al je voorraad ligt rustig te rijpen voor latere seizoenen!
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Klimaatkast Capaciteitsmeter & Spijsadvies snelkoppeling */}
        <div className="space-y-6">
          {/* Klimaatkast Capaciteitsmeter Widget */}
          <CabinetCapacityWidget
            wines={wines}
            capacity={cabinetCapacity}
            onUpdateCapacity={onUpdateCapacity}
            onUpdateWine={onUpdateWine}
          />

          {/* Quick link to Sommelier Food Pairing */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-950/60 to-stone-900 border border-rose-900/40 space-y-3 shadow-lg">
            <h4 className="text-sm font-bold text-rose-200">Wat gaan we vanavond eten?</h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              Laat de AI Sommelier je gerecht analyseren tegen je actuele kelder. Witvis krijgt fris wit, stoofpot krachtig rood!
            </p>
            <button
              onClick={onNavigateToAdvice}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-rose-950/50 cursor-pointer"
            >
              <span>Vraag Wijn-Spijs Advies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
