import React, { useState, useMemo } from 'react';
import { Search, Archive, Star, RotateCcw, Award, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Wine } from '../../types/wine';

interface ArchiveViewProps {
  wines: Wine[];
  onSelectWine: (wine: Wine) => void;
  onRebuyWine: (wine: Wine) => void;
  onRemoveFromArchive: (wine: Wine) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  wines,
  onSelectWine,
  onRebuyWine,
  onRemoveFromArchive
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'favorites' | 'notes'>('all');
  const [showAllTasted, setShowAllTasted] = useState(false);
  const [wineToDeleteFromArchive, setWineToDeleteFromArchive] = useState<Wine | null>(null);

  // Archived wines are those with aantal === 0 (or if showAllTasted is toggled, also those with notes/consumed)
  // Wines where archiveDismissed is true are explicitly excluded.
  const archivedWines = useMemo(() => {
    return wines.filter(w => {
      if (w.archiveDismissed) return false;
      const isOut = Number(w.aantal) === 0;
      if (showAllTasted) {
        const hasHistory = (Number(w.consumed) || 0) > 0 || (w.notes && w.notes.length > 0);
        return isOut || hasHistory;
      }
      return isOut;
    });
  }, [wines, showAllTasted]);

  const filtered = useMemo(() => {
    return archivedWines.filter(w => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullText = `${w.naam} ${w.wijnhuis} ${w.druif} ${w.land} ${w.jaar}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      if (filterType === 'favorites' && !w.favorite) return false;
      if (filterType === 'notes' && (!w.notes || w.notes.length === 0)) return false;

      return true;
    });
  }, [archivedWines, search, filterType]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6 sm:px-6">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-100">
            Archief & Proefgeschiedenis
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-300 font-semibold border border-stone-700">
            {archivedWines.length} wijnen
          </span>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
          Overzicht van opgedronken flessen, persoonlijke proefnotities en herinneringen. Klik op een fles om notities te bekijken of een fles opnieuw toe te voegen aan je voorraad.
        </p>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            placeholder="Zoek in gedronken wijnen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-xs focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-rose-800 text-white'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            Alle gearchiveerde ({archivedWines.length})
          </button>
          <button
            onClick={() => setFilterType('favorites')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'favorites'
                ? 'bg-rose-800 text-white'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>Favorieten</span>
          </button>
          <button
            onClick={() => setFilterType('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1 ${
              filterType === 'notes'
                ? 'bg-rose-800 text-white'
                : 'bg-stone-800 text-stone-400 hover:text-stone-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-rose-400" />
            <span>Met proefnotitie</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(wine => (
            <div
              key={wine.id}
              className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3 flex flex-col justify-between hover:border-stone-700 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                  <span>{wine.archivedAt ? `Gedronken op ${wine.archivedAt}` : 'Opgedronken'}</span>
                  <div className="flex items-center gap-2">
                    {Number(wine.aantal) > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300">
                        {wine.aantal} in voorraad
                      </span>
                    )}
                    {wine.favorite && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  </div>
                </div>

                <h4
                  onClick={() => onSelectWine(wine)}
                  className="font-bold text-stone-100 hover:text-rose-300 transition cursor-pointer text-base line-clamp-1"
                >
                  {wine.naam} {wine.jaar}
                </h4>
                <p className="text-xs text-stone-400">{wine.wijnhuis}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  🍇 {wine.druif} · 📍 {wine.land}
                </p>

                {/* Notes preview if present */}
                {wine.notes && wine.notes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-stone-850 border border-stone-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                      <span>Laatste beoordeling</span>
                      <span>{'★'.repeat(Number(wine.notes[wine.notes.length - 1].score || 4))}</span>
                    </div>
                    <p className="text-xs text-stone-300 italic line-clamp-2">
                      "{wine.notes[wine.notes.length - 1].text}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectWine(wine)}
                  className="text-xs text-stone-400 hover:text-stone-200 transition cursor-pointer"
                >
                  Bekijk geschiedenis
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRebuyWine(wine)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-xs font-semibold transition cursor-pointer"
                    title="Wijn opnieuw gekocht? Zet direct terug in voorraad"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Opnieuw gekocht</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWineToDeleteFromArchive(wine)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-100 border border-rose-900/60 text-xs font-semibold transition cursor-pointer"
                    title="Verwijder alleen uit dit archiefoverzicht"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span className="hidden sm:inline">Verwijder uit archief</span>
                    <span className="sm:hidden">Wis</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-stone-900 border border-stone-800 text-center space-y-2">
          <Archive className="w-8 h-8 text-stone-600 mx-auto" />
          <p className="text-stone-300 text-sm font-semibold">Geen wijnen in het archief</p>
          <p className="text-xs text-stone-500">
            Wijnen komen hier zodra een fles volledig is opgedronken (voorraad = 0).
          </p>
        </div>
      )}

      {/* Confirmation Modal: Verwijder uit archief */}
      {wineToDeleteFromArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-100">
                  Verwijderen uit archief?
                </h3>
                <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                  Weet je zeker dat je <strong>{wineToDeleteFromArchive.naam} {wineToDeleteFromArchive.jaar}</strong> uit het archiefoverzicht wilt verwijderen?
                </p>
              </div>
            </div>

            {/* Clear safety reassurance banner */}
            {Number(wineToDeleteFromArchive.aantal) > 0 ? (
              <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-xs flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-emerald-300">Geen zorgen over je voorraad!</span>
                  <p className="text-[11px] text-stone-300 leading-relaxed">
                    Deze wijn heeft <strong>{wineToDeleteFromArchive.aantal} fles(sen)</strong> in je voorraad (Plank {wineToDeleteFromArchive.plank || 'geen'}). Deze blijven 100% veilig in je kelder en klimaatkast bewaard. Alleen de archiefweergave wordt opgeschoond.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-stone-850 border border-stone-800 text-stone-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Deze fles heeft 0 voorraad en wordt definitief uit je geschiedenis verwijderd.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setWineToDeleteFromArchive(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFromArchive(wineToDeleteFromArchive);
                  setWineToDeleteFromArchive(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md shadow-rose-950/50 cursor-pointer"
              >
                Ja, verwijder uit archief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
