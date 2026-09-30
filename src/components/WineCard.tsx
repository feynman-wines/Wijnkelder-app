import React from 'react';
import { Star, MapPin, Sparkles, AlertTriangle, Thermometer } from 'lucide-react';
import { Wine } from '../types/wine';
import { getWineDrinkStatus } from '../utils/drinkStatus';
import { KlimaatBadge } from './KlimaatBadge';

interface WineCardProps {
  wine: Wine;
  onClick: () => void;
  onDrinkOne: (e: React.MouseEvent) => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

export const WineCard: React.FC<WineCardProps> = ({
  wine,
  onClick,
  onDrinkOne,
  onToggleFavorite,
}) => {
  const drinkStatus = getWineDrinkStatus(wine);
  const scoreNum = Number(wine.score) || 0;

  // Determine wine color category & accent styling
  const isRose = wine.type.toLowerCase().includes('rosé') ||
    wine.naam.toLowerCase().includes('rosé') ||
    wine.druif?.toLowerCase().includes('rosé');

  let styleBorder = 'border-l-4 border-l-rose-700/80';
  let typeLabel = 'Rood';
  let typeBg = 'bg-rose-950/60 text-rose-300 border-rose-900/60';
  let typeIcon = '🍷';

  if (isRose) {
    styleBorder = 'border-l-4 border-l-pink-400';
    typeLabel = 'Rosé';
    typeBg = 'bg-pink-950/60 text-pink-300 border-pink-900/60';
    typeIcon = '🌸';
  } else if (wine.type.includes('Wit') || wine.type.toLowerCase().includes('wit')) {
    styleBorder = 'border-l-4 border-l-amber-400';
    typeLabel = 'Wit';
    typeBg = 'bg-amber-950/50 text-amber-300 border-amber-800/60';
    typeIcon = '🥂';
  } else if (wine.type === 'Overig') {
    styleBorder = 'border-l-4 border-l-emerald-400';
    typeLabel = 'Mousserend / Overig';
    typeBg = 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60';
    typeIcon = '✨';
  }

  // Decanting & serving helper
  const notesText = (wine.opmerkingen || '').toLowerCase();
  const druifText = (wine.druif || '').toLowerCase();
  const isHeavyRed = wine.type === 'Rood' && (druifText.includes('malbec') || druifText.includes('cabernet') || druifText.includes('nebbiolo') || druifText.includes('syrah'));
  const needsDecanting = notesText.includes('decanter') || notesText.includes('karaf') || (isHeavyRed && Number(wine.jaar) >= 2018);

  const servingTemp = wine.temperatuur || (wine.type === 'Rood' ? '16–18 °C' : '8–10 °C');

  return (
    <article
      onClick={onClick}
      className={`group relative bg-stone-900/95 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 ${styleBorder} rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl hover:shadow-black/50 flex flex-col justify-between`}
    >
      <div>
        {/* Top bar: Wine style badge, Drinkstatus & Favorite */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Style pill with direct visual color */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${typeBg}`}>
              <span>{typeIcon}</span>
              <span>{typeLabel}</span>
            </span>

            {/* Drink status badge */}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${drinkStatus.badgeClass}`}
            >
              {drinkStatus.status === 'urgent' && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              {drinkStatus.label}
            </span>

            {/* Climate cabinet advice badge */}
            <KlimaatBadge advies={wine.klimaatAdvies} size="sm" />
          </div>

          <button
            type="button"
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full transition-all cursor-pointer shrink-0 ${
              wine.favorite
                ? 'text-amber-400 bg-amber-400/10'
                : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800'
            }`}
            title={wine.favorite ? 'Verwijder uit favorieten' : 'Markeer als favoriet'}
          >
            <Star className={`w-4 h-4 ${wine.favorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {/* Producent & Wine Name */}
        <div className="mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 line-clamp-1 mb-0.5">
            {wine.wijnhuis || wine.streek || wine.land}
          </p>

          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-stone-100 group-hover:text-rose-300 transition-colors text-base line-clamp-1">
              {wine.naam}
            </h3>
            {wine.jaar && (
              <span className="font-mono text-sm font-extrabold text-stone-200 bg-stone-800 px-2 py-0.5 rounded-md border border-stone-700/60 shrink-0">
                {wine.jaar}
              </span>
            )}
          </div>
        </div>

        {/* Grape & Origin summary */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400 mb-3">
          {wine.druif && (
            <span className="bg-stone-850 text-stone-300 px-2 py-0.5 rounded border border-stone-800 text-[11px]">
              🍇 {wine.druif}
            </span>
          )}
          {wine.land && (
            <span className="text-stone-400 text-[11px]">
              📍 {wine.land} {wine.streek ? `· ${wine.streek}` : ''}
            </span>
          )}
        </div>

        {/* Serving, Decanting & Shelf Info Bar */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800/60">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[11px] text-stone-300 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>{wine.plank ? `Plank ${wine.plank}` : (wine.opslag || 'Geen plank')}</span>
            </span>

            {/* Decanting hint */}
            {needsDecanting && (
              <span className="text-[10px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded" title="Aanbevolen: 1 tot 2 uur vooraf karafferen">
                🫗 Karafferen
              </span>
            )}

            {/* Spijsadvies badge */}
            {wine.eten && (
              <span
                className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded flex items-center gap-1 cursor-help"
                title={`Spijssuggesties: ${wine.eten}`}
              >
                <span>🍽️</span>
                <span className="hidden sm:inline">Spijsadvies</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-mono flex items-center gap-0.5" title="Serveertemperatuur">
              <Thermometer className="w-3 h-3 text-stone-500" />
              <span>{servingTemp}</span>
            </span>

            {scoreNum > 0 && (
              <span className="inline-flex items-center gap-0.5 bg-stone-800/90 text-amber-300 border border-amber-900/40 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {scoreNum.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer bar: Stock & Quick Drink action */}
      <div className="mt-3.5 pt-2.5 border-t border-stone-800 flex items-center justify-between">
        <div className="text-xs">
          <span className="text-stone-400 text-[11px]">Voorraad: </span>
          <span className={`font-bold font-mono text-sm ${wine.aantal > 0 ? 'text-stone-200' : 'text-stone-500'}`}>
            {wine.aantal} {wine.aantal === 1 ? 'fles' : 'flessen'}
          </span>
        </div>

        {wine.aantal > 0 ? (
          <button
            type="button"
            onClick={onDrinkOne}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-200 hover:text-rose-200 border border-stone-700 hover:border-rose-700/60 transition cursor-pointer"
            title="Registreer 1 fles als gedronken"
          >
            <span>🍷 Drink fles</span>
          </button>
        ) : (
          <span className="text-xs text-stone-500 italic">Op voorraad: 0</span>
        )}
      </div>
    </article>
  );
};
