import React, { useState } from 'react';
import { Utensils, Sparkles, Loader2, Info, Thermometer, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Wine } from '../../types/wine';
import { findWinePairings, PairingResult } from '../../utils/pairingEngine';
import { WineCard } from '../WineCard';
import { callBackendApi } from '../../utils/apiConfig';

interface DrinkAdviceViewProps {
  wines: Wine[];
  onSelectWine: (wine: Wine) => void;
  onDrinkOne: (wine: Wine) => void;
  onToggleFavorite: (wine: Wine) => void;
}

interface AISommelierPick {
  wineId: string;
  naam: string;
  jaar: string;
  matchScore: number;
  waarom: string;
  serveertip: string;
}

interface AISommelierResponse {
  algemeneGastronomie: string;
  picks: AISommelierPick[];
}

const PRESET_DISHES = [
  'Stoofpot / Runderstoof',
  'Gebakken witvis / Zeebaars',
  'Biefstuk / Gegrild rood vlees',
  'Wildzwijn / Hert',
  'Kaasplank / Oude kaas',
  'Gegrilde zalm',
  'Pasta Bolognese'
];

export const DrinkAdviceView: React.FC<DrinkAdviceViewProps> = ({
  wines,
  onSelectWine,
  onDrinkOne,
  onToggleFavorite
}) => {
  const [dishQuery, setDishQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [localResults, setLocalResults] = useState<PairingResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // AI Sommelier state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AISommelierResponse | null>(null);
  const [aiError, setAiError] = useState('');

  const handleLocalPairing = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dishQuery.trim()) return;

    setAiResponse(null);
    setAiError('');
    const results = findWinePairings(wines, dishQuery, typeFilter);
    setLocalResults(results);
    setHasSearched(true);
  };

  const handleAISommelier = async () => {
    if (!dishQuery.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResponse(null);

    try {
      const res = await callBackendApi('/api/sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dish: dishQuery,
          wines: wines
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kon sommelier niet raadplegen.');
      }

      const data: AISommelierResponse = await res.json();
      setAiResponse(data);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Fout bij raadplegen sommelier. Lokale matching wordt getoond.');
      // Fallback to local pairing if AI fails
      handleLocalPairing();
    } finally {
      setAiLoading(false);
    }
  };

  const handlePresetClick = (dish: string) => {
    setDishQuery(dish);
    // Instant trigger
    const results = findWinePairings(wines, dish, typeFilter);
    setLocalResults(results);
    setHasSearched(true);
    setAiResponse(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100">
            Wijn-Spijs Advies
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
            Slimme Gastronomie
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl leading-relaxed">
          Koppel elk gerecht aan de perfecte fles uit jouw actuele voorraad. De zoekfunctie herkent ingrediënten (zoals witvis vs stoofpot) en selecteert passende body, zuren en tannines.
        </p>
      </div>

      {/* Input Hero Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-950/40 via-stone-900 to-stone-900 border border-rose-900/50 space-y-4 shadow-xl">
        <form onSubmit={handleLocalPairing} className="space-y-3">
          <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider">
            Wat ga je vanavond eten?
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Utensils className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                required
                placeholder="Bijv. gegrilde zeebaars, stoofpot, hertenbiefstuk, risotto met paddenstoelen..."
                value={dishQuery}
                onChange={e => setDishQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500 shadow-inner"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3.5 py-3 rounded-2xl bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium focus:outline-none focus:border-rose-500"
            >
              <option value="">Alle types</option>
              <option value="Rood">Alleen Rood</option>
              <option value="Wit & rosé">Alleen Wit & rosé</option>
              <option value="Overig">Alleen Overig</option>
            </select>

            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-100 font-semibold text-xs transition cursor-pointer shrink-0"
            >
              Snelle pairing
            </button>

            <button
              type="button"
              onClick={handleAISommelier}
              disabled={aiLoading || !dishQuery.trim()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-800 to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white font-semibold text-xs transition shadow-lg shadow-rose-950/60 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>AI Sommelier Analyse</span>
            </button>
          </div>
        </form>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] text-stone-400 font-medium block mb-2">
            Of kies direct een populair gerecht:
          </span>
          <div className="flex flex-wrap gap-2">
            {PRESET_DISHES.map(dish => (
              <button
                key={dish}
                onClick={() => handlePresetClick(dish)}
                className={`text-xs px-3 py-1.5 rounded-full border transition cursor-pointer ${
                  dishQuery === dish
                    ? 'bg-rose-900 text-rose-200 border-rose-700'
                    : 'bg-stone-850 hover:bg-stone-800 text-stone-300 border-stone-750'
                }`}
              >
                {dish}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Sommelier Loading State */}
      {aiLoading && (
        <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-400" />
          <h3 className="text-base font-bold text-stone-200">De Sommelier analyseert je kelder...</h3>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            De smaakprofielen, zuren, tannines en drinkvensters van je aanwezige voorraad worden vergeleken met "{dishQuery}".
          </p>
        </div>
      )}

      {/* Error state / info notice */}
      {aiError && (
        <div className="p-3.5 rounded-2xl bg-stone-850 border border-stone-750 text-xs text-stone-300 flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{aiError}</span>
        </div>
      )}

      {/* AI SOMMELIER RESULTS */}
      {aiResponse && (
        <div className="space-y-5">
          {/* Sommelier commentary header */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-stone-900 border border-amber-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Sommelier Notitie & Gastronomische Analyse</span>
            </div>
            <p className="text-sm text-stone-200 leading-relaxed">
              {aiResponse.algemeneGastronomie}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiResponse.picks.map((pick, idx) => {
              const matchedWine = wines.find(w => w.id === pick.wineId);
              return (
                <div
                  key={pick.wineId || idx}
                  className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                        #{idx + 1} Keuze
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        Match: {pick.matchScore}%
                      </span>
                    </div>

                    <div>
                      <h4
                        onClick={() => matchedWine && onSelectWine(matchedWine)}
                        className="font-bold text-stone-100 hover:text-rose-300 transition cursor-pointer text-base"
                      >
                        {pick.naam} {pick.jaar}
                      </h4>
                      {matchedWine && (
                        <p className="text-xs text-stone-400">
                          {matchedWine.druif} · Plank {matchedWine.plank || '1'} ({matchedWine.aantal} flessen)
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-stone-300 leading-relaxed p-3 rounded-xl bg-stone-850 border border-stone-800">
                      <strong>Waarom: </strong>{pick.waarom}
                    </div>

                    <div className="text-xs text-rose-300 font-medium p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/30 flex items-start gap-2">
                      <Thermometer className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                      <span>{pick.serveertip}</span>
                    </div>
                  </div>

                  {matchedWine && (
                    <button
                      onClick={() => onSelectWine(matchedWine)}
                      className="w-full py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold transition cursor-pointer mt-3"
                    >
                      Bekijk flesdetails
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LOCAL / FAST PAIRING RESULTS */}
      {!aiResponse && hasSearched && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-100">
              Passende wijnen uit je voorraad voor "{dishQuery}"
            </h3>
            <span className="text-xs font-mono text-stone-400">
              {localResults.length} suggesties
            </span>
          </div>

          {localResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {localResults.map((result, idx) => (
                <div
                  key={result.wine.id}
                  className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                        #{idx + 1} {idx === 0 ? 'Beste match' : 'Suggestie'}
                      </span>
                      <span className="text-xs font-mono text-stone-400">
                        Score: {result.score} pt
                      </span>
                    </div>

                    <div>
                      <h4
                        onClick={() => onSelectWine(result.wine)}
                        className="font-bold text-stone-100 hover:text-rose-300 transition cursor-pointer text-base line-clamp-1"
                      >
                        {result.wine.naam}
                      </h4>
                      <p className="text-xs text-stone-400 font-medium">
                        {result.wine.wijnhuis} · {result.wine.jaar}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {result.wine.type} · 🍇 {result.wine.druif}
                      </p>
                    </div>

                    {/* Sommelier rich culinary reasoning */}
                    <div className="p-3 rounded-xl bg-stone-850 border border-stone-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Waarom deze combinatie klopt:</span>
                      </div>
                      <p className="text-xs text-stone-300 leading-relaxed italic">
                        "{result.culinaryReason}"
                      </p>
                    </div>

                    {/* Sommelier match reasoning bullets */}
                    <div className="space-y-1.5">
                      {result.matchReasons.map((r, i) => (
                        <div key={i} className="text-xs text-emerald-300/90 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Serving suggestion tip */}
                    {result.serveertip && (
                      <div className="text-[11px] text-rose-200/90 bg-rose-950/30 p-2 rounded-xl border border-rose-900/30 flex items-start gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
                        <span>{result.serveertip}</span>
                      </div>
                    )}

                    {result.caveat && (
                      <div className="text-xs text-amber-300/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span>{result.caveat}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-400">
                      Plank {result.wine.plank || '1'} ({result.wine.aantal} flessen)
                    </span>
                    <button
                      onClick={() => onSelectWine(result.wine)}
                      className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold transition cursor-pointer"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-2">
              <p className="text-stone-300 text-sm font-semibold">
                Geen passende wijn in voorraad gevonden voor "{dishQuery}"
              </p>
              <p className="text-xs text-stone-500">
                Probeer een algemenere term (bijv. "vis", "stoofvlees", "gevogelte") of pas het typefilter aan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
