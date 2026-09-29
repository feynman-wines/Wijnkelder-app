import React, { useState, useEffect } from 'react';
import { X, Star, Trash2 } from 'lucide-react';
import { Wine, WineNote } from '../types/wine';

interface NoteModalProps {
  wine: Wine | null;
  noteToEdit?: WineNote | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveNote: (wineId: string, note: WineNote) => void;
  onDeleteNote?: (wineId: string, noteId: string) => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({
  wine,
  noteToEdit,
  isOpen,
  onClose,
  onSaveNote,
  onDeleteNote
}) => {
  if (!isOpen || !wine) return null;

  const [score, setScore] = useState<number>(4);
  const [dish, setDish] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setConfirmDelete(false);
    if (noteToEdit) {
      setScore(Number(noteToEdit.score) || 4);
      setDish(noteToEdit.dish || '');
      setOccasion(noteToEdit.occasion || '');
      setText(noteToEdit.text || '');
      setDate(noteToEdit.date || new Date().toISOString().slice(0, 10));
    } else {
      setScore(4);
      setDish('');
      setOccasion('');
      setText('');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [noteToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const savedNote: WineNote = {
      id: noteToEdit ? noteToEdit.id : 'note-' + Date.now(),
      date,
      score,
      dish: dish.trim() || undefined,
      occasion: occasion.trim() || undefined,
      text: text.trim()
    };

    onSaveNote(wine.id, savedNote);
    onClose();
  };

  const handleExecuteDelete = () => {
    if (!noteToEdit || !onDeleteNote) return;
    onDeleteNote(wine.id, noteToEdit.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-stone-100">
              {noteToEdit ? 'Proefnotitie bewerken' : 'Proefnotitie toevoegen'}
            </h3>
            <p className="text-xs text-rose-300 font-medium">{wine.naam} {wine.jaar}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Datum</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Beoordeling</label>
              <div className="flex items-center gap-1 py-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScore(s)}
                    className="p-1 text-stone-500 hover:text-amber-400 transition cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${s <= score ? 'text-amber-400 fill-amber-400' : ''}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Gerecht (optioneel)</label>
            <input
              type="text"
              placeholder="Bijv. Varkenshaas met champignonsaus"
              value={dish}
              onChange={e => setDish(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Gelegenheid (optioneel)</label>
            <input
              type="text"
              placeholder="Bijv. Zondagsdiner"
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Proefnotitie *</label>
            <textarea
              required
              rows={3}
              placeholder="Smaak, zuren, tannines, balans, afdronk..."
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-stone-800">
            {noteToEdit && onDeleteNote ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-300 font-semibold">Zeker weten?</span>
                  <button
                    type="button"
                    onClick={handleExecuteDelete}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Ja, verwijder
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition cursor-pointer"
                  >
                    Nee
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/60 text-xs font-semibold transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Notitie verwijderen</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-semibold transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold transition shadow-md shadow-rose-950/40 cursor-pointer"
              >
                Opslaan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
