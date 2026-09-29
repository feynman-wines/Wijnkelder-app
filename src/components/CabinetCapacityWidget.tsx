import React, { useState } from 'react';
import { Layers, Settings2, CheckCircle2, ChevronDown, ChevronUp, MapPin, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Wine } from '../types/wine';
import { getCabinetSwapCandidates, SwapCandidate } from '../utils/swapSuggestions';

interface CabinetCapacityWidgetProps {
  wines: Wine[];
  capacity: number;
  onUpdateCapacity: (newCap: number) => void;
  onUpdateWine?: (updated: Wine) => void;
  onFilterByAdvies?: (advies: string) => void;
}

export const CabinetCapacityWidget: React.FC<CabinetCapacityWidgetProps> = ({
  wines,
  capacity,
  onUpdateCapacity,
  onUpdateWine
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showShelves, setShowShelves] = useState(false);
  const [showSwapSuggestions, setShowSwapSuggestions] = useState(false);
  const [inputCap, setInputCap] = useState(String(capacity));
  const [swappedToast, setSwappedToast] = useState<string | null>(null);

  const activeWines = wines.filter(w => w.aantal > 0);

  // All wines where 'plank' is filled in are physically in one of the 2 climate cabinets!
  let inCabinetBottles = 0;
  let inCabinetWineCount = 0;
  let outsideBottles = 0;
  let outsideWineCount = 0;

  // Breakdown of cabinet bottles by climate advice
  let cabinetMust = 0;     // ++
  let cabinetNeutral = 0;  // +/-
  let cabinetLow = 0;      // -

  const plankMap: Record<string, { bottles: number; wines: number }> = {};

  activeWines.forEach(w => {
    const pStr = String(w.plank ?? '').trim();
    const hasPlank = pStr !== '';
    const qty = Number(w.aantal) || 0;

    if (hasPlank) {
      inCabinetBottles += qty;
      inCabinetWineCount++;
      const pName = `Plank ${pStr}`;
      if (!plankMap[pName]) plankMap[pName] = { bottles: 0, wines: 0 };
      plankMap[pName].bottles += qty;
      plankMap[pName].wines++;

      if (w.klimaatAdvies === '++') cabinetMust += qty;
      else if (w.klimaatAdvies === '+/-') cabinetNeutral += qty;
      else cabinetLow += qty;
    } else {
      outsideBottles += qty;
      outsideWineCount++;
    }
  });

  const percentOccupied = Math.min(100, Math.round((inCabinetBottles / capacity) * 100));
  const freeSpots = Math.max(0, capacity - inCabinetBottles);
  const overflow = Math.max(0, inCabinetBottles - capacity);
  const isFull = inCabinetBottles >= capacity;

  // Split shelves into Cabinet 1 (Plank 1–10) and Cabinet 2 (Plank 11–14)
  const cabinet1Planks = Object.keys(plankMap)
    .filter(p => {
      const num = parseInt(p.replace(/\D/g, '')) || 0;
      return num >= 1 && num <= 10;
    })
    .sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }));

  const cabinet2Planks = Object.keys(plankMap)
    .filter(p => {
      const num = parseInt(p.replace(/\D/g, '')) || 0;
      return num >= 11 && num <= 14;
    })
    .sort((a, b) => a.localeCompare(b, 'nl', { numeric: true }));

  const cabinet1Bottles = cabinet1Planks.reduce((s, p) => s + plankMap[p].bottles, 0);
  const cabinet2Bottles = cabinet2Planks.reduce((s, p) => s + plankMap[p].bottles, 0);

  // Swap candidates
  const swapCandidates = getCabinetSwapCandidates(activeWines);

  const handleSaveCapacity = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(inputCap) || inCabinetBottles;
    onUpdateCapacity(Math.max(10, Math.min(300, parsed)));
    setIsEditing(false);
  };

  const handleMoveCandidateOut = (candidate: SwapCandidate) => {
    if (!onUpdateWine) return;
    const updated: Wine = {
      ...candidate.wine,
      plank: '',
      opslag: 'DONKER / RUSTIG (verplaatst uit klimaatkast)'
    };
    onUpdateWine(updated);
    setSwappedToast(`${candidate.wine.naam} is verplaatst naar Donker/Rustig! Er is nu 1 plek vrij op Plank ${candidate.plank}.`);
    setTimeout(() => setSwappedToast(null), 4000);
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900/95 to-stone-950 border border-stone-800 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-800/80 text-purple-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-stone-100 text-sm sm:text-base">
                Klimaatkast Capaciteit
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                {capacity} plekken
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Kast 1 (Plank 1–10: {cabinet1Bottles} fl.) · Kast 2 (Plank 11–14: {cabinet2Bottles} fl.)
            </p>
          </div>
        </div>

        <div>
          {isEditing ? (
            <form onSubmit={handleSaveCapacity} className="flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="500"
                value={inputCap}
                onChange={e => setInputCap(e.target.value)}
                className="w-16 px-2 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-100 text-xs text-center focus:outline-none focus:border-rose-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-lg bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                Opslaan
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setInputCap(String(capacity));
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer p-1.5 rounded-lg hover:bg-stone-800"
              title="Kastcapaciteit wijzigen"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Capaciteit instellen (88 plekken)</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Capacity Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-300 font-medium">
            Bezetting van beide klimaatkasten:
          </span>
          <span className="font-mono text-stone-200 font-bold">
            {inCabinetBottles} / {capacity} flessen ({percentOccupied}%)
          </span>
        </div>

        <div className="h-3 w-full bg-stone-800 rounded-full overflow-hidden flex border border-stone-700/80">
          <div
            style={{ width: `${Math.min(100, (cabinetMust / capacity) * 100)}%` }}
            className="bg-purple-500 transition-all duration-500"
            title={`++ Bewaarwijnen: ${cabinetMust} flessen`}
          />
          <div
            style={{ width: `${Math.min(100 - (cabinetMust / capacity) * 100, (cabinetNeutral / capacity) * 100)}%` }}
            className="bg-teal-500 transition-all duration-500"
            title={`+/- Indien ruimte: ${cabinetNeutral} flessen`}
          />
          <div
            style={{ width: `${Math.min(100 - ((cabinetMust + cabinetNeutral) / capacity) * 100, (cabinetLow / capacity) * 100)}%` }}
            className="bg-amber-600 transition-all duration-500"
            title={`- Extra opvulling: ${cabinetLow} flessen`}
          />
        </div>
      </div>

      {/* Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-900/60">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-purple-300">In Klimaatkasten</span>
            <span className="font-mono font-extrabold text-stone-100 text-sm">{inCabinetBottles}</span>
          </div>
          <p className="text-[10px] text-stone-400">
            Kast 1: {cabinet1Bottles} fl. · Kast 2: {cabinet2Bottles} fl.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-850 border border-stone-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-stone-300">Donker / Rustig</span>
            <span className="font-mono font-extrabold text-stone-100 text-sm">{outsideBottles}</span>
          </div>
          <p className="text-[10px] text-stone-400">
            {outsideWineCount} wijnen buiten kasten
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-stone-850 border border-stone-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-teal-300">Vrije Plekken</span>
            <span className="font-mono font-extrabold text-stone-100 text-sm">
              {freeSpots > 0 ? freeSpots : '0 (Vol)'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400">
            {overflow > 0 ? `${overflow} flessen overboekt` : `${freeSpots} plekken beschikbaar`}
          </p>
        </div>
      </div>

      {/* Inline Toast after swap */}
      {swappedToast && (
        <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{swappedToast}</span>
        </div>
      )}

      {/* Swap suggestions banner / trigger when full */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-stone-900 to-stone-900 border border-amber-900/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-stone-200">
              Ruilsuggesties {isFull ? '(Kast is 100% vol)' : '(Plek vrijmaken)'}
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowSwapSuggestions(!showSwapSuggestions)}
            className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
          >
            <span>{showSwapSuggestions ? 'Verberg suggesties' : 'Wie kan eruit?'}</span>
            {showSwapSuggestions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <p className="text-[11px] text-stone-400 leading-relaxed">
          Wil je een nieuwe bewaarwijn in de klimaatkast leggen? De sommelier heeft de ideale kandidaten geselecteerd die veilig naar 'donker/rustig' kunnen verhuizen.
        </p>

        {showSwapSuggestions && (
          <div className="space-y-2 pt-1 border-t border-stone-800">
            {swapCandidates.slice(0, 4).map(c => (
              <div
                key={c.wine.id}
                className="p-2.5 rounded-xl bg-stone-850/90 border border-stone-800 hover:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-200">{c.wine.naam}</span>
                    <span className="font-mono text-[10px] bg-stone-800 px-1.5 py-0.5 rounded text-stone-300 border border-stone-700">
                      Plank {c.plank}
                    </span>
                    <span className="text-[10px] text-amber-300 font-medium">
                      {c.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5">{c.reason}</p>
                </div>

                {onUpdateWine && (
                  <button
                    type="button"
                    onClick={() => handleMoveCandidateOut(c)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-900/50 hover:bg-amber-800 text-amber-200 border border-amber-700/60 font-semibold text-[11px] transition shrink-0 cursor-pointer"
                    title="Verplaats deze fles naar Donker / Rustig"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Verhuis naar Donker</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Shelf Breakdown with Cabinet 1 & Cabinet 2 distinction */}
      <div className="pt-1 border-t border-stone-800">
        <button
          type="button"
          onClick={() => setShowShelves(!showShelves)}
          className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Bekijk per klimaatkast (Kast 1: 10 planken · Kast 2: 4 planken)</span>
          </span>
          {showShelves ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showShelves && (
          <div className="space-y-4 pt-3 text-xs">
            {/* Cabinet 1: Large (Planks 1-10) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-stone-300 font-bold text-xs pb-1 border-b border-stone-800">
                <span>🍇 Klimaatkast 1 (Groot · Planken 1 t/m 10)</span>
                <span className="font-mono text-purple-300">{cabinet1Bottles} flessen</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {cabinet1Planks.map(pName => {
                  const data = plankMap[pName];
                  return (
                    <div key={pName} className="p-2 rounded-xl bg-stone-850/80 border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-300 font-semibold">{pName}</span>
                      <span className="font-mono text-stone-200 font-bold bg-stone-800 px-2 py-0.5 rounded">
                        {data.bottles} fl.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cabinet 2: Small (Planks 11-14) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-stone-300 font-bold text-xs pb-1 border-b border-stone-800">
                <span>🍾 Klimaatkast 2 (Klein · Planken 11 t/m 14)</span>
                <span className="font-mono text-purple-300">{cabinet2Bottles} flessen</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {cabinet2Planks.map(pName => {
                  const data = plankMap[pName];
                  return (
                    <div key={pName} className="p-2 rounded-xl bg-stone-850/80 border border-stone-800 flex items-center justify-between">
                      <span className="text-stone-300 font-semibold">{pName}</span>
                      <span className="font-mono text-stone-200 font-bold bg-stone-800 px-2 py-0.5 rounded">
                        {data.bottles} fl.
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
