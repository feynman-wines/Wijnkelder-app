import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Plus, Minus, Layers, CheckCircle2 } from 'lucide-react';
import { Wine } from '../types/wine';

interface RebuyModalProps {
  wine: Wine | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRebuy: (wine: Wine, count: number, plank: string, opslag: string) => void;
}

export const RebuyModal: React.FC<RebuyModalProps> = ({
  wine,
  isOpen,
  onClose,
  onConfirmRebuy
}) => {
  if (!isOpen || !wine) return null;

  const [count, setCount] = useState<number>(1);
  const [plank, setPlank] = useState<string>(String(wine.plank || '1'));

  useEffect(() => {
    if (wine) {
      setCount(1);
      setPlank(String(wine.plank || '1'));
    }
  }, [wine]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCount = Math.max(1, count || 1);
    let finalOpslag = 'DONKER / RUSTIG';
    if (plank !== '') {
      const pNum = parseInt(plank) || 1;
      const cab = pNum >= 11 ? 'Klimaatkast 2' : 'Klimaatkast 1';
      finalOpslag = `${cab} · Plank ${plank}`;
    }

    onConfirmRebuy(wine, finalCount, plank, finalOpslag);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-100">
                Opnieuw gekocht
              </h2>
              <p className="text-xs text-stone-400">
                Wijn terugzetten in je actuele voorraad
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Wine Summary Card */}
          <div className="p-3.5 rounded-2xl bg-stone-850/80 border border-stone-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-stone-100 text-sm">{wine.naam}</div>
              <div className="text-xs text-stone-400">
                {wine.wijnhuis} {wine.jaar ? `· ${wine.jaar}` : ''}
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 border border-stone-700">
              {wine.type}
            </span>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Hoeveel flessen heb je opnieuw aangeschaft?
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCount(prev => Math.max(1, prev - 1))}
                className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition flex items-center justify-center cursor-pointer border border-stone-700"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                step="1"
                value={count}
                onChange={e => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 py-2 px-3 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-center font-mono font-bold text-base focus:outline-none focus:border-rose-500"
              />

              <button
                type="button"
                onClick={() => setCount(prev => prev + 1)}
                className="w-10 h-10 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold transition flex items-center justify-center cursor-pointer border border-stone-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Shelf / Storage Selector */}
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1.5">
              Waar wil je deze {count === 1 ? 'fles' : 'flessen'} neerleggen?
            </label>
            <select
              value={plank}
              onChange={e => setPlank(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500 cursor-pointer font-medium"
            >
              <optgroup label="Klimaatkast 1 (Groot · Planken 1–10)">
                <option value="1">Klimaatkast 1 · Plank 1</option>
                <option value="2">Klimaatkast 1 · Plank 2</option>
                <option value="3">Klimaatkast 1 · Plank 3</option>
                <option value="4">Klimaatkast 1 · Plank 4</option>
                <option value="5">Klimaatkast 1 · Plank 5</option>
                <option value="6">Klimaatkast 1 · Plank 6</option>
                <option value="7">Klimaatkast 1 · Plank 7</option>
                <option value="8">Klimaatkast 1 · Plank 8</option>
                <option value="9">Klimaatkast 1 · Plank 9</option>
                <option value="10">Klimaatkast 1 · Plank 10</option>
              </optgroup>
              <optgroup label="Klimaatkast 2 (Klein · Planken 11–14)">
                <option value="11">Klimaatkast 2 · Plank 11</option>
                <option value="12">Klimaatkast 2 · Plank 12</option>
                <option value="13">Klimaatkast 2 · Plank 13</option>
                <option value="14">Klimaatkast 2 · Plank 14</option>
              </optgroup>
              <optgroup label="Buiten klimaatkast">
                <option value="">Donker / Rustig (geen kastplank)</option>
              </optgroup>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition shadow-md shadow-rose-950/50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Zet {count} {count === 1 ? 'fles' : 'flessen'} in voorraad</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
