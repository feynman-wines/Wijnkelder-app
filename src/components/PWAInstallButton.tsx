import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, Monitor, Apple } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleButtonClick = async () => {
    if (isInstallable) {
      try {
        const success = await install();
        if (!success) {
          setShowGuide(true);
        }
      } catch {
        setShowGuide(true);
      }
    } else {
      setShowGuide(true);
    }
  };

  const modalContent = showGuide ? (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-stone-950/90 backdrop-blur-md p-4 flex items-center justify-center animate-in fade-in">
      <div className="relative w-full max-w-md my-auto rounded-3xl bg-stone-900 border-2 border-amber-500/60 p-5 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-stone-100">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-3">
            <img
              src="pwa-192x192.png"
              alt="Wijnkelder Icoon"
              className="w-12 h-12 rounded-2xl shadow-lg border border-amber-500/50 shrink-0 bg-stone-950"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'icon.svg';
              }}
            />
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-1.5">
                <span>Mijn Wijnkelder</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-amber-300 font-medium">Installeer als app op je telefoon of PC</p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(false)}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct Install Button if supported */}
        {isInstallable && (
          <div className="p-3.5 rounded-2xl bg-amber-950/80 border border-amber-500/60 space-y-2">
            <p className="text-xs text-amber-200 font-semibold">
              Je browser ondersteunt directe installatie met 1 klik:
            </p>
            <button
              onClick={async () => {
                await install();
                setShowGuide(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Nu direct installeren</span>
            </button>
          </div>
        )}

        {/* Platform Selector Tabs */}
        <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800 gap-1 text-xs">
          <button
            onClick={() => setActivePlatform('android')}
            className={`flex-1 py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'android'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`flex-1 py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'ios'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iPad</span>
          </button>
          <button
            onClick={() => setActivePlatform('desktop')}
            className={`flex-1 py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activePlatform === 'desktop'
                ? 'bg-amber-500 text-stone-950 shadow'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Mac</span>
          </button>
        </div>

        {/* Platform Instructions */}
        <div className="text-xs text-stone-300">
          {activePlatform === 'android' && (
            <div className="p-3.5 rounded-2xl bg-stone-800/90 border border-stone-700 space-y-3">
              <div className="font-bold text-stone-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Android (Google Chrome / Samsung Internet)</span>
              </div>
              <div className="space-y-2 text-[12px] leading-relaxed text-stone-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <div>Tik rechtsboven in Chrome op de <strong>drie puntjes (⋮)</strong>.</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <div>Tik op <strong>'App installeren'</strong> (of bij oudere Androids: <strong>'Toevoegen aan startscherm'</strong>).</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <div>Tik op <strong>'Installeren'</strong>. De app verschijnt direct op je startscherm!</div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'ios' && (
            <div className="p-3.5 rounded-2xl bg-stone-800/90 border border-stone-700 space-y-3">
              <div className="font-bold text-stone-100 flex items-center gap-2">
                <Apple className="w-4 h-4 text-amber-400" />
                <span>iPhone / iPad (Safari)</span>
              </div>
              <div className="space-y-2 text-[12px] leading-relaxed text-stone-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <div>Tik onderin Safari op het <strong>Deel-icoontje</strong> (<Share2 className="w-3.5 h-3.5 inline text-amber-400" /> vierkantje met pijl omhoog).</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <div>Scroll omlaag in het deelmenu en tik op <strong>'Zet op beginscherm'</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-amber-400" />).</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <div>Tik rechtsboven op <strong>'Voeg toe'</strong>. Klaar!</div>
                </div>
              </div>
            </div>
          )}

          {activePlatform === 'desktop' && (
            <div className="p-3.5 rounded-2xl bg-stone-800/90 border border-stone-700 space-y-3">
              <div className="font-bold text-stone-100 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>PC / Mac (Chrome / Edge / Brave)</span>
              </div>
              <div className="space-y-2 text-[12px] leading-relaxed text-stone-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                  <div>Kijk rechts in de <strong>adresbalk</strong> van je browser.</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                  <div>Klik op het kleine icoontje met het computertje (<Monitor className="w-3.5 h-3.5 inline text-blue-400" />) of installatiepijltje (<Download className="w-3.5 h-3.5 inline text-blue-400" />).</div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-700 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                  <div>Klik op <strong>'Installeren'</strong> om de app als venster te openen.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => setShowGuide(false)}
          className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-semibold border border-stone-700 transition cursor-pointer"
        >
          Sluiten
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs shadow-md shadow-amber-950/40 transition-all transform active:scale-95 cursor-pointer shrink-0"
        title="Installeer Mijn Wijnkelder als app op je telefoon of computer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Installeer App</span>
        <span className="sm:hidden">App</span>
      </button>

      {typeof document !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
    </>
  );
};
