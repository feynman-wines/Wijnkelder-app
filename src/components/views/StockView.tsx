import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, Plus, Sparkles } from 'lucide-react';
import { Wine, KlimaatAdvies } from '../../types/wine';
import { getWineDrinkStatus } from '../../utils/drinkStatus';
import { WineCard } from '../WineCard';
import { parsePriceRange } from './OverviewView';

interface StockViewProps {
  wines: Wine[];
  onSelectWine: (wine: Wine) => void;
  onDrinkOne: (wine: Wine) => void;
  onToggleFavorite: (wine: Wine) => void;
  onAddClick: () => void;
  initialStatusFilter?: string;
}

export const StockView: React.FC<StockViewProps> = ({
  wines,
  onSelectWine,
  onDrinkOne,
  onToggleFavorite,
  onAddClick,
  initialStatusFilter = ''
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [klimaatFilter, setKlimaatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [highScoreOnly, setHighScoreOnly] = useState(false);
  const [sortBy, setSortBy] = useState('naam');
  const [sortAsc, setSortAsc] = useState(true);

  React.useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const activeWines = wines.filter(w => w.aantal > 0);

  const filteredWines = useMemo(() => {
    return activeWines.filter(w => {
      // 1. Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullText = `${w.naam} ${w.wijnhuis} ${w.druif} ${w.land} ${w.streek} ${w.jaar} ${w.plank}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      // 2. Type filter
      if (typeFilter && w.type !== typeFilter) return false;

      // 3. Klimaatadvies filter
      if (klimaatFilter && w.klimaatAdvies !== klimaatFilter) return false;

      // 4. Drinkstatus filter
      if (statusFilter) {
        const status = getWineDrinkStatus(w);
        if (statusFilter === 'urgent' && status.status !== 'urgent' && status.status !== 'expired') return false;
        if (statusFilter === 'peak' && status.status !== 'peak') return false;
        if (statusFilter === 'maturing' && status.status !== 'maturing') return false;
      }

      // 5. Vivino score filter (4.0+)
      if (highScoreOnly && (Number(w.score) || 0) < 4.0) return false;

      return true;
    }).sort((a, b) => {
      let result = 0;
      if (sortBy === 'naam') {
        result = (a.naam || '').localeCompare(b.naam || '', 'nl', { numeric: true });
      } else if (sortBy === 'jaar') {
        result = (Number(a.jaar) || 0) - (Number(b.jaar) || 0);
      } else if (sortBy === 'score') {
        result = (Number(a.score) || 0) - (Number(b.score) || 0);
      } else if (sortBy === 'aantal') {
        result = a.aantal - b.aantal;
      } else if (sortBy === 'prijs') {
        const [aMin] = parsePriceRange(a.prijs);
        const [bMin] = parsePriceRange(b.prijs);
        result = aMin - bMin;
      } else if (sortBy === 'plank') {
        result = String(a.plank || '').localeCompare(String(b.plank || ''), 'nl', { numeric: true });
      }

      return sortAsc ? result : -result;
    });
  }, [activeWines, search, typeFilter, klimaatFilter, statusFilter, highScoreOnly, sortBy, sortAsc]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100">Actuele Voorraad</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            {filteredWines.length} van {activeWines.length} wijnen geselecteerd &middot;{' '}
            {filteredWines.reduce((s, w) => s + w.aantal, 0)} flessen
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-semibold text-sm transition shadow-md shadow-rose-950/40 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe wijn</span>
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
        {/* Search row */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Zoek op wijnnaam, wijnhuis, druif, land, streek of plank..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm placeholder-stone-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Snelfilters / Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => { setTypeFilter(''); setStatusFilter(''); setHighScoreOnly(false); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              !typeFilter && !statusFilter && !highScoreOnly
                ? 'bg-rose-900/80 text-rose-200 border border-rose-700 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>🌟 Alle</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === 'Rood' ? '' : 'Rood')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              typeFilter === 'Rood'
                ? 'bg-rose-900/90 text-rose-200 border border-rose-700 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>🍷 Rood</span>
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter(typeFilter === 'Wit & rosé' ? '' : 'Wit & rosé')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              typeFilter === 'Wit & rosé'
                ? 'bg-amber-950/90 text-amber-200 border border-amber-700 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>🥂 Wit & rosé</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'urgent' ? '' : 'urgent')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'urgent'
                ? 'bg-red-950/90 text-red-200 border border-red-700 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>🚨 Drink eerst</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'peak' ? '' : 'peak')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'peak'
                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-700 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>✨ Nu op dronk</span>
          </button>
          <button
            type="button"
            onClick={() => setHighScoreOnly(!highScoreOnly)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              highScoreOnly
                ? 'bg-amber-900/90 text-amber-200 border border-amber-600 shadow-sm'
                : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700'
            }`}
          >
            <span>⭐ Vivino 4.0+</span>
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
          {/* Type */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="">Alle types</option>
            <option value="Rood">Rood</option>
            <option value="Wit & rosé">Wit & rosé</option>
            <option value="Overig">Overig</option>
          </select>

          {/* Klimaatadvies */}
          <select
            value={klimaatFilter}
            onChange={e => setKlimaatFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="">Klimaatkast: Alle</option>
            <option value="++">++ Moet er écht in</option>
            <option value="+">+ Aanbevolen</option>
            <option value="+/-">+/- Indien ruimte</option>
            <option value="-">- Niet nodig</option>
          </select>

          {/* Drinkstatus */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="">Drinkstatus: Alle</option>
            <option value="urgent">🚨 Drink eerst (2026)</option>
            <option value="peak">🍷 Nu op dronk</option>
            <option value="maturing">⏳ Laten rijpen</option>
          </select>

          {/* Sortering */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="naam">Sorteer: Naam</option>
            <option value="jaar">Sorteer: Jaargang</option>
            <option value="score">Sorteer: Vivino-score</option>
            <option value="aantal">Sorteer: Aantal flessen</option>
            <option value="prijs">Sorteer: Prijs</option>
            <option value="plank">Sorteer: Plank</option>
          </select>

          {/* Richting */}
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? 'Oplopend ↑' : 'Aflopend ↓'}</span>
          </button>
        </div>
      </div>

      {/* Wine grid */}
      {filteredWines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWines.map(wine => (
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
        <div className="p-12 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-3">
          <p className="text-base text-stone-300 font-semibold">Geen wijnen gevonden</p>
          <p className="text-xs text-stone-500">Pas de zoekopdracht of filters aan om resultaten te zien.</p>
        </div>
      )}
    </div>
  );
};
