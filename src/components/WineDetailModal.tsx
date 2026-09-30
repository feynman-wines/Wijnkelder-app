import React, { useState, useRef } from 'react';
import { X, Star, MapPin, Calendar, Thermometer, Utensils, Award, Edit3, Trash2, Plus, Sparkles, AlertCircle, Info, Camera, Image as ImageIcon, RotateCcw, Loader2, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import { Wine, WineNote, KlimaatAdvies } from '../types/wine';
import { getWineDrinkStatus } from '../utils/drinkStatus';
import { getKlimaatAdviesInfo } from '../utils/klimaatAdvies';
import { KlimaatBadge } from './KlimaatBadge';
import { callBackendApi } from '../utils/apiConfig';
import { generateLocalWineGastronomy, WineGastronomyAnalysis } from '../utils/pairingEngine';

interface WineDetailModalProps {
  wine: Wine | null;
  onClose: () => void;
  onUpdateWine: (updated: Wine) => void;
  onDeleteWine: (id: string) => void;
  onDrinkOne: (wine: Wine) => void;
  onAddNote: (wine: Wine) => void;
  onEditNote?: (wine: Wine, note: WineNote) => void;
  onDeleteNote?: (wineId: string, noteId: string) => void;
  onRebuyWine?: (wine: Wine) => void;
}

export const WineDetailModal: React.FC<WineDetailModalProps> = ({
  wine,
  onClose,
  onUpdateWine,
  onDeleteWine,
  onDrinkOne,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onRebuyWine
}) => {
  if (!wine) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Wine>({ ...wine });
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [confirmDeleteWine, setConfirmDeleteWine] = useState(false);
  const drinkStatus = getWineDrinkStatus(wine);
  const klimaatInfo = getKlimaatAdviesInfo(wine.klimaatAdvies);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // AI Sommelier state for this bottle
  const [aiSommelierLoading, setAiSommelierLoading] = useState(false);
  const [aiSommelierResult, setAiSommelierResult] = useState<WineGastronomyAnalysis | null>(null);
  const [aiSommelierError, setAiSommelierError] = useState<string | null>(null);
  const [isSavedToWine, setIsSavedToWine] = useState(false);

  const handleFetchAiSommelier = async () => {
    setAiSommelierLoading(true);
    setAiSommelierError(null);
    setIsSavedToWine(false);

    try {
      const res = await callBackendApi('/api/wine-sommelier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wine })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'API error');
      }

      const data = await res.json();
      setAiSommelierResult(data);
    } catch (err: any) {
      console.warn('Cloud AI Sommelier unavailable, using smart local sommelier engine:', err?.message);
      // Seamlessly fall back to rich gastronomic sommelier engine
      const localAnalysis = generateLocalWineGastronomy(wine);
      localAnalysis.isOfflineFallback = true;
      setAiSommelierResult(localAnalysis);
      setAiSommelierError(null);
    } finally {
      setAiSommelierLoading(false);
    }
  };

  const handleSaveAiPairingsToWine = () => {
    if (!aiSommelierResult) return;
    const dishSummary = aiSommelierResult.gerechten
      .map(g => `${g.gang}: ${g.gerecht}`)
      .join(' · ');

    const combinedEten = wine.eten
      ? `${wine.eten} | Sommelier: ${dishSummary}`
      : dishSummary;

    const updatedWine = {
      ...wine,
      eten: combinedEten,
      opmerkingen: wine.opmerkingen
        ? `${wine.opmerkingen}\n\n[AI Sommelier Smaakprofiel]: ${aiSommelierResult.smaakprofiel}\n[Serveeradvies]: ${aiSommelierResult.serveeradvies}`
        : `[AI Sommelier Smaakprofiel]: ${aiSommelierResult.smaakprofiel}\n[Serveeradvies]: ${aiSommelierResult.serveeradvies}`
    };

    onUpdateWine(updatedWine);
    setFormData(updatedWine);
    setIsSavedToWine(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWine(formData);
    setIsEditing(false);
  };

  const handleFieldChange = (key: keyof Wine, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({ ...prev, photo: result }));
      onUpdateWine({ ...wine, photo: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: undefined }));
    onUpdateWine({ ...wine, photo: undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍷</span>
            <h2 className="text-lg sm:text-xl font-bold text-stone-100 line-clamp-1">
              {isEditing ? 'Wijn bewerken' : wine.naam}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Bewerken</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {isEditing ? (
            /* EDIT FORM */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Naam wijn *</label>
                  <input
                    type="text"
                    required
                    value={formData.naam}
                    onChange={e => handleFieldChange('naam', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Wijnhuis / Producent</label>
                  <input
                    type="text"
                    value={formData.wijnhuis}
                    onChange={e => handleFieldChange('wijnhuis', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Jaargang</label>
                  <input
                    type="text"
                    value={formData.jaar}
                    onChange={e => handleFieldChange('jaar', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Soort wijn</label>
                  <select
                    value={formData.type}
                    onChange={e => handleFieldChange('type', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="Rood">Rood</option>
                    <option value="Wit & rosé">Wit & rosé</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Land</label>
                  <input
                    type="text"
                    value={formData.land}
                    onChange={e => handleFieldChange('land', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Streek / Appellatie</label>
                  <input
                    type="text"
                    value={formData.streek}
                    onChange={e => handleFieldChange('streek', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Druivenras(sen)</label>
                  <input
                    type="text"
                    value={formData.druif}
                    onChange={e => handleFieldChange('druif', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Aantal flessen</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.aantal}
                    onChange={e => handleFieldChange('aantal', Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Planknummer</label>
                  <input
                    type="text"
                    value={formData.plank}
                    onChange={e => handleFieldChange('plank', e.target.value)}
                    placeholder="Bijv. 2"
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Prijs</label>
                  <input
                    type="text"
                    value={formData.prijs}
                    onChange={e => handleFieldChange('prijs', e.target.value)}
                    placeholder="Bijv. €25–35"
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Vivino-score</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.score}
                    onChange={e => handleFieldChange('score', parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Optimaal drinken</label>
                  <input
                    type="text"
                    value={formData.optimaal}
                    onChange={e => handleFieldChange('optimaal', e.target.value)}
                    placeholder="Bijv. 2026–2038"
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Drinken tot</label>
                  <input
                    type="text"
                    value={formData.drinkenTot}
                    onChange={e => handleFieldChange('drinkenTot', e.target.value)}
                    placeholder="Bijv. 2040"
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Klimaatkast advies dropdown */}
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Klimaatkast Advies</label>
                  <select
                    value={formData.klimaatAdvies}
                    onChange={e => handleFieldChange('klimaatAdvies', e.target.value as KlimaatAdvies)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  >
                    <option value="++">++ Moet er écht in</option>
                    <option value="+">+ Aanbevolen</option>
                    <option value="+/-">+/- Indien ruimte over</option>
                    <option value="-">- Niet nodig</option>
                    <option value="--">-- Plekverspilling</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-1">Serveertemperatuur</label>
                  <input
                    type="text"
                    value={formData.temperatuur}
                    onChange={e => handleFieldChange('temperatuur', e.target.value)}
                    placeholder="Bijv. 16–18 °C"
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Klimaatkast Argumentatie</label>
                <textarea
                  rows={2}
                  value={formData.klimaatReden}
                  onChange={e => handleFieldChange('klimaatReden', e.target.value)}
                  placeholder="Reden waarom deze fles wel of niet in de klimaatkast moet"
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Spijsadvies</label>
                <input
                  type="text"
                  value={formData.eten}
                  onChange={e => handleFieldChange('eten', e.target.value)}
                  placeholder="Bijv. Rood vlees, stoofpot, harde kazen"
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-400 mb-1">Opmerkingen / Notities</label>
                <textarea
                  rows={2}
                  value={formData.opmerkingen}
                  onChange={e => handleFieldChange('opmerkingen', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                {confirmDeleteWine ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-300 font-semibold">Wijn definitief wissen?</span>
                    <button
                      type="button"
                      onClick={() => onDeleteWine(wine.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Ja, verwijder
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWine(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition cursor-pointer"
                    >
                      Nee
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteWine(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/50 text-sm font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Wijn verwijderen</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...wine });
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
                  >
                    Annuleren
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold transition shadow-md shadow-rose-950/40 cursor-pointer"
                  >
                    Wijzigingen opslaan
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
            <>
              {/* Top Banner: Status & Klimaatkast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Drink Status Panel */}
                <div className={`p-4 rounded-2xl border ${drinkStatus.badgeClass} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-75">
                      Drinkstatus
                    </span>
                    <span className="font-bold text-xs">{drinkStatus.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{drinkStatus.reason}</p>
                  <div className="mt-2 text-[11px] font-mono opacity-80">
                    Venster: {wine.optimaal || 'Onbekend'} · Drinken tot: {wine.drinkenTot || 'N.v.t.'}
                  </div>
                </div>

                {/* Klimaatkast Advies Panel */}
                <div className={`p-4 rounded-2xl border ${klimaatInfo.badgeClass} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase tracking-wider font-semibold opacity-75">
                      Klimaatkastadvies
                    </span>
                    <span className="font-bold text-sm">{klimaatInfo.score} {klimaatInfo.title}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">
                    {wine.klimaatReden || klimaatInfo.sommelierRule}
                  </p>
                  <div className="mt-2 text-[11px] font-medium opacity-80 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Huidig: {wine.plank ? `Plank ${wine.plank}` : (wine.opslag || 'Geen vaste plek')}</span>
                  </div>
                </div>
              </div>

              {/* Photo & Key Metrics */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-48 shrink-0 space-y-2">
                  {wine.photo ? (
                    <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-stone-850 border border-stone-800 group shadow-lg">
                      <img src={wine.photo} alt={wine.naam} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex items-end p-2.5 transition">
                        <div className="flex items-center gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex-1 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            title="Maak nieuwe foto met camera"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition"
                            title="Kies uit galerij"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Galerij</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="p-1.5 rounded-lg bg-stone-900/80 hover:bg-rose-950 text-stone-400 hover:text-rose-400 transition"
                            title="Verwijder foto"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-36 sm:h-48 rounded-2xl border-2 border-dashed border-stone-800 bg-stone-850/50 flex flex-col items-center justify-center p-3 text-stone-400 space-y-2">
                      <Camera className="w-6 h-6 text-rose-500/70" />
                      <span className="text-xs font-medium text-stone-300 text-center">Etiket toevoegen</span>
                      <div className="flex items-center gap-1.5 w-full pt-1">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-md shadow-rose-950/40 transition cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Camera</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          className="flex-1 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-[11px] font-semibold flex items-center justify-center gap-1 border border-stone-700 transition cursor-pointer"
                        >
                          <ImageIcon className="w-3 h-3" />
                          <span>Galerij</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hidden file inputs for Camera and Gallery */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <input
                    type="file"
                    ref={galleryInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-stone-100">{wine.naam}</h3>
                      {wine.jaar && (
                        <span className="text-lg font-mono font-bold text-rose-400">
                          {wine.jaar}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-400">{wine.wijnhuis}</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      📍 {wine.land} {wine.streek ? `· ${wine.streek}` : ''}
                    </p>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {wine.druif && (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
                        🍇 {wine.druif}
                      </span>
                    )}
                    {wine.alcohol && (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium">
                        🍷 {wine.alcohol}% vol
                      </span>
                    )}
                    {wine.prijs && (
                      <span className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 font-medium font-mono">
                        💶 {wine.prijs}
                      </span>
                    )}
                    {Number(wine.score) > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        Vivino {Number(wine.score).toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* Stock control & Drink bottle */}
                  <div className="p-3.5 rounded-2xl bg-stone-850/80 border border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-stone-400">Aanwezige voorraad</div>
                      <div className="text-lg font-bold font-mono text-stone-100">
                        {wine.aantal} {wine.aantal === 1 ? 'fles' : 'flessen'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newCount = Math.max(0, wine.aantal - 1);
                          onUpdateWine({ ...wine, aantal: newCount });
                        }}
                        className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition flex items-center justify-center cursor-pointer"
                        title="Verlaag aantal"
                      >
                        -
                      </button>
                      <button
                        onClick={() => {
                          onUpdateWine({ ...wine, aantal: wine.aantal + 1 });
                        }}
                        className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition flex items-center justify-center cursor-pointer"
                        title="Verhoog aantal"
                      >
                        +
                      </button>

                      {wine.aantal > 0 ? (
                        <button
                          onClick={() => onDrinkOne(wine)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-rose-950/50 ml-1"
                        >
                          <span>🍷 Fles gedronken</span>
                        </button>
                      ) : (
                        onRebuyWine && (
                          <button
                            onClick={() => onRebuyWine(wine)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer shadow-md shadow-emerald-950/50 ml-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Opnieuw gekocht</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Serving & Decanting card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-850 to-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Serveer- & Karaffeeradvies</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-stone-200 bg-stone-800 px-2.5 py-0.5 rounded-md border border-stone-700">
                    {wine.temperatuur || (wine.type === 'Rood' ? '16–18 °C' : '8–10 °C')}
                  </span>
                </div>

                {wine.type === 'Rood' && (
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {((wine.opmerkingen || '').toLowerCase().includes('decanter') || (wine.druif || '').toLowerCase().includes('malbec') || Number(wine.jaar) >= 2018) ? (
                      <span>
                        🫗 <strong>Karafferen aanbevolen:</strong> Deze stevige wijn profiteert enorm van 1 tot 2 uur zuurstofcontact in een karaf of door de fles ruim voor het diner te openen. Dit maakt de tannines soepeler.
                      </span>
                    ) : (
                      <span>
                        🍷 <strong>Direct op dronk:</strong> Kan direct geschonken worden. Gebruik ruime Bordeaux- of Bourgogne-glazen voor een optimale geurbeleving.
                      </span>
                    )}
                  </p>
                )}

                {wine.type !== 'Rood' && (
                  <p className="text-xs text-stone-300 leading-relaxed">
                    🥂 <strong>Temperatuurtip:</strong> Niet ijskoud serveren (niet rechtstreeks uit een 4°C koelkast). Bij 8–10 °C komen de complexe fruit- en houttonen veel beter tot hun recht.
                  </p>
                )}
              </div>

              {/* Wine-Food Pairings & AI Sommelier Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-stone-850 to-stone-900 border border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Wijn-Spijs & Gastronomie</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFetchAiSommelier}
                    disabled={aiSommelierLoading}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-800 to-rose-700 hover:from-rose-700 hover:to-rose-600 text-white font-semibold text-xs transition shadow-md shadow-rose-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {aiSommelierLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sommelier raadplegen...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>AI Sommelier Analyse</span>
                      </>
                    )}
                  </button>
                </div>

                {wine.eten ? (
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed">
                    <span className="text-[11px] font-semibold text-stone-400 block mb-1">
                      Huidig spijsadvies:
                    </span>
                    {wine.eten}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">
                    Nog geen specifiek spijsadvies geregistreerd. Klik op "AI Sommelier Analyse" om direct meesterlijke wijn-spijs combinaties voor deze fles te ontdekken.
                  </p>
                )}

                {/* AI Sommelier Loading State */}
                {aiSommelierLoading && (
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 text-center space-y-2">
                    <Loader2 className="w-5 h-5 animate-spin text-rose-400 mx-auto" />
                    <p className="text-xs text-rose-200">
                      De AI-sommelier bestudeert {wine.naam} {wine.jaar} (druif: {wine.druif || 'blend'}, streek: {wine.streek})...
                    </p>
                  </div>
                )}

                {/* AI Sommelier Info/Notice State */}
                {aiSommelierError && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span>{aiSommelierError}</span>
                    </div>
                  </div>
                )}

                {/* AI Sommelier Result Card */}
                {aiSommelierResult && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 via-stone-900 to-stone-900 border border-amber-800/40 space-y-3.5 mt-2 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Gastronomisch Advies van de Sommelier</span>
                      </div>
                      
                      {!isSavedToWine ? (
                        <button
                          type="button"
                          onClick={handleSaveAiPairingsToWine}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] font-semibold transition cursor-pointer border border-amber-900/50"
                        >
                          <span>Opslaan bij fles</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          <span>Opgeslagen!</span>
                        </span>
                      )}
                    </div>

                    {/* Smaakprofiel */}
                    <div className="text-xs text-stone-200 leading-relaxed bg-stone-850/90 p-3 rounded-xl border border-stone-800">
                      <strong className="text-amber-300 font-semibold block mb-0.5">Smaakprofiel:</strong>
                      {aiSommelierResult.smaakprofiel}
                    </div>

                    {/* 3 Gerechten */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
                        Aanbevolen Gerechten:
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {aiSommelierResult.gerechten.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-stone-850 border border-stone-800 space-y-1">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-rose-300">{item.gang}</span>
                              <span className="text-stone-100">{item.gerecht}</span>
                            </div>
                            <p className="text-xs text-stone-300 leading-relaxed">{item.waarom}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Serveeradvies & Afrader */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-3 rounded-xl bg-stone-850/80 border border-stone-800 space-y-1">
                        <span className="font-semibold text-stone-300 block">🌡️ Serveer- & Glasadvies:</span>
                        <p className="text-stone-400">{aiSommelierResult.serveeradvies}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/30 space-y-1">
                        <span className="font-semibold text-rose-300 block">⚠️ Niet combineren met:</span>
                        <p className="text-stone-300">{aiSommelierResult.afrader}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {wine.opmerkingen && (
                <div className="p-4 rounded-2xl bg-stone-850/60 border border-stone-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <span>Achtergrond & Vinificatie</span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">{wine.opmerkingen}</p>
                </div>
              )}

              {/* Tasting notes */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Proefnotities ({wine.notes?.length || 0})</span>
                  </h4>
                  <button
                    onClick={() => onAddNote(wine)}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Notitie toevoegen</span>
                  </button>
                </div>

                {wine.notes && wine.notes.length > 0 ? (
                  <div className="space-y-2">
                    {wine.notes.map(note => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-stone-850 border border-stone-800 space-y-1.5 group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-400">{note.date}</span>
                            {note.score && (
                              <span className="text-amber-400 font-bold">
                                {'★'.repeat(Number(note.score))}{'☆'.repeat(5 - Number(note.score))}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {onEditNote && (
                              <button
                                type="button"
                                onClick={() => onEditNote(wine, note)}
                                className="p-1 rounded-md text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                                title="Notitie bewerken"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDeleteNote && (
                              deletingNoteId === note.id ? (
                                <div className="flex items-center gap-1.5 bg-rose-950 px-2 py-0.5 rounded-lg border border-rose-800 text-[11px]">
                                  <span className="text-rose-200">Wissen?</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteNote(wine.id, note.id);
                                      setDeletingNoteId(null);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-rose-700 hover:bg-rose-600 text-white font-bold transition cursor-pointer"
                                  >
                                    Ja
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingNoteId(null)}
                                    className="px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 transition cursor-pointer"
                                  >
                                    Nee
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeletingNoteId(note.id)}
                                  className="p-1 rounded-md text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition cursor-pointer"
                                  title="Notitie verwijderen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                        {note.dish && (
                          <div className="text-xs text-rose-300 font-medium">
                            🍽️ Gerecht: {note.dish}
                          </div>
                        )}
                        <p className="text-xs text-stone-200 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 italic p-3 rounded-xl bg-stone-850/40 border border-stone-800/60">
                    Nog geen proefnotities geregistreerd voor deze wijn.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
