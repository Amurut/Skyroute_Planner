import React from 'react';
import { FlightPlan } from '../types/aviation';

interface HeaderProps {
  flightPlan: FlightPlan;
  onOpenSearch: () => void;
  onOpenGuide: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ flightPlan, onOpenSearch, onOpenGuide, onExport }) => {
  return (
    <header className="fixed top-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-5xl">
      <div className="glass-island px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 shadow-2xl transition-all">
        {/* Brand & Aircraft Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={onOpenSearch}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(76,215,246,0.3)]">
              <span className="material-symbols-outlined text-[19px]">navigation</span>
            </div>
            <span className="font-bold tracking-tight text-white text-[15px] hidden sm:inline">
              SkyRouter <span className="text-[10px] text-primary font-mono font-normal">2024</span>
            </span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Aircraft Picker Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-mono text-on-surface-variant hover:text-white hover:bg-white/[0.08] cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-[15px] text-primary">airsend</span>
            <span className="font-semibold text-white">{flightPlan.aircraft}</span>
            <span className="text-[10px] text-outline">{flightPlan.aircraftEngine}</span>
          </div>
        </div>

        {/* Center: Route Capsule (Editable trigger) */}
        <div
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-primary/40 cursor-pointer transition-all shadow-inner group"
          title="Click to search airports or change route"
        >
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="font-bold text-white group-hover:text-primary transition-colors">
              {flightPlan.origin.icao}
            </span>
            <span className="material-symbols-outlined text-[14px] text-outline">east</span>
            <span className="font-bold text-white group-hover:text-primary transition-colors">
              {flightPlan.destination.icao}
            </span>
          </div>
          <span className="text-white/20">•</span>
          <span className="text-xs font-mono font-semibold text-primary">FL{flightPlan.cruisingAlt / 100}</span>
          <span className="hidden md:inline text-[11px] font-mono text-outline font-medium">
            ({flightPlan.distanceNm} NM)
          </span>
          <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-primary">tune</span>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* SimConnect Live Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_6px_rgba(78,222,163,0.9)]"></span>
            <span className="text-secondary font-medium">MSFS 2024 READY</span>
          </div>

          {/* Pilot's Guide Trigger */}
          <button
            onClick={onOpenGuide}
            className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-on-surface-variant hover:text-white flex items-center justify-center transition-all"
            title="MSFS 2024 Loading Guide & Beginner Tips"
          >
            <span className="material-symbols-outlined text-[17px]">help</span>
          </button>

          {/* Clean Cyan Export Action */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-surface-container-lowest font-medium text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_16px_rgba(76,215,246,0.4)] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">download</span>
            <span className="font-bold hidden sm:inline">Export .PLN</span>
          </button>
        </div>
      </div>
    </header>
  );
};
