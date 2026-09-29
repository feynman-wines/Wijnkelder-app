import React, { useState } from 'react';
import { X, Sparkles, Wine as WineIcon, RefreshCw, CheckCircle, Thermometer, MapPin } from 'lucide-react';
import { Wine } from '../types/wine';
import { getWineDrinkStatus } from '../utils/drinkStatus';
import { KlimaatBadge } from './KlimaatBadge';

interface TonightSommelierModalProps {
  isOpen: boolean;
  wines: Wine[];
  onClose: () => void;
  onSelectWine: (wine: Wine) => void;
  onDrinkOne: (wine: Wine) => void;
}

type Mood = 'any' | 'red' | 'white' | 'urgent' | 'top';

export const TonightSommelierModal: React.FC<TonightSommelierModalProps> = ({
  isOpen,
  wines,
  onClose,
  onSelectWine,
  onDrinkOne
}) => {
  if (!isOpen) return null;

  const [selectedMood, setSelectedMood] = useState<Mood>('any');
  const [pickedWine, setPickedWine] = useState<Wine | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const availableWines = wines.filter(w => w.aantal > 0);

  const pickBottle = (mood: Mood = selectedMood) => {
    setIsSpinning(true);
    let candidatePool = [...availableWines];

    if (mood === 'red') {
      candidatePool = candidatePool.filter(w => w.type === 'Rood');
    } else if (mood === 'white') {
      candidatePool = candidatePool.filter(w => w.type.includes('Wit') || w.type === 'Overig');
    } else if (mood === 'urgent') {
      candidatePool = candidatePool.filter(w => {
        const s = getWineDrinkStatus(w);
        return s.status === 'urgent' || (s.endYear && s.endYear <= new Date().getFullYear());
      });
      // Fallback if no urgent wines: candidatePool stays full
      if (candidatePool.length === 0) candidatePool = [...availableWines];
    } else if (mood === 'top') {
      candidatePool = candidatePool.filter(w => Number(w.score) >= 4.0 || w.favorite);
      if (candidatePool.length === 0) candidatePool = [...availableWines];
    }

    // Prefer wines that are ready to drink now over wines that are still maturing
    const peakCandidates = candidatePool.filter(w => {
      const s = getWineDrinkStatus(w);
      return s.status === 'peak' || s.status === 'almost_end' || s.status === 'urgent';
    });

    const finalPool = peakCandidates.length > 0 ? peakCandidates : candidatePool;

    setTimeout(() => {
      if (finalPool.length > 0) {
        const randomIndex = Math.floor(Math.random() * finalPool.length);
        setPickedWine(finalPool[randomIndex]);
      }
      setIsSpinning(false);
    }, 400);
  };

  // If no bottle picked yet, pick one on open
  React.useEffect(() => {
    if (!pickedWine && availableWines.length > 0) {
      pickBottle('any');
    }
  }, []);

  const handleMoodSelect = (mood: Mood) => {
    setSelectedMood(mood);
    pickBottle(mood);
  };

  const drinkStatus = pickedWine ? getWineDrinkStatus(pickedWine) : null;
  const isHeavyRed = pickedWine?.type === 'Rood' && Number(pickedWine.jaar) >= 2018;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100">
                Wat drinken we vanavond?
              </h2>
              <p className="text-xs text-rose-300">
                Jouw persoonlijke kelder-sommelier kiest de perfecte fles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mood filter chips */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Waar heb je trek in?
          </label>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => handleMoodSelect('any')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedMood === 'any'
                  ? 'bg-rose-800 text-white font-semibold shadow-sm'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              🎲 Verras me
            </button>
            <button
              onClick={() => handleMoodSelect('red')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedMood === 'red'
                  ? 'bg-rose-800 text-white font-semibold shadow-sm'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              🍷 Karaktervol Rood
            </button>
            <button
              onClick={() => handleMoodSelect('white')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedMood === 'white'
                  ? 'bg-rose-800 text-white font-semibold shadow-sm'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              🥂 Fris of Romig Wit
            </button>
            <button
              onClick={() => handleMoodSelect('urgent')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedMood === 'urgent'
                  ? 'bg-amber-800 text-white font-semibold shadow-sm'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              🚨 Moet nu op (2026)
            </button>
            <button
              onClick={() => handleMoodSelect('top')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                selectedMood === 'top'
                  ? 'bg-purple-800 text-white font-semibold shadow-sm'
                  : 'bg-stone-850 text-stone-300 hover:bg-stone-800'
              }`}
            >
              💎 Feestelijk / Topfles
            </button>
          </div>
        </div>

        {/* Selected Wine Showcase Card */}
        {pickedWine && (
          <div
            className={`p-5 rounded-3xl bg-gradient-to-br from-stone-850 via-stone-900 to-stone-950 border border-rose-900/40 shadow-xl space-y-4 transition-all duration-300 ${
              isSpinning ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                  {pickedWine.wijnhuis || pickedWine.streek}
                </span>
                <h3 className="text-xl font-black text-stone-100 mt-0.5">
                  {pickedWine.naam}
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  📍 {pickedWine.land} {pickedWine.druif ? `· 🍇 ${pickedWine.druif}` : ''}
                </p>
              </div>

              {pickedWine.jaar && (
                <span className="text-2xl font-mono font-black text-rose-400 bg-stone-900 px-3 py-1 rounded-xl border border-stone-800 shadow-inner">
                  {pickedWine.jaar}
                </span>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {drinkStatus && (
                <span className={`px-2.5 py-1 rounded-lg border font-semibold ${drinkStatus.badgeClass}`}>
                  {drinkStatus.label}
                </span>
              )}
              <KlimaatBadge advies={pickedWine.klimaatAdvies} size="sm" />
              {Number(pickedWine.score) > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800 font-mono font-bold">
                  ★ {Number(pickedWine.score).toFixed(1)} Vivino
                </span>
              )}
            </div>

            {/* Sommelier Advice & Serving Box */}
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-stone-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>Locatie: {pickedWine.plank ? `Plank ${pickedWine.plank}` : (pickedWine.opslag || 'Kast')}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-stone-400">
                  <Thermometer className="w-3.5 h-3.5" />
                  <span>{pickedWine.temperatuur || (pickedWine.type === 'Rood' ? '16–18 °C' : '8–10 °C')}</span>
                </span>
              </div>

              {isHeavyRed ? (
                <p className="text-rose-200 text-[11px] leading-relaxed bg-rose-950/40 p-2 rounded-xl border border-rose-900/40">
                  🫗 <strong>Serveertip:</strong> Trek de kurk 1 à 2 uur van tevoren of schenk over in een karaf. De tannines worden daardoor heerlijk fluweelzacht.
                </p>
              ) : pickedWine.eten ? (
                <p className="text-stone-300 text-[11px] leading-relaxed">
                  🍽️ <strong>Lekker bij:</strong> {pickedWine.eten}
                </p>
              ) : null}
            </div>

            {/* Quick Actions inside modal */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onDrinkOne(pickedWine);
                  onClose();
                }}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs transition shadow-lg shadow-rose-950/60 cursor-pointer"
              >
                <span>🍷 Deze fles openen</span>
              </button>

              <button
                type="button"
                onClick={() => pickBottle()}
                disabled={isSpinning}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 font-semibold text-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>Andere suggestie</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectWine(pickedWine);
                  onClose();
                }}
                className="w-full sm:w-auto px-3 py-2.5 text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer"
              >
                Wijn bekijken
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
