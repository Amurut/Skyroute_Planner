import React, { useState } from 'react';
import { FlightPlan } from '../types/aviation';
import { JargonTooltip } from './JargonTooltip';

interface BottomTrayProps {
  flightPlan: FlightPlan;
  onExport: () => void;
}

export const BottomTray: React.FC<BottomTrayProps> = ({ flightPlan, onExport }) => {
  const [activeTab, setActiveTab] = useState<'route' | 'runway' | 'profile' | 'export'>('route');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedRwyType, setSelectedRwyType] = useState<'origin' | 'dest'>('dest');
  const [copied, setCopied] = useState(false);

  // Active runway based on selection
  const activeRunway = selectedRwyType === 'origin' ? flightPlan.originRunway : flightPlan.destRunway;

  const handleCopyRoute = () => {
    navigator.clipboard.writeText(flightPlan.routeString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-5xl transition-all">
      <div className="glass-island rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        {/* Dock Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-white/[0.07] bg-black/20">
          {/* Segmented Tab Triggers */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-mono">
            <button
              onClick={() => {
                setActiveTab('route');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'route'
                  ? 'active-tab font-semibold'
                  : 'text-on-surface-variant hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">route</span>
              <span>Route &amp; Procedures</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('runway');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'runway'
                  ? 'active-tab font-semibold'
                  : 'text-on-surface-variant hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">explore</span>
              <span>Runway &amp; ILS Dial</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('profile');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'active-tab font-semibold'
                  : 'text-on-surface-variant hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">show_chart</span>
              <span>Vertical Profile (VSD)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('export');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeTab === 'export'
                  ? 'active-tab font-semibold'
                  : 'text-on-surface-variant hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">sim_card_download</span>
              <span>MSFS Exporter</span>
            </button>
          </div>

          {/* Quick Info & Collapse */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-outline pr-2">
              <JargonTooltip term="COST_INDEX">
                <span>CI: <strong className="text-white">{flightPlan.costIndex}</strong></span>
              </JargonTooltip>
              <span>• FUEL:</span>
              <span className="text-tertiary font-bold">{flightPlan.blockFuelLbs.toLocaleString()} LBS</span>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-outline hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Panel' : 'Collapse Panel'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isCollapsed ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Panels Content Body */}
        {!isCollapsed && (
          <div className="p-3.5 transition-all max-h-72 overflow-y-auto">
            {/* PANEL 1: Route & Procedures */}
            {activeTab === 'route' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Departure Card */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-mono font-bold">
                            DEP
                          </span>
                          <span className="text-base font-bold text-white tracking-tight">
                            {flightPlan.origin.icao} • {flightPlan.origin.name}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-outline mt-1">
                          Elev {flightPlan.origin.elevation} FT • RWY {flightPlan.originRunway.ident}
                        </div>
                      </div>
                      <JargonTooltip term="SID">
                        <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-primary text-xs font-mono font-bold">
                          {flightPlan.sid} ({flightPlan.originRunway.ident})
                        </span>
                      </JargonTooltip>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] font-mono text-secondary">
                      <span className="material-symbols-outlined text-[14px]">thunderstorm</span>
                      <JargonTooltip term="METAR">
                        <span className="truncate">METAR: 28014KT 10SM CLR 18/09 A2992 • VFR OK</span>
                      </JargonTooltip>
                    </div>
                  </div>

                  {/* Arrival Card */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-mono font-bold">
                            ARR
                          </span>
                          <span className="text-base font-bold text-white tracking-tight">
                            {flightPlan.destination.icao} • {flightPlan.destination.name}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-outline mt-1">
                          Elev {flightPlan.destination.elevation} FT • RWY {flightPlan.destRunway.ident}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <JargonTooltip term="STAR">
                          <span className="px-2 py-1 rounded-lg bg-white/[0.05] text-tertiary text-xs font-mono font-bold">
                            {flightPlan.star} ({flightPlan.destRunway.ident})
                          </span>
                        </JargonTooltip>
                        <JargonTooltip term="ILS">
                          <span className="text-[10px] font-mono text-primary font-bold">
                            {flightPlan.approach}
                          </span>
                        </JargonTooltip>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] font-mono text-primary">
                      <span className="material-symbols-outlined text-[14px]">cloud</span>
                      <JargonTooltip term="METAR">
                        <span className="truncate">METAR: 25008KT 10SM SCT025 21/14 A2994 • VFR OK</span>
                      </JargonTooltip>
                    </div>
                  </div>
                </div>

                {/* Waypoints Horizontal Scroll Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs font-mono">
                  <span className="text-[10px] text-outline shrink-0 uppercase tracking-widest font-bold pr-1">
                    LEGS:
                  </span>
                  {flightPlan.waypoints.map((wp, idx) => (
                    <React.Fragment key={wp.ident + idx}>
                      {idx > 0 && <span className="text-outline text-xs">→</span>}
                      <div
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                          wp.isTOC
                            ? 'bg-primary/15 border-primary text-white shadow-[0_0_12px_rgba(76,215,246,0.25)]'
                            : wp.isTOD
                            ? 'bg-tertiary/15 border-tertiary text-tertiary'
                            : idx === 0
                            ? 'bg-secondary/15 border-secondary text-secondary'
                            : 'bg-white/[0.04] border-white/[0.07] text-on-surface'
                        }`}
                      >
                        <span className="font-bold">{wp.ident}</span>
                        <span className="text-[10px] opacity-80">
                          {idx === 0 || idx === flightPlan.waypoints.length - 1
                            ? 'GND'
                            : `FL${Math.round(wp.altFt / 100)}`}
                        </span>
                        {wp.isTOC && (
                          <JargonTooltip term="TOC">
                            <span className="text-[9px] font-bold text-primary bg-primary/20 px-1 rounded">TOC</span>
                          </JargonTooltip>
                        )}
                        {wp.isTOD && (
                          <JargonTooltip term="TOD">
                            <span className="text-[9px] font-bold text-tertiary bg-tertiary/20 px-1 rounded">TOD</span>
                          </JargonTooltip>
                        )}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* PANEL 2: Runway & Compass Dial */}
            {activeTab === 'runway' && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-center gap-6 p-2">
                  {/* Compass Dial SVG with dynamic rotation */}
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center bg-black/40 rounded-full border border-white/10 p-1 shadow-inner">
                    <svg
                      className="w-full h-full transition-transform duration-700 ease-out"
                      viewBox="0 0 120 120"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        fill="none"
                        r="54"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                      />
                      {/* Tick Marks */}
                      <line stroke="#4cd7f6" strokeWidth="2" x1="60" x2="60" y1="8" y2="14" />
                      <line stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" x1="112" x2="106" y1="60" y2="60" />
                      <line stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" x1="60" x2="60" y1="112" y2="106" />
                      <line stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" x1="8" x2="14" y1="60" y2="60" />

                      {/* Cardinals */}
                      <text className="fill-primary text-[10px] font-mono font-bold" textAnchor="middle" x="60" y="24">
                        N
                      </text>
                      <text className="fill-outline text-[9px] font-mono" textAnchor="middle" x="100" y="63">
                        E
                      </text>
                      <text className="fill-outline text-[9px] font-mono" textAnchor="middle" x="60" y="102">
                        S
                      </text>
                      <text className="fill-outline text-[9px] font-mono" textAnchor="middle" x="20" y="63">
                        W
                      </text>

                      {/* Dynamic Runway Vector Strip */}
                      <g transform={`rotate(${activeRunway.heading} 60 60)`} className="transition-transform duration-700">
                        <rect fill="rgba(76,215,246,0.25)" height="80" rx="2" width="8" x="56" y="20" />
                        <rect fill="#4cd7f6" height="76" rx="1" width="4" x="58" y="22" />
                        <polygon fill="#4cd7f6" points="60,16 54,26 66,26" />
                      </g>
                      <circle cx="60" cy="60" fill="#acedff" r="3" />
                    </svg>

                    <div className="absolute -bottom-1.5 px-2 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-[10px] font-bold">
                      <span>{String(activeRunway.heading).padStart(3, '0')}°</span> MAG
                    </div>
                  </div>

                  {/* Runway Information & Selector */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedRwyType('origin')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedRwyType === 'origin'
                              ? 'bg-secondary/20 text-secondary border border-secondary/30'
                              : 'text-outline hover:text-white border border-transparent'
                          }`}
                        >
                          {flightPlan.origin.icao} ({flightPlan.originRunway.ident})
                        </button>
                        <button
                          onClick={() => setSelectedRwyType('dest')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            selectedRwyType === 'dest'
                              ? 'bg-tertiary/20 text-tertiary border border-tertiary/30'
                              : 'text-outline hover:text-white border border-transparent'
                          }`}
                        >
                          {flightPlan.destination.icao} ({flightPlan.destRunway.ident})
                        </button>
                      </div>

                      <JargonTooltip term="RUNWAY_HEADING">
                        <span className="font-mono text-sm font-bold text-white">
                          RWY {activeRunway.ident} ({activeRunway.heading}° M)
                        </span>
                      </JargonTooltip>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-outline block">DIMENSIONS</span>
                        <span className="font-bold text-white">
                          {activeRunway.lengthFt.toLocaleString()} x {activeRunway.widthFt} FT
                        </span>
                        <span className="text-[9px] text-outline block">
                          ({activeRunway.lengthM.toLocaleString()} m)
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-outline block">SURFACE</span>
                        <span className="font-bold text-secondary uppercase">{activeRunway.surface}</span>
                      </div>

                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-outline block">ILS FREQUENCY</span>
                        <span className="font-bold text-primary">
                          {activeRunway.ils ? `${activeRunway.ils.freq} MHz` : 'VISUAL / RNAV'}
                        </span>
                        {activeRunway.ils && (
                          <span className="text-[9px] text-outline block">
                            ID: {activeRunway.ils.ident} • CRS {activeRunway.ils.course}°
                          </span>
                        )}
                      </div>

                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-[10px] text-outline block">RADIO TUNING</span>
                        <span className="font-bold text-white">NAV1 {activeRunway.ils?.freq || '110.30'}</span>
                        <span className="text-[9px] text-secondary block">AUTO-TUNED IN MSFS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 3: Vertical Profile Cross-Section (VSD from Design 2) */}
            {activeTab === 'profile' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-outline">
                  <span>
                    VERTICAL SITUATION PROFILE (VSD): {flightPlan.origin.icao} → {flightPlan.destination.icao}
                  </span>
                  <span className="text-primary font-bold">CRUISE FL{flightPlan.cruisingAlt / 100}</span>
                </div>

                <div className="w-full h-32 bg-black/40 rounded-xl border border-white/10 p-2 overflow-hidden relative">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 100">
                    <defs>
                      <linearGradient id="vsdTerrainGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3d494c" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#171b26" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>

                    {/* Altitude grid lines */}
                    <line stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" x1="0" x2="800" y1="20" y2="20" />
                    <text className="fill-outline/50 font-mono text-[9px]" x="5" y="18">
                      FL{flightPlan.cruisingAlt / 100}
                    </text>
                    <line stroke="rgba(255,255,255,0.06)" strokeDasharray="2 4" x1="0" x2="800" y1="55" y2="55" />
                    <text className="fill-outline/50 font-mono text-[9px]" x="5" y="52">
                      FL180
                    </text>

                    {/* Mountain terrain silhouette */}
                    <path
                      d="M 0 100 L 0 95 Q 120 92 220 84 Q 380 62 520 72 Q 680 84 800 92 L 800 100 Z"
                      fill="url(#vsdTerrainGrad)"
                    />

                    {/* Climb -> Cruise -> Step Descent Flight Path */}
                    <path
                      d="M 30 95 L 180 20 L 520 20 L 680 55 L 770 94"
                      fill="none"
                      stroke="#4cd7f6"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 30 95 L 180 20 L 520 20 L 680 55 L 770 94"
                      fill="none"
                      stroke="#ffffff"
                      strokeDasharray="4 2"
                      strokeWidth="1.2"
                    />

                    {/* TOC Marker */}
                    <circle cx="180" cy="20" fill="#4edea3" r="3.5" />
                    <text className="fill-secondary font-mono text-[9px] font-bold" x="185" y="15">
                      TOC
                    </text>

                    {/* Cruise Jet Marker */}
                    <circle cx="360" cy="20" fill="#4cd7f6" r="4" />
                    <text className="fill-primary font-mono text-[9px] font-bold" x="370" y="24">
                      CRZ FL{flightPlan.cruisingAlt / 100}
                    </text>

                    {/* TOD Marker */}
                    <circle cx="520" cy="20" fill="#ffb95f" r="3.5" />
                    <text className="fill-tertiary font-mono text-[9px] font-bold" x="525" y="15">
                      TOD
                    </text>

                    {/* Approach & Touchdown */}
                    <text className="fill-secondary font-mono text-[8px]" x="730" y="88">
                      RWY {flightPlan.destRunway.ident}
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* PANEL 4: MSFS 2024 World Map Exporter */}
            {activeTab === 'export' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[24px]">sim_card_download</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Direct MSFS 2024 Flight Plan File (.pln)</h4>
                      <p className="text-xs text-on-surface-variant font-mono">
                        AceXML formatted with SIDs, STARs &amp; auto-tuning ILS frequency. Compatible with A320, 737, and
                        all MSFS Garmin avionics.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyRoute}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-white transition-all flex items-center gap-1.5 border border-white/[0.08]"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      <span>{copied ? 'Copied!' : 'Copy Route'}</span>
                    </button>

                    <button
                      onClick={onExport}
                      className="px-4 py-1.5 rounded-xl bg-primary text-surface-container-lowest font-bold text-xs font-mono hover:brightness-110 active:scale-95 transition-all shadow-[0_0_16px_rgba(76,215,246,0.4)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">file_download</span>
                      <span>Download .pln</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
