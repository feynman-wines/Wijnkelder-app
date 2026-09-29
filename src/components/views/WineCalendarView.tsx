import React, { useState } from 'react';
import { Calendar, AlertTriangle, Clock, Layers, Sparkles, MapPin, ChevronDown, ChevronUp, Wine as WineIcon, HelpCircle } from 'lucide-react';
import { Wine } from '../../types/wine';
import { getWineDrinkStatus } from '../../utils/drinkStatus';
import { WineCard } from '../WineCard';

interface WineCalendarViewProps {
  wines: Wine[];
  onSelectWine: (wine: Wine) => void;
  onDrinkOne: (wine: Wine) => void;
  onToggleFavorite: (wine: Wine) => void;
}

type CalendarTab = 'drinkhorizon' | 'planken';

export const WineCalendarView: React.FC<WineCalendarViewProps> = ({
  wines,
  onSelectWine,
  onDrinkOne,
  onToggleFavorite
}) => {
  const [activeTab, setActiveTab] = useState<CalendarTab>('drinkhorizon');
  const [selectedShelf, setSelectedShelf] = useState<string>('all');

  // Horizon accordion states: default has urgent open, or user can toggle any
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    urgent: true,
    soon: false,
    mid: false,
    long: false,
    unknown: false
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const activeWines = wines.filter(w => w.aantal > 0);
  const currentYear = new Date().getFullYear(); // 2026

  // Group wines by drinking horizon
  const urgentWines: Wine[] = []; // End <= 2026
  const soonWines: Wine[] = [];   // End in 2027 or 2028
  const midWines: Wine[] = [];    // End in 2029 - 2032
  const longWines: Wine[] = [];   // End >= 2033 (like Bramare 2021)
  const unknownWines: Wine[] = [];

  activeWines.forEach(wine => {
    const status = getWineDrinkStatus(wine, currentYear);
    const end = status.endYear;

    if (!end) {
      unknownWines.push(wine);
    } else if (end <= currentYear) {
      urgentWines.push(wine);
    } else if (end <= currentYear + 2) {
      soonWines.push(wine);
    } else if (end <= currentYear + 6) {
      midWines.push(wine);
    } else {
      longWines.push(wine);
    }
  });

  // Group wines by physical location / shelf
  const shelfGroups: Record<string, Wine[]> = {};
  activeWines.forEach(wine => {
    const loc = wine.plank
      ? `Plank ${wine.plank}`
      : (wine.opslag || 'Geen vaste plank');
    if (!shelfGroups[loc]) {
      shelfGroups[loc] = [];
    }
    shelfGroups[loc].push(wine);
  });

  const sortedShelves = Object.keys(shelfGroups).sort((a, b) =>
    a.localeCompare(b, 'nl', { numeric: true })
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100">
              Wijnkalender & Drinkhorizon
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
              Drinkstrategie
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
            In één oogopslag de complete tijdlijn van je kelder. Klik op een periode om de bijbehorende wijnen te bekijken.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-stone-900 border border-stone-800 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('drinkhorizon')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'drinkhorizon'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Drinkhorizon (Tijdlijn)</span>
          </button>
          <button
            onClick={() => setActiveTab('planken')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'planken'
                ? 'bg-rose-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Plankzoeker (Locatie)</span>
          </button>
        </div>
      </div>

      {activeTab === 'drinkhorizon' ? (
        /* DRINKHORIZON ACCORDION VIEW */
        <div className="space-y-4">
          {/* Quick Timeline Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-stone-900/90 border border-stone-800">
            <button
              onClick={() => toggleSection('urgent')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                openSections.urgent ? 'bg-amber-950/60 border-amber-700' : 'bg-stone-850/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold text-amber-300 flex items-center justify-between">
                <span>🚨 2026 (Drink eerst)</span>
                <span className="font-mono">{urgentWines.reduce((s, w) => s + w.aantal, 0)}</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">Nadert einde drinkvenster</p>
            </button>

            <button
              onClick={() => toggleSection('soon')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                openSections.soon ? 'bg-orange-950/60 border-orange-700' : 'bg-stone-850/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold text-orange-300 flex items-center justify-between">
                <span>⏳ 2027 – 2028</span>
                <span className="font-mono">{soonWines.reduce((s, w) => s + w.aantal, 0)}</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">Binnenkort aan de beurt</p>
            </button>

            <button
              onClick={() => toggleSection('mid')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                openSections.mid ? 'bg-teal-950/60 border-teal-700' : 'bg-stone-850/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold text-teal-300 flex items-center justify-between">
                <span>🍷 2029 – 2032</span>
                <span className="font-mono">{midWines.reduce((s, w) => s + w.aantal, 0)}</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">Rustig laten rijpen</p>
            </button>

            <button
              onClick={() => toggleSection('long')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                openSections.long ? 'bg-indigo-950/60 border-indigo-700' : 'bg-stone-850/60 border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
                <span>🏰 2033 en later</span>
                <span className="font-mono">{longWines.reduce((s, w) => s + w.aantal, 0)}</span>
              </div>
              <p className="text-[10px] text-stone-400 mt-0.5">Grote bewaarwijnen</p>
            </button>
          </div>

          {/* 1. URGENT / LAATSTE JAAR (2026) */}
          <div className="rounded-2xl border border-amber-800/80 bg-stone-900 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('urgent')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-950/80 to-stone-900 hover:from-amber-950 hover:to-stone-850 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-amber-200">
                      Drink eerst: Nadert einde drinkvenster (2026 of eerder)
                    </h3>
                  </div>
                  <p className="text-xs text-amber-200/75 mt-0.5">
                    Wijnen in het laatste jaar van hun optimale periode of net voorbij. Plan deze flessen dit seizoen in!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-xs bg-amber-900/90 text-amber-200 px-3 py-1 rounded-full border border-amber-700">
                  {urgentWines.reduce((s, w) => s + w.aantal, 0)} flessen ({urgentWines.length} wijnen)
                </span>
                {openSections.urgent ? (
                  <ChevronUp className="w-5 h-5 text-amber-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-amber-300" />
                )}
              </div>
            </button>

            {openSections.urgent && (
              <div className="p-4 sm:p-5 border-t border-amber-900/60 bg-stone-950/50">
                {urgentWines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {urgentWines.map(wine => (
                      <WineCard
                        key={wine.id}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Geen wijnen met acute drinkurgentie dit jaar.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. BINNENKORT (2027 - 2028) */}
          <div className="rounded-2xl border border-orange-900/60 bg-stone-900 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('soon')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-950/60 to-stone-900 hover:from-orange-950/80 hover:to-stone-850 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-orange-200">
                    Binnenkort aan de beurt (2027 – 2028)
                  </h3>
                  <p className="text-xs text-orange-200/75 mt-0.5">
                    Wijnen die nog 1 tot 2 jaar optimaal zijn. Goed om alvast in het achterhoofd te houden voor etentjes.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-xs bg-orange-900/60 text-orange-200 px-3 py-1 rounded-full border border-orange-700/60">
                  {soonWines.reduce((s, w) => s + w.aantal, 0)} flessen ({soonWines.length} wijnen)
                </span>
                {openSections.soon ? (
                  <ChevronUp className="w-5 h-5 text-orange-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-orange-300" />
                )}
              </div>
            </button>

            {openSections.soon && (
              <div className="p-4 sm:p-5 border-t border-orange-900/50 bg-stone-950/50">
                {soonWines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {soonWines.map(wine => (
                      <WineCard
                        key={wine.id}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Geen wijnen in dit tijdvak.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. MIDDELLANGE TERMIJN (2029 - 2032) */}
          <div className="rounded-2xl border border-stone-800 bg-stone-900 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('mid')}
              className="w-full flex items-center justify-between p-4 bg-stone-850 hover:bg-stone-800 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-stone-200">
                    Rustig laten rijpen (2029 – 2032)
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Mooie bewaarfase. Deze wijnen winnen nog aan complexiteit en balans.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-xs bg-stone-800 text-stone-300 px-3 py-1 rounded-full border border-stone-700">
                  {midWines.reduce((s, w) => s + w.aantal, 0)} flessen ({midWines.length} wijnen)
                </span>
                {openSections.mid ? (
                  <ChevronUp className="w-5 h-5 text-stone-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-stone-300" />
                )}
              </div>
            </button>

            {openSections.mid && (
              <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/50">
                {midWines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {midWines.map(wine => (
                      <WineCard
                        key={wine.id}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Geen wijnen in dit tijdvak.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 4. GROTE BEWAARWIJNEN (2033+) */}
          <div className="rounded-2xl border border-indigo-900/60 bg-stone-900 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => toggleSection('long')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-950/50 to-stone-900 hover:from-indigo-950/70 hover:to-stone-850 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-200">
                    Grote Bewaarwijnen (2033 en later)
                  </h3>
                  <p className="text-xs text-indigo-200/75 mt-0.5">
                    Wijnen met een zeer lang bewaarpotentieel (zoals Bramare Malbec 2021). Bewaar in de klimaatkast; nu nog veel te jong voor hun piek!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono font-bold text-xs bg-indigo-900/60 text-indigo-200 px-3 py-1 rounded-full border border-indigo-700/60">
                  {longWines.reduce((s, w) => s + w.aantal, 0)} flessen ({longWines.length} wijnen)
                </span>
                {openSections.long ? (
                  <ChevronUp className="w-5 h-5 text-indigo-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-indigo-300" />
                )}
              </div>
            </button>

            {openSections.long && (
              <div className="p-4 sm:p-5 border-t border-indigo-900/50 bg-stone-950/50">
                {longWines.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {longWines.map(wine => (
                      <WineCard
                        key={wine.id}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 text-center py-4">
                    Geen bewaarwijnen na 2033.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PLANKZOEKER / PHYSICAL LOCATION VIEW */
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-stone-850 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-200">Fysieke locatieweergave</h3>
              <p className="text-xs text-stone-400">
                Gebruik dit overzicht om een specifieke fles snel van de plank te pakken.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-medium">Filter op plank:</span>
              <select
                value={selectedShelf}
                onChange={e => setSelectedShelf(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="all">Alle planken tonen</option>
                {sortedShelves.map(shelf => (
                  <option key={shelf} value={shelf}>
                    {shelf} ({shelfGroups[shelf].length} wijnen)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {sortedShelves
              .filter(shelf => selectedShelf === 'all' || selectedShelf === shelf)
              .map(shelfName => {
                const winesOnShelf = shelfGroups[shelfName];
                const bottleCount = winesOnShelf.reduce((s, w) => s + w.aantal, 0);

                return (
                  <div key={shelfName} className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900 border border-stone-800">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-400" />
                        <h4 className="font-bold text-stone-200 text-sm">{shelfName}</h4>
                      </div>
                      <span className="text-xs font-mono text-stone-400">
                        {winesOnShelf.length} wijnen · {bottleCount} flessen
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {winesOnShelf.map(wine => (
                        <WineCard
                          key={wine.id}
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
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
