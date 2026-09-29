import React, { useState, useRef } from 'react';
import { X, Camera, Image as ImageIcon, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRightLeft, Layers, Trash2 } from 'lucide-react';
import { Wine, KlimaatAdvies } from '../types/wine';
import { evaluateKlimaatAdvies } from '../utils/klimaatAdvies';
import { getCabinetSwapCandidates, SwapCandidate } from '../utils/swapSuggestions';
import { compressImageFile } from '../utils/imageCompressor';

interface AddWineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWine: (newWine: Wine) => void;
  wines?: Wine[];
  cabinetCapacity?: number;
  onUpdateWine?: (updated: Wine) => void;
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

  const [photoPreview, setPhotoPreview] = useState<string>('');
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
    klimaatAdvies: '++',
    klimaatReden: 'Cruciale bewaarwijn met stabiele bewaarbehoefte.',
    favorite: false,
    notes: [],
    activity: []
  });

  const [selectedSwapCandidate, setSelectedSwapCandidate] = useState<SwapCandidate | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Smart check: Does this wine already exist in user's cellar?
  const matchingExistingWine = React.useMemo(() => {
    if (ignoreDuplicateWarning) return null;
    const nameStr = (formData.naam || '').trim().toLowerCase();
    if (nameStr.length < 3) return null;

    const targetYear = formData.jaar ? String(formData.jaar).trim() : '';

    return wines.find(w => {
      const wName = (w.naam || '').trim().toLowerCase();
      const wHouse = (w.wijnhuis || '').trim().toLowerCase();
      const wYear = w.jaar ? String(w.jaar).trim() : '';

      // If both specify a year, they must match
      if (targetYear && wYear && targetYear !== wYear) return false;

      // Exact match or substring match
      const nameMatch = wName === nameStr || 
        wName.includes(nameStr) || 
        nameStr.includes(wName) ||
        (wHouse && nameStr.includes(wHouse));

      return nameMatch;
    });
  }, [formData.naam, formData.jaar, wines, ignoreDuplicateWarning]);

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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanning(true);
      setScanMessage('Foto optimaliseren en etiket scannen...');
      setScanError('');

      // Compress and resize image in-browser to prevent payload size issues
      const { base64, mimeType } = await compressImageFile(file, 1280, 0.85);
      setPhotoPreview(base64);
      await scanLabelWithAI(base64, mimeType);
    } catch (err: any) {
      console.error('Photo processing error:', err);
      setScanError(err.message || 'Kon foto niet inlezen.');
      setIsScanning(false);
    }
  };

  const scanLabelWithAI = async (base64Image: string, mimeType: string) => {
    setIsScanning(true);
    setScanMessage('Etiket analyseren en Vivino-data ophalen via AI...');
    setScanError('');

    try {
      const pureBase64 = base64Image.split(',')[1] || base64Image;

      const response = await fetch('/api/scan-wine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: pureBase64, mimeType })
      });

      if (!response.ok) {
        let errMsg = 'Kon etiket niet analyseren via AI.';
        try {
          const errData = await response.json();
          if (errData.error) errMsg = errData.error;
        } catch {}
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

      setScanMessage('Wijn succesvol herkend!');
    } catch (err: any) {
      console.warn('AI scan failed, falling back:', err);
      setScanError(err.message || 'Automatische herkenning mislukt. Vul de gegevens handmatig in.');
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
          {/* Photo & AI Scan Section with Camera vs Gallery choice */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/40 via-stone-850 to-stone-900 border border-rose-900/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Foto van wijnetiket scannen</span>
                </h3>
                <p className="text-xs text-stone-400">
                  Herkent automatisch jaartal, druif, Vivino-score en bewaaradvies
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Direct Camera Button */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition cursor-pointer"
                  title="Direct foto maken met camera op je telefoon"
                >
                  {isScanning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-rose-200" />
                  )}
                  <span>Camera</span>
                </button>

                {/* Gallery Button */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isScanning}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Kies een bestaande foto uit je bibliotheek"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                  <span>Galerij</span>
                </button>

                {photoPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview('');
                      setScanError('');
                      setScanMessage('');
                    }}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-900/60 text-stone-400 hover:text-rose-300 border border-stone-700 transition cursor-pointer"
                    title="Foto verwijderen"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hidden Input for Direct Camera capture */}
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {/* Hidden Input for Photo Library / Gallery */}
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {photoPreview && (
              <div className="flex items-center gap-3 pt-2">
                <img
                  src={photoPreview}
                  alt="Etiket preview"
                  className="w-16 h-20 object-cover rounded-xl border border-stone-700 shadow-md"
                />
                <div className="text-xs">
                  {isScanning && (
                    <div className="flex items-center gap-2 text-rose-300 font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{scanMessage}</span>
                    </div>
                  )}
                  {scanError && (
                    <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{scanError}</span>
                    </div>
                  )}
                  {!isScanning && !scanError && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Etiket verwerkt. Controleer hieronder de gegevens.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Smart Duplicate / Existing Wine Recognition Banner */}
          {matchingExistingWine && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/70 via-stone-850 to-stone-900 border border-purple-800/80 shadow-lg space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <h4 className="text-xs sm:text-sm font-bold text-purple-200">
                    Bestaande wijn herkend in je kelder!
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIgnoreDuplicateWarning(true)}
                  className="text-[11px] text-stone-400 hover:text-stone-200 underline cursor-pointer"
                >
                  Negeren
                </button>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                Je hebt <strong className="text-purple-300">{matchingExistingWine.naam}</strong> {matchingExistingWine.jaar ? `(${matchingExistingWine.jaar})` : ''} al geregistreerd:
                <br />
                📍 <strong>{matchingExistingWine.aantal} fles(sen)</strong> op <strong>{matchingExistingWine.plank ? `Plank ${matchingExistingWine.plank}` : matchingExistingWine.opslag}</strong>.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleIncrementExisting}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-950/50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Voorraad verhogen (+{formData.aantal || 1} fles)</span>
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

          {/* Sommelier Space Swap Suggestion Banner if cabinet is full and wine has aging potential */}
          {isCabinetFull && (isAgingWine || formData.plank !== '') && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/70 via-stone-850 to-stone-900 border border-amber-800/80 space-y-3">
              <div className="flex items-start gap-2.5">
                <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-200">
                    Klimaatkast is 100% vol ({inCabinetCount}/{cabinetCapacity} flessen)
                  </h4>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    Omdat deze wijn bewaarpotentieel heeft, adviseert de sommelier om een fles met lagere prioriteit of kortere horizon naar 'Donker/Rustig' te verplaatsen:
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
                <option value="++">++ Moet er écht in</option>
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
