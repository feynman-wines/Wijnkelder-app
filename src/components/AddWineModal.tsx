import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRightLeft, Layers, Trash2 } from 'lucide-react';
import { Wine, KlimaatAdvies } from '../types/wine';
import { evaluateKlimaatAdvies } from '../utils/klimaatAdvies';
import { getCabinetSwapCandidates, SwapCandidate } from '../utils/swapSuggestions';
import { compressImageFile } from '../utils/imageCompressor';
import { callBackendApi } from '../utils/apiConfig';
import { findMatchingCellarWine, WineMatchResult } from '../utils/wineMatcher';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (newWine: Wine) => void;
  wines?: Wine[];
  cabinetCapacity?: number;
  onUpdateWine?: (updated: Wine) => void;
}

interface PhotoSlot {
  base64: string;
  mimeType: string;
}

export const AddWineModal: React.FC<AddWineModalProps> = ({
  isOpen,
  onClose,
  onAddWine,
  wines = [],
  cabinetCapacity = 88,
  onUpdateWine
}) => {
  if (!isOpen) return null;

  const [frontPhoto, setFrontPhoto] = useState<PhotoSlot | null>(null);
  const [backPhoto, setBackPhoto] = useState<PhotoSlot | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');
  const [scanError, setScanError] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Wine>>({
    type: 'Rood',
    naam: '',
    wijnhuis: '',
    druif: '',
    jaar: '',
    land: '',
    streek: '',
    alcohol: '',
    prijs: '',
    score: '',
    drinkenTot: '',
    optimaal: '',
    eten: '',
    opmerkingen: '',
    opslag: 'Klimaatkast 1 · Plank 1',
    aantal: 1,
    plank: '1',
    temperatuur: '16–18 °C',
    klimaatAdvies: undefined,
    klimaatReden: '',
    favorite: false,
    notes: [],
    activity: []
  });

  const [selectedSwapCandidate, setSelectedSwapCandidate] = useState<SwapCandidate | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState<boolean>(false);

  const frontCameraInputRef = useRef<HTMLInputElement>(null);
  const frontGalleryInputRef = useRef<HTMLInputElement>(null);
  const backCameraInputRef = useRef<HTMLInputElement>(null);
  const backGalleryInputRef = useRef<HTMLInputElement>(null);

  // Smart check: Does this wine already exist in user's cellar?
  const matchResult: WineMatchResult | null = React.useMemo(() => {
    if (ignoreDuplicateWarning) return null;
    return findMatchingCellarWine(formData, wines);
  }, [formData.naam, formData.wijnhuis, formData.jaar, wines, ignoreDuplicateWarning]);

  const matchingExistingWine = matchResult?.existingWine || null;
  const isExactVintageMatch = matchResult?.isExactVintage ?? false;

  const handleIncrementExisting = () => {
    if (!matchingExistingWine || !onUpdateWine) return;
    const addQty = Number(formData.aantal) || 1;
    const currentQty = Number(matchingExistingWine.aantal) || 0;
    const newTotal = currentQty + addQty;

    const updated: Wine = {
      ...matchingExistingWine,
      aantal: newTotal,
      activity: [
        ...(matchingExistingWine.activity || []),
        {
          date: new Date().toISOString().slice(0, 10),
          action: `Voorraad verhoogd met +${addQty} fles(sen) (totaal ${newTotal})`,
          change: addQty
        }
      ]
    };

    onUpdateWine(updated);
    onClose();
  };

  // Count active bottles in cabinet
  const inCabinetCount = wines
    .filter(w => String(w.plank || '').trim() !== '' && (w.aantal || 0) > 0)
    .reduce((s, w) => s + (Number(w.aantal) || 0), 0);

  const isCabinetFull = inCabinetCount >= cabinetCapacity;
  const isAgingWine = formData.klimaatAdvies === '++' || formData.klimaatAdvies === '+';
  const swapCandidates = getCabinetSwapCandidates(wines);

  const handleFieldChange = (key: keyof Wine, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      if (['type', 'score', 'optimaal', 'drinkenTot'].includes(key) && !isScanning) {
        const auto = evaluateKlimaatAdvies(updated);
        if (!updated.klimaatReden || updated.klimaatReden.startsWith('Cruciale')) {
          updated.klimaatAdvies = auto.advies;
          updated.klimaatReden = auto.reden;
        }
      }
      return updated;
    });
  };

  const handlePhotoSelect = async (
    target: 'front' | 'back',
    file: File
  ) => {
    try {
      setScanError('');
      const compressed = await compressImageFile(file, 1280, 0.85);

      if (target === 'front') {
        setFrontPhoto(compressed);
      } else {
        setBackPhoto(compressed);
      }
      setScanMessage('Foto geladen. Klik op "Etiket scannen" om de AI-analyse te starten.');
    } catch (err: any) {
      console.error('Photo processing error:', err);
      setScanError(err.message || 'Kon foto niet inlezen.');
    }
  };

  const executeAiScan = async (
    front: PhotoSlot | null,
    back: PhotoSlot | null
  ) => {
    const imagesToScan: Array<{ imageBase64: string; mimeType: string }> = [];

    if (front) {
      imagesToScan.push({
        imageBase64: front.base64.split(',')[1] || front.base64,
        mimeType: front.mimeType
      });
    }

    if (back) {
      imagesToScan.push({
        imageBase64: back.base64.split(',')[1] || back.base64,
        mimeType: back.mimeType
      });
    }

    if (imagesToScan.length === 0) {
      setIsScanning(false);
      return;
    }

    setIsScanning(true);
    setScanMessage(
      imagesToScan.length > 1
        ? 'Voor- én achteretiket analyseren via AI...'
        : 'Etiket analyseren en Vivino-data ophalen...'
    );
    setScanError('');

    try {
      const response = await callBackendApi('/api/scan-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imagesToScan })
      });

      if (!response.ok) {
        let errMsg = 'Kon etiket niet analyseren via AI.';
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch {
          if (response.status === 404) {
            errMsg = 'AI-server niet bereikbaar op statische GitHub Pages. Vul de velden hieronder in.';
          }
        }
        throw new Error(errMsg);
      }

      const scannedData = await response.json();

      setFormData(prev => {
        const updated: Partial<Wine> = {
          ...prev,
          ...scannedData,
          aantal: prev.aantal || 1,
          plank: prev.plank || '1'
        };

        const autoAdvies = evaluateKlimaatAdvies(updated);
        updated.klimaatAdvies = autoAdvies.advies;
        updated.klimaatReden = autoAdvies.reden;

        return updated;
      });

      setScanMessage(
        imagesToScan.length > 1
          ? 'Voor- en achteretiket succesvol gecombineerd!'
          : 'Wijn succesvol herkend!'
      );
    } catch (err: any) {
      console.warn('AI scan failed:', err);
      const isNetworkOrFetchError = err?.message?.toLowerCase().includes('failed to fetch') || 
                                    err?.message?.toLowerCase().includes('network') ||
                                    err?.message?.toLowerCase().includes('load failed');
      if (isNetworkOrFetchError) {
        setScanError('AI-scanner vereist de actieve cloud-omgeving. Op statische GitHub Pages kun je de wijn hieronder direct handmatig invullen.');
      } else {
        setScanError(err.message || 'Automatische herkenning mislukt. Vul de gegevens handmatig in.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectSwap = (candidate: SwapCandidate) => {
    setSelectedSwapCandidate(candidate);
    const p = candidate.plank;
    const num = parseInt(p) || 1;
    const cabinetPrefix = num >= 11 ? 'Klimaatkast 2' : 'Klimaatkast 1';
    setFormData(prev => ({
      ...prev,
      plank: p,
      opslag: `${cabinetPrefix} · Plank ${p}`
    }));
  };

  const handleShelfSelect = (shelfValue: string) => {
    if (shelfValue === '') {
      setSelectedSwapCandidate(null);
      setFormData(prev => ({
        ...prev,
        plank: '',
        opslag: 'Huiswijn · donker/rustig, buiten klimaatkast'
      }));
    } else {
      const num = parseInt(shelfValue) || 1;
      const cabinetPrefix = num >= 11 ? 'Klimaatkast 2' : 'Klimaatkast 1';
      setFormData(prev => ({
        ...prev,
        plank: shelfValue,
        opslag: `${cabinetPrefix} · Plank ${shelfValue}`
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.naam) return;

    // If a swap was selected, move the old wine to Donker/Rustig first!
    if (selectedSwapCandidate && onUpdateWine) {
      onUpdateWine({
        ...selectedSwapCandidate.wine,
        plank: '',
        opslag: 'DONKER / RUSTIG (verplaatst uit klimaatkast)'
      });
    }

    const newWine: Wine = {
      id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: formData.type || 'Rood',
      naam: formData.naam || 'Onbekende Wijn',
      wijnhuis: formData.wijnhuis || '',
      druif: formData.druif || '',
      jaar: formData.jaar || '',
      land: formData.land || '',
      streek: formData.streek || '',
      alcohol: formData.alcohol || '',
      prijs: formData.prijs || '',
      score: formData.score || '',
      drinkenTot: formData.drinkenTot || '',
      optimaal: formData.optimaal || '',
      eten: formData.eten || '',
      opmerkingen: formData.opmerkingen || '',
      opslag: formData.opslag || (formData.plank ? `Klimaatkast · Plank ${formData.plank}` : 'DONKER / RUSTIG'),
      aantal: Number(formData.aantal) || 1,
      plank: formData.plank || '',
      temperatuur: formData.temperatuur || (formData.type === 'Rood' ? '16–18 °C' : '8–10 °C'),
      klimaatAdvies: formData.klimaatAdvies || '++',
      klimaatReden: formData.klimaatReden || 'Bewaarbehoefte ingeschat.',
      favorite: Boolean(formData.favorite),
      notes: [],
      activity: [
        {
          date: new Date().toISOString().slice(0, 10),
          action: selectedSwapCandidate
            ? `Toegevoegd op Plank ${formData.plank} (geruild met ${selectedSwapCandidate.wine.naam})`
            : 'Toegevoegd aan voorraad',
          change: Number(formData.aantal) || 1
        }
      ],
      addedAt: new Date().toISOString().slice(0, 10)
    };

    onAddWine(newWine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-100">
                Nieuwe wijn toevoegen
              </h2>
              <p className="text-xs text-stone-400">
                Kastbezetting: {inCabinetCount} / {cabinetCapacity} flessen
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
          {/* Photo & AI Scan Section with Front & Back label support */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-stone-850 to-stone-900 border border-rose-900/40 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Foto van etiket scannen (AI)</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Scan vooretiket en optioneel het achteretiket voor maximale nauwkeurigheid
                </p>
              </div>

              {(frontPhoto || backPhoto) && (
                <button
                  type="button"
                  onClick={() => {
                    setFrontPhoto(null);
                    setBackPhoto(null);
                    setScanError('');
                    setScanMessage('');
                  }}
                  className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-rose-900/60 text-stone-300 hover:text-rose-200 border border-stone-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Alle foto's wissen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Foto's wissen</span>
                </button>
              )}
            </div>

            {/* Hidden Inputs for Front Label */}
            <input
              type="file"
              ref={frontCameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoSelect('front', e.target.files[0])}
            />
            <input
              type="file"
              ref={frontGalleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoSelect('front', e.target.files[0])}
            />

            {/* Hidden Inputs for Back Label */}
            <input
              type="file"
              ref={backCameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoSelect('back', e.target.files[0])}
            />
            <input
              type="file"
              ref={backGalleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => e.target.files?.[0] && handlePhotoSelect('back', e.target.files[0])}
            />

            {/* Dual Photo Slots Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Slot 1: Front Label */}
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>1. Vooretiket (Hoofd)</span>
                  </div>
                  {frontPhoto && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Klaar voor scan
                    </span>
                  )}
                </div>

                {frontPhoto ? (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={frontPhoto.base64}
                      alt="Vooretiket preview"
                      className="w-14 h-16 object-cover rounded-lg border border-stone-700 shadow-sm"
                    />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-[11px] text-stone-300 truncate">Voorkant geladen</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => frontCameraInputRef.current?.click()}
                          disabled={isScanning}
                          className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700 cursor-pointer"
                        >
                          Wijzigen
                        </button>
                        <button
                          type="button"
                          onClick={() => setFrontPhoto(null)}
                          className="p-1 rounded-md bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-700 cursor-pointer"
                          title="Voorkant verwijderen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => frontCameraInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/40 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-rose-200" />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => frontGalleryInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                      <span>Galerij</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Slot 2: Back Label */}
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>2. Achteretiket (Optioneel)</span>
                  </div>
                  {backPhoto && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Klaar voor scan
                    </span>
                  )}
                </div>

                {backPhoto ? (
                  <div className="flex items-center gap-2.5">
                    <img
                      src={backPhoto.base64}
                      alt="Achteretiket preview"
                      className="w-14 h-16 object-cover rounded-lg border border-stone-700 shadow-sm"
                    />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <span className="text-[11px] text-stone-300 truncate">Achterkant geladen</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => backCameraInputRef.current?.click()}
                          disabled={isScanning}
                          className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] border border-stone-700 cursor-pointer"
                        >
                          Wijzigen
                        </button>
                        <button
                          type="button"
                          onClick={() => setBackPhoto(null)}
                          className="p-1 rounded-md bg-stone-800 hover:bg-rose-950 text-stone-400 hover:text-rose-300 border border-stone-700 cursor-pointer"
                          title="Achterkant verwijderen"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => backCameraInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-stone-400" />
                      <span>Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => backGalleryInputRef.current?.click()}
                      disabled={isScanning}
                      className="flex-1 py-2 px-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                      <span>Galerij</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Explicit Scan Button (User clicks when ready after taking 1 or 2 photos) */}
            {(frontPhoto || backPhoto) && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => executeAiScan(frontPhoto, backPhoto)}
                  disabled={isScanning}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>{scanMessage || 'Bezig met AI-analyse...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        {frontPhoto && backPhoto
                          ? '✨ Voor- én achteretiket scannen met AI'
                          : '✨ Etiket scannen met AI'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Scan Status & Feedback Bar */}
            {(isScanning || scanError || scanMessage || (frontPhoto || backPhoto)) && (
              <div className="text-xs pt-1">
                {isScanning && (
                  <div className="flex items-center gap-2 text-rose-300 font-medium bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/50">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{scanMessage}</span>
                  </div>
                )}
                {scanError && (
                  <div className="flex items-center gap-2 text-amber-300 font-medium bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>{scanError}</span>
                  </div>
                )}
                {!isScanning && !scanError && (frontPhoto || backPhoto) && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-900/40">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{scanMessage || 'Etiket succesvol herkend & ingevuld!'}</span>
                    </div>
                    {formData.klimaatAdvies && (
                      <div className="text-[11px] text-stone-300 flex items-center gap-1.5 bg-stone-900/90 px-2.5 py-1.5 rounded-lg border border-stone-800">
                        <span className="font-bold text-amber-300">Advies: {formData.klimaatAdvies}</span>
                        <span>·</span>
                        <span className="truncate">{formData.klimaatReden || 'Bewaarbehoefte berekend'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Duplicate / Existing Wine Recognition Banner */}
          {matchingExistingWine && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-stone-850 to-stone-900 border-2 border-purple-600/80 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-purple-200">
                      {isExactVintageMatch
                        ? 'Exacte wijn & jaargang al in je kelder!'
                        : `Wijn al aanwezig in kelder (Jaargang ${matchingExistingWine.jaar || 'ongekend'})`}
                    </h4>
                    <p className="text-[11px] text-purple-300/80">
                      {matchingExistingWine.wijnhuis ? `${matchingExistingWine.wijnhuis} · ` : ''}{matchingExistingWine.druif || matchingExistingWine.type}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIgnoreDuplicateWarning(true)}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                >
                  Negeren
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/50 text-xs text-stone-300 space-y-1">
                <div>
                  📍 Huidige voorraad: <strong className="text-purple-200">{matchingExistingWine.aantal} fles(sen)</strong> op <strong className="text-purple-200">{matchingExistingWine.plank ? `Kastplank ${matchingExistingWine.plank}` : matchingExistingWine.opslag}</strong>
                </div>
                {matchingExistingWine.score && (
                  <div className="text-[11px] text-amber-300/90">
                    ⭐ Vivino: {matchingExistingWine.score} · Drinkvenster: {matchingExistingWine.optimaal || matchingExistingWine.drinkenTot || 'Niet gespecificeerd'}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleIncrementExisting}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/60 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bestaande voorraad verhogen (+{formData.aantal || 1} fles ➔ Totaal {(Number(matchingExistingWine.aantal) || 0) + (Number(formData.aantal) || 1)} flessen)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIgnoreDuplicateWarning(true)}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-300 border border-stone-700 text-xs font-semibold transition cursor-pointer"
                >
                  Als aparte fles invoeren
                </button>
              </div>
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Wijnnaam <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Bijv. Bramare Malbec"
                value={formData.naam || ''}
                onChange={e => handleFieldChange('naam', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Wijnhuis / Producent</label>
              <input
                type="text"
                placeholder="Bijv. Viña Cobos"
                value={formData.wijnhuis || ''}
                onChange={e => handleFieldChange('wijnhuis', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Jaargang</label>
              <input
                type="text"
                placeholder="Bijv. 2021"
                value={formData.jaar || ''}
                onChange={e => handleFieldChange('jaar', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Wijnstijl / Type</label>
              <select
                value={formData.type || 'Rood'}
                onChange={e => handleFieldChange('type', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="Rood">🍷 Rood</option>
                <option value="Wit">🥂 Wit</option>
                <option value="Rosé">🌸 Rosé</option>
                <option value="Overig">✨ Mousserend / Overig / Dessert</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Land</label>
              <input
                type="text"
                placeholder="Bijv. Argentinië"
                value={formData.land || ''}
                onChange={e => handleFieldChange('land', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Streek</label>
              <input
                type="text"
                placeholder="Bijv. Mendoza"
                value={formData.streek || ''}
                onChange={e => handleFieldChange('streek', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Druivenras</label>
              <input
                type="text"
                placeholder="Bijv. Malbec"
                value={formData.druif || ''}
                onChange={e => handleFieldChange('druif', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Aantal flessen</label>
              <input
                type="number"
                min="1"
                step="1"
                value={formData.aantal || 1}
                onChange={e => handleFieldChange('aantal', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500 font-mono font-bold"
              />
            </div>

            {/* Shelf & Cabinet selector */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">
                Opslaglocatie / Plank
              </label>
              <select
                value={formData.plank || ''}
                onChange={e => handleShelfSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              >
                <optgroup label="Klimaatkast 1 (Groot · 10 planken)">
                  <option value="1">Kast 1 · Plank 1</option>
                  <option value="2">Kast 1 · Plank 2</option>
                  <option value="3">Kast 1 · Plank 3</option>
                  <option value="4">Kast 1 · Plank 4</option>
                  <option value="5">Kast 1 · Plank 5</option>
                  <option value="6">Kast 1 · Plank 6</option>
                  <option value="7">Kast 1 · Plank 7</option>
                  <option value="8">Kast 1 · Plank 8</option>
                  <option value="9">Kast 1 · Plank 9</option>
                  <option value="10">Kast 1 · Plank 10</option>
                </optgroup>
                <optgroup label="Klimaatkast 2 (Klein · 4 planken)">
                  <option value="11">Kast 2 · Plank 11</option>
                  <option value="12">Kast 2 · Plank 12</option>
                  <option value="13">Kast 2 · Plank 13</option>
                  <option value="14">Kast 2 · Plank 14</option>
                </optgroup>
                <optgroup label="Buiten klimaatkast">
                  <option value="">Donker / Rustig (geen plank)</option>
                </optgroup>
              </select>
            </div>

            {/* Klimaatkast advies */}
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Klimaatkastadvies</label>
              <select
                value={formData.klimaatAdvies || '++'}
                onChange={e => handleFieldChange('klimaatAdvies', e.target.value as KlimaatAdvies)}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500 font-semibold"
              >
                <option value="++">++ Moet er écht in (lange bewaring)</option>
                <option value="+">+ Aanbevolen</option>
                <option value="+/-">+/- Indien ruimte over</option>
                <option value="-">- Niet nodig</option>
                <option value="--">-- Plekverspilling</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Optimaal drinkvenster</label>
              <input
                type="text"
                placeholder="Bijv. 2026–2038"
                value={formData.optimaal || ''}
                onChange={e => handleFieldChange('optimaal', e.target.value)}
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
                placeholder="Bijv. 4.3"
                value={formData.score || ''}
                onChange={e => handleFieldChange('score', parseFloat(e.target.value) || '')}
                className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Conditional Sommelier Swap Suggestion: ONLY when cabinet is full, wine has ++ advice, and shelf is selected */}
          {isCabinetFull && formData.klimaatAdvies === '++' && Boolean(formData.naam && formData.naam.trim()) && formData.plank !== '' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-stone-850 to-stone-900 border border-amber-800/80 shadow-md space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start gap-2.5">
                <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-200">
                    Klimaatkast is 100% vol ({inCabinetCount}/{cabinetCapacity} flessen) · ++ Bewaaradvies
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Omdat deze wijn het hoogste bewaaradvies (<strong className="text-amber-300">++</strong>) heeft, adviseert de sommelier om een fles met lagere prioriteit naar <em>Donker/Rustig</em> te verplaatsen:
                  </p>
                </div>
              </div>

              {selectedSwapCandidate ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-200">
                        Ruil geselecteerd: {selectedSwapCandidate.wine.naam}
                      </span>
                      <p className="text-[11px] text-stone-300">
                        Nieuwe wijn wordt op <strong>Plank {selectedSwapCandidate.plank}</strong> gelegd. De oude fles verhuist naar Donker/Rustig.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSwapCandidate(null)}
                    className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                  >
                    Wijzigen
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Aanbevolen ruilkandidaten:
                  </span>
                  <div className="space-y-1.5">
                    {swapCandidates.slice(0, 3).map(c => (
                      <div
                        key={c.wine.id}
                        className="p-2.5 rounded-xl bg-stone-900/90 border border-stone-800 hover:border-amber-700/60 flex items-center justify-between gap-2 text-xs transition"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-100">{c.wine.naam}</span>
                            <span className="font-mono text-[10px] bg-stone-800 text-stone-300 px-1.5 py-0.5 rounded border border-stone-700">
                              Plank {c.plank}
                            </span>
                            <span className="text-[10px] text-amber-300 font-medium">
                              {c.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">{c.reason}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectSwap(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-800 hover:bg-amber-700 text-white font-bold text-[11px] transition shrink-0 cursor-pointer shadow-sm"
                        >
                          Ruil plek
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Klimaatkast Argumentatie</label>
            <textarea
              rows={2}
              placeholder="Waarom wel of niet in de klimaatkast..."
              value={formData.klimaatReden || ''}
              onChange={e => handleFieldChange('klimaatReden', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 mb-1">Spijsadvies</label>
            <input
              type="text"
              placeholder="Bijv. Rood vlees, stoofpot, gegrilde groenten"
              value={formData.eten || ''}
              onChange={e => handleFieldChange('eten', e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-stone-100 text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-semibold transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-sm font-semibold transition shadow-md shadow-rose-950/40 cursor-pointer"
            >
              {selectedSwapCandidate ? 'Wijn opslaan & plek ruilen' : 'Wijn opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
