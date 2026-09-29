import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, CheckCircle2, Monitor, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all transform active:scale-95 cursor-pointer shrink-0"
        title="Installeer Mijn Wijnkelder als app op je telefoon of computer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Installeer App</span>
        <span className="md:hidden">App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-stone-900 border border-amber-500/40 p-5 sm:p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-3 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="pwa-192x192.png"
                  alt="Wijnkelder Icoon"
                  className="w-12 h-12 rounded-2xl shadow-md border border-amber-500/50 shrink-0"
                />
                <div>
                  <h3 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                    <span>Mijn Wijnkelder</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-amber-300 font-medium">Installeer als zelfstandige app</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Installeer de app op je startscherm voor een snellere ervaring op volledig scherm mét offline toegang.
            </p>

            {/* Platform Guides */}
            <div className="space-y-3 pt-1 text-xs">
              {/* iOS Guide */}
              <div className="p-3 rounded-2xl bg-stone-850 border border-stone-750 space-y-2">
                <div className="font-bold text-stone-200 flex items-center gap-2 text-xs">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Op iPhone / iPad (Safari)</span>
                </div>
                <div className="space-y-1.5 text-stone-300 pl-6 text-[11px]">
                  <div>1. Tik onderin op het <strong>Deel-icoontje</strong> (<Share2 className="w-3 h-3 inline text-amber-400" /> vierkantje met pijltje omhoog).</div>
                  <div>2. Scroll omlaag en tik op <strong>'Zet op beginscherm'</strong> (<PlusSquare className="w-3 h-3 inline text-amber-400" />).</div>
                  <div>3. Tik rechtsboven op <strong>'Voeg toe'</strong>.</div>
                </div>
              </div>

              {/* Android Guide */}
              <div className="p-3 rounded-2xl bg-stone-850 border border-stone-750 space-y-2">
                <div className="font-bold text-stone-200 flex items-center gap-2 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Op Android (Chrome / Samsung Internet)</span>
                </div>
                <div className="space-y-1.5 text-stone-300 pl-6 text-[11px]">
                  <div>1. Tik op de <strong>drie puntjes (⋮)</strong> rechtsboven in je browser.</div>
                  <div>2. Tik op <strong>'App installeren'</strong> of <strong>'Toevoegen aan startscherm'</strong>.</div>
                  <div>3. Bevestig met <strong>'Installeren'</strong>.</div>
                </div>
              </div>

              {/* Desktop Guide */}
              <div className="p-3 rounded-2xl bg-stone-850 border border-stone-750 space-y-2">
                <div className="font-bold text-stone-200 flex items-center gap-2 text-xs">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span>Op PC / Mac / Laptop (Chrome / Edge)</span>
                </div>
                <div className="space-y-1.5 text-stone-300 pl-6 text-[11px]">
                  <div>Klik rechts in de <strong>adresbalk</strong> op het installatie-icoontje (<Download className="w-3 h-3 inline text-blue-400" /> of 💻) en kies <strong>'Installeren'</strong>.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-md cursor-pointer"
            >
              Sluiten & Doorgaan
            </button>
          </div>
        </div>
      )}
    </>
  );
};
