import React, { useRef, useState } from 'react';
import { Plus, Download, Upload, RotateCcw, Wine as WineIcon, Sparkles, FileSpreadsheet, Settings, Trash2, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Wine } from '../types/wine';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  wines: Wine[];
  onAddClick: () => void;
  onExport: () => void;
  onExportExcel?: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  onClearAll?: () => void;
  onOpenTonightSommelier?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wines,
  onAddClick,
  onExport,
  onExportExcel,
  onImport,
  onReset,
  onClearAll,
  onOpenTonightSommelier
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDataMenu, setShowDataMenu] = useState(false);
  const activeWines = wines.filter(w => w.aantal > 0);
  const totalBottles = activeWines.reduce((acc, w) => acc + (Number(w.aantal) || 0), 0);

  return (
    <header className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-900 via-rose-950 to-stone-900 border border-rose-700/50 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-950/40 shrink-0">
            <WineIcon className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-100">
                Mijn Wijnkelder
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 font-medium">
                <Sparkles className="w-3 h-3" /> v2.0 Sommelier
              </span>
            </div>
            <p className="text-xs text-stone-400">
              <span className="font-semibold text-stone-200">{totalBottles}</span> flessen in voorraad &middot;{' '}
              <span className="font-semibold text-stone-200">{activeWines.length}</span> unieke wijnen
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          {onOpenTonightSommelier && (
            <button
              onClick={onOpenTonightSommelier}
              className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-800 text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Wat drinken we vanavond?</span>
            </button>
          )}

          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-rose-950/50 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Wijn toevoegen</span>
            <span className="sm:hidden">Wijn</span>
          </button>

          {/* Data & Backup dropdown menu */}
          <div className="relative">
            <button
              onClick={() => setShowDataMenu(!showDataMenu)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 hover:text-stone-100 text-xs font-medium transition cursor-pointer"
              title="Data beheer, back-up en Excel export"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Back-up & Excel</span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {showDataMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowDataMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-stone-900 border border-stone-700 shadow-2xl p-2 z-40 space-y-1 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 font-bold text-[11px] text-stone-400 uppercase tracking-wider border-b border-stone-800">
                    Exporteren & Opslaan
                  </div>

                  {onExportExcel && (
                    <button
                      onClick={() => {
                        onExportExcel();
                        setShowDataMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-800 text-stone-200 transition text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-emerald-300">Exporteer naar Excel (.xlsx)</div>
                        <div className="text-[10px] text-stone-400">Direct openen in Excel of Google Sheets</div>
                      </div>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onExport();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-800 text-stone-200 transition text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Exporteer back-up (.json)</div>
                      <div className="text-[10px] text-stone-400">Volledige kelderdata inclusief notities</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowDataMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-800 text-stone-200 transition text-left cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Importeer back-up (.json)</div>
                      <div className="text-[10px] text-stone-400">Herstel eerder opgeslagen back-up</div>
                    </div>
                  </button>

                  <div className="pt-1 border-t border-stone-800">
                    <div className="px-3 py-1 font-bold text-[10px] text-stone-500 uppercase tracking-wider">
                      Beheer & Delen
                    </div>

                    {onClearAll && (
                      <button
                        onClick={() => {
                          onClearAll();
                          setShowDataMenu(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-800 text-amber-300 transition text-left cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Start met een lege kelder</div>
                          <div className="text-[10px] text-stone-400">Handig om vanaf 0 te beginnen</div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onReset();
                        setShowDataMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition text-left cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-stone-500 shrink-0" />
                      <div>
                        <div className="font-semibold">Herstel standaard 93 wijnen</div>
                        <div className="text-[10px] text-stone-500">Terug naar fabrieksinstellingen</div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
