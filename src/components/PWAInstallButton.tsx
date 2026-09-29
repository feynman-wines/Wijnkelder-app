import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all transform active:scale-95 cursor-pointer"
        title="Installeer de Wijnkelder app op je telefoon of desktop"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installeer App</span>
        <span className="sm:hidden">App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all transform active:scale-95 cursor-pointer"
          title="Installeer op iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">App op iPhone</span>
          <span className="sm:hidden">App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-amber-500/30 p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img src="/pwa-192x192.png" alt="Wijnkelder Icoon" className="w-12 h-12 rounded-2xl shadow-md border border-amber-500/40" />
                  <div>
                    <h3 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                      <span>Mijn Wijnkelder</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    </h3>
                    <p className="text-xs text-stone-400">Installeer als app op iPhone/iPad</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 pt-1 text-xs text-stone-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="w-7 h-7 rounded-lg bg-stone-700 text-amber-400 flex items-center justify-center shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-stone-100 block">Stap 1:</strong>
                    Tik onderin Safari op het <span className="text-amber-300 font-semibold">Deel-icoontje</span> (vierkant met pijltje omhoog).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="w-7 h-7 rounded-lg bg-stone-700 text-amber-400 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-stone-100 block">Stap 2:</strong>
                    Scroll omlaag en tik op <span className="text-amber-300 font-semibold">'Zet op beginscherm'</span>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-800/80 border border-stone-700">
                  <div className="w-7 h-7 rounded-lg bg-stone-700 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-stone-100 block">Stap 3:</strong>
                    Tik rechtsboven op <span className="text-emerald-300 font-semibold">'Voeg toe'</span>. Klaar!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
              >
                Begrepen
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
