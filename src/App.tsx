import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Layers, Utensils, Archive, Wine as WineIcon } from 'lucide-react';
import { Wine, WineNote } from './types/wine';
import { INITIAL_WINES } from './data/initialWines';
import { Header } from './components/Header';
import { OverviewView } from './components/views/OverviewView';
import { WineCalendarView } from './components/views/WineCalendarView';
import { StockView } from './components/views/StockView';
import { DrinkAdviceView } from './components/views/DrinkAdviceView';
import { ArchiveView } from './components/views/ArchiveView';
import { WineDetailModal } from './components/WineDetailModal';
import { AddWineModal } from './components/AddWineModal';
import { NoteModal } from './components/NoteModal';
import { TonightSommelierModal } from './components/TonightSommelierModal';
import { RebuyModal } from './components/RebuyModal';
import { exportToExcel } from './utils/exportExcel';

const LOCAL_STORAGE_KEY = 'wijnkelder_wines_v2';
const CABINET_CAPACITY_KEY = 'wijnkelder_cabinet_capacity_v2';

export default function App() {
  const [wines, setWines] = useState<Wine[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load wines from local storage:', e);
    }
    return INITIAL_WINES;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'stock' | 'advice' | 'archive'>('overview');
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTonightModalOpen, setIsTonightModalOpen] = useState(false);
  const [noteTargetWine, setNoteTargetWine] = useState<Wine | null>(null);
  const [noteToEdit, setNoteToEdit] = useState<WineNote | null>(null);
  const [rebuyTargetWine, setRebuyTargetWine] = useState<Wine | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [cabinetCapacity, setCabinetCapacity] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(CABINET_CAPACITY_KEY);
      return saved ? parseInt(saved) || 88 : 88;
    } catch {
      return 88;
    }
  });

  const handleUpdateCapacity = (newCap: number) => {
    setCabinetCapacity(newCap);
    try {
      localStorage.setItem(CABINET_CAPACITY_KEY, String(newCap));
    } catch (e) {
      console.error('Failed to save capacity:', e);
    }
    showToast(`Klimaatkastcapaciteit ingesteld op ${newCap} flessen.`);
  };

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wines));
    } catch (e) {
      console.error('Failed to persist wines to localStorage:', e);
      showToast('Opslagruimte bijna vol. Verwijder eventueel enkele foto’s.');
    }
  }, [wines]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Wine Actions
  const handleUpdateWine = (updated: Wine) => {
    setWines(prev => prev.map(w => w.id === updated.id ? updated : w));
    if (selectedWine?.id === updated.id) {
      setSelectedWine(updated);
    }
    showToast(`Wijzigingen voor ${updated.naam} opgeslagen.`);
  };

  const handleDeleteWine = (id: string) => {
    setWines(prev => prev.filter(w => w.id !== id));
    setSelectedWine(null);
    showToast('Wijn definitief verwijderd.');
  };

  const handleAddWine = (newWine: Wine) => {
    setWines(prev => [newWine, ...prev]);
    setSelectedWine(newWine);
    showToast(`"${newWine.naam}" toegevoegd aan je voorraad!`);
  };

  const handleDrinkOne = (wine: Wine) => {
    if (wine.aantal <= 0) return;

    const newAantal = Math.max(0, wine.aantal - 1);
    const isNowZero = newAantal === 0;

    const updated: Wine = {
      ...wine,
      aantal: newAantal,
      consumed: (wine.consumed || 0) + 1,
      archivedAt: isNowZero ? new Date().toISOString().slice(0, 10) : wine.archivedAt,
      archiveDismissed: false,
      activity: [
        ...(wine.activity || []),
        {
          date: new Date().toISOString().slice(0, 10),
          action: 'Fles gedronken',
          change: -1
        }
      ]
    };

    handleUpdateWine(updated);
    showToast(`1 fles ${wine.naam} geregistreerd als gedronken.`);
    // Directly open note modal to capture rating/tasting note
    setNoteTargetWine(updated);
  };

  const handleToggleFavorite = (wine: Wine) => {
    const updated: Wine = {
      ...wine,
      favorite: !wine.favorite
    };
    handleUpdateWine(updated);
    showToast(updated.favorite ? 'Toegevoegd aan favorieten ★' : 'Verwijderd uit favorieten');
  };

  const handleRemoveFromArchive = (wine: Wine) => {
    if (wine.aantal > 0) {
      // Wine is still in cellar! Keep stock 100% safe, only remove from archive
      const updated: Wine = {
        ...wine,
        consumed: 0,
        archivedAt: undefined,
        archiveDismissed: true
      };
      handleUpdateWine(updated);
      showToast(`${wine.naam} verwijderd uit archief. Je voorraad (${wine.aantal} fl.) blijft veilig in de kelder.`);
    } else {
      // Wine has 0 bottles. Remove from collection
      setWines(prev => prev.filter(w => w.id !== wine.id));
      if (selectedWine?.id === wine.id) setSelectedWine(null);
      showToast(`${wine.naam} verwijderd uit archief.`);
    }
  };

  const handleSaveNote = (wineId: string, note: WineNote) => {
    setWines(prev => prev.map(w => {
      if (w.id === wineId) {
        const existingNotes = w.notes || [];
        const index = existingNotes.findIndex(n => n.id === note.id);
        const updatedNotes = index >= 0
          ? existingNotes.map(n => n.id === note.id ? note : n)
          : [...existingNotes, note];
        return {
          ...w,
          notes: updatedNotes
        };
      }
      return w;
    }));

    if (selectedWine?.id === wineId) {
      setSelectedWine(prev => {
        if (!prev) return null;
        const existingNotes = prev.notes || [];
        const index = existingNotes.findIndex(n => n.id === note.id);
        const updatedNotes = index >= 0
          ? existingNotes.map(n => n.id === note.id ? note : n)
          : [...existingNotes, note];
        return { ...prev, notes: updatedNotes };
      });
    }

    setNoteToEdit(null);
    setNoteTargetWine(null);
    showToast('Proefnotitie succesvol bewaard!');
  };

  const handleDeleteNote = (wineId: string, noteId: string) => {
    setWines(prev => prev.map(w => {
      if (w.id === wineId) {
        return {
          ...w,
          notes: (w.notes || []).filter(n => n.id !== noteId)
        };
      }
      return w;
    }));

    if (selectedWine?.id === wineId) {
      setSelectedWine(prev => prev ? {
        ...prev,
        notes: (prev.notes || []).filter(n => n.id !== noteId)
      } : null);
    }

    showToast('Proefnotitie verwijderd.');
  };

  const handleOpenEditNote = (wine: Wine, note: WineNote) => {
    setNoteTargetWine(wine);
    setNoteToEdit(note);
  };

  const handleRebuy = (wine: Wine) => {
    setRebuyTargetWine(wine);
  };

  const handleConfirmRebuy = (wine: Wine, count: number, plank: string, opslag: string) => {
    const updated: Wine = {
      ...wine,
      aantal: count,
      plank: plank,
      opslag: opslag,
      archivedAt: undefined,
      activity: [
        ...(wine.activity || []),
        {
          date: new Date().toISOString().slice(0, 10),
          action: 'Opnieuw gekocht',
          change: count
        }
      ]
    };

    handleUpdateWine(updated);
    showToast(`${count} fles(sen) ${wine.naam} teruggezet in actuele voorraad!`);
  };

  // Backup & Restore
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(wines, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wijnkelder-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('JSON Back-up succesvol geëxporteerd.');
  };

  const handleExportExcel = () => {
    exportToExcel(wines);
    showToast('Excel (.xlsx) bestand gedownload!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Ongeldig bestandsformaat.');
      }
      setWines(parsed);
      showToast(`${parsed.length} wijnen succesvol geïmporteerd!`);
    } catch (err) {
      showToast('Dit is geen geldig wijnvoorraad JSON-bestand.');
    }
  };

  const handleReset = () => {
    if (window.confirm('Weet je zeker dat je alle data wilt herstellen naar de oorspronkelijke 93 wijnen? Lokale aanpassingen gaan verloren.')) {
      setWines(INITIAL_WINES);
      showToast('Oorspronkelijke wijnvoorraad hersteld (93 wijnen).');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Wil je een lege kelder starten? Hiermee wis je alle huidige wijnen zodat je met een schone lei kunt beginnen (handig om te testen of voor vrienden). Tip: maak eerst een back-up!')) {
      setWines([]);
      showToast('Lege kelder gestart. Je kunt nu eigen wijnen toevoegen!');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-rose-900 selection:text-white pb-20 sm:pb-8">
      {/* Top Header */}
      <Header
        wines={wines}
        onAddClick={() => setIsAddModalOpen(true)}
        onExport={handleExport}
        onExportExcel={handleExportExcel}
        onImport={handleImport}
        onReset={handleReset}
        onClearAll={handleClearAll}
        onOpenTonightSommelier={() => setIsTonightModalOpen(true)}
      />

      {/* Main Tab Navigation */}
      <nav className="bg-stone-900/80 border-b border-stone-800 sticky top-14 z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between sm:justify-start gap-1 sm:gap-4 overflow-x-auto py-2 no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overzicht</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Wijnkalender</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Voorraad</span>
          </button>

          <button
            onClick={() => setActiveTab('advice')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'advice'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Drinkadvies</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-rose-900 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Archief</span>
          </button>
        </div>
      </nav>

      {/* Main Content View */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewView
            wines={wines}
            cabinetCapacity={cabinetCapacity}
            onUpdateCapacity={handleUpdateCapacity}
            onSelectWine={setSelectedWine}
            onDrinkOne={handleDrinkOne}
            onToggleFavorite={handleToggleFavorite}
            onUpdateWine={handleUpdateWine}
            onNavigateToCalendar={() => setActiveTab('calendar')}
            onNavigateToAdvice={() => setActiveTab('advice')}
            onOpenTonightSommelier={() => setIsTonightModalOpen(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <WineCalendarView
            wines={wines}
            onSelectWine={setSelectedWine}
            onDrinkOne={handleDrinkOne}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            wines={wines}
            onSelectWine={setSelectedWine}
            onDrinkOne={handleDrinkOne}
            onToggleFavorite={handleToggleFavorite}
            onAddClick={() => setIsAddModalOpen(true)}
          />
        )}

        {activeTab === 'advice' && (
          <DrinkAdviceView
            wines={wines}
            onSelectWine={setSelectedWine}
            onDrinkOne={handleDrinkOne}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeTab === 'archive' && (
          <ArchiveView
            wines={wines}
            onSelectWine={setSelectedWine}
            onRebuyWine={handleRebuy}
            onRemoveFromArchive={handleRemoveFromArchive}
          />
        )}
      </main>

      {/* Modals */}
      {selectedWine && (
        <WineDetailModal
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onUpdateWine={handleUpdateWine}
          onDeleteWine={handleDeleteWine}
          onDrinkOne={handleDrinkOne}
          onAddNote={wine => {
            setNoteTargetWine(wine);
            setNoteToEdit(null);
          }}
          onEditNote={handleOpenEditNote}
          onDeleteNote={handleDeleteNote}
          onRebuyWine={handleRebuy}
        />
      )}

      <AddWineModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddWine={handleAddWine}
        wines={wines}
        cabinetCapacity={cabinetCapacity}
        onUpdateWine={handleUpdateWine}
      />

      <RebuyModal
        wine={rebuyTargetWine}
        isOpen={Boolean(rebuyTargetWine)}
        onClose={() => setRebuyTargetWine(null)}
        onConfirmRebuy={handleConfirmRebuy}
      />

      <NoteModal
        wine={noteTargetWine}
        noteToEdit={noteToEdit}
        isOpen={Boolean(noteTargetWine)}
        onClose={() => {
          setNoteTargetWine(null);
          setNoteToEdit(null);
        }}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
      />

      <TonightSommelierModal
        isOpen={isTonightModalOpen}
        wines={wines}
        onClose={() => setIsTonightModalOpen(false)}
        onSelectWine={setSelectedWine}
        onDrinkOne={handleDrinkOne}
      />

      {/* Toast notifications */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-700 text-stone-100 text-xs sm:text-sm font-semibold shadow-2xl shadow-black/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>🍷</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
