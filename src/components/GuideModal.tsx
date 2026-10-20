import React, { useState } from 'react';
import { FlightPlan } from '../types/aviation';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightPlan: FlightPlan;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, flightPlan }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyRoute = () => {
    navigator.clipboard.writeText(flightPlan.routeString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
      <div className="glass-island w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">How to Load into MSFS 2024</h3>
              <span className="text-[11px] font-mono text-outline">Seamless Free Flight Import Guide</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.1] text-outline hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Steps Flow */}
        <div className="p-4 space-y-3 font-mono text-xs">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
              1
            </span>
            <div>
              <strong className="text-white block font-sans text-sm">Download the Flight Plan</strong>
              <span className="text-on-surface-variant text-[11px]">
                Clicking <code className="text-primary font-bold">Export .PLN</code> downloads{' '}
                <code className="text-primary font-bold">
                  {flightPlan.origin.icao}_{flightPlan.destination.icao}_MSFS2024.pln
                </code>{' '}
                to your PC.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="w-6 h-6 rounded-lg bg-primary/20 text-primary font-bold flex items-center justify-center shrink-0">
              2
            </span>
            <div>
              <strong className="text-white block font-sans text-sm">Open MSFS World Map</strong>
              <span className="text-on-surface-variant text-[11px]">
                Launch Microsoft Flight Simulator 2024 → Select <strong>Free Flight</strong> to enter the 3D Globe map.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <span className="w-6 h-6 rounded-lg bg-secondary/20 text-secondary font-bold flex items-center justify-center shrink-0">
              3
            </span>
            <div>
              <strong className="text-white block font-sans text-sm">Import &amp; Fly!</strong>
              <span className="text-on-surface-variant text-[11px]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">SPACE</kbd> (or click{' '}
                <strong>More &gt; Load Flight Plan</strong>). Select your downloaded .pln file. The departure runway,
                SID, STAR, cruising altitude, and ILS approach frequency are automatically tuned!
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-black/30 flex items-center justify-between">
          <button
            onClick={handleCopyRoute}
            className="text-xs font-mono text-outline hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">content_copy</span>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy ICAO Route String'}</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-mono text-white transition-colors"
          >
            Got it, Fly Now
          </button>
        </div>
      </div>
    </div>
  );
};
