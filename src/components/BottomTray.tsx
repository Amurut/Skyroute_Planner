import React, { useState } from 'react';
import { FlightPlan } from '../types/aviation';
import { JargonTooltip } from './JargonTooltip';

interface BottomTrayProps {
  flightPlan: FlightPlan;
  onExport: () => void;
  onUpdateProcedures: (updates: {
    depRwyIdent?: string;
    sidName?: string;
    arrRwyIdent?: string;
    starName?: string;
    approachName?: string;
  }) => void;
}

export const BottomTray: React.FC<BottomTrayProps> = ({ flightPlan, onExport, onUpdateProcedures }) => {
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
      <div className="glass-island rounded-2xl shadow-2xl border border-white/10 flex flex-col relative">
        {/* Dock Navigation Tabs Bar */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-white/[0.07] bg-black/20 rounded-t-2xl">
          {/* Segmented Tab Triggers */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs font-mono">
            <button
              onClick={() => {
                setActiveTab('route');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'route'
                  ? 'active-tab font-semibold'
                  : 'text-on-surface-variant hover:text-white border-transparent hover:bg-white/[0.04]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">route</span>
              <span>IFR Procedures &amp; Route</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('runway');
                setIsCollapsed(false);
              }}
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
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
              className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
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
              <JargonTooltip term="COST_INDEX" align="right">
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
          <div className="p-3.5 transition-all max-h-80 overflow-y-auto rounded-b-2xl">
            {/* PANEL 1: Route & Procedures with Live Selectors */}
            {activeTab === 'route' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Departure Procedure Card */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-secondary/15 text-secondary text-[10px] font-mono font-bold">
                            DEP
                          </span>
                          <span className="text-base font-bold text-white tracking-tight">
                            {flightPlan.origin.icao} • {flightPlan.origin.name}
                          </span>
                        </div>
                        <JargonTooltip term="SID" align="right">
                          <span className="text-[10px] font-mono text-secondary font-bold uppercase">
                            Departure Phase
                          </span>
                        </JargonTooltip>
                      </div>

                      {/* Interactive Departure Runway & SID Selectors */}
                      <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                        <div>
                          <label className="text-[10px] text-outline block mb-1">DEPARTURE RUNWAY</label>
                          <select
                            value={flightPlan.originRunway.ident}
                            onChange={(e) => onUpdateProcedures({ depRwyIdent: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-secondary cursor-pointer"
                          >
                            {flightPlan.origin.runways.map((r) => (
                              <option key={r.ident} value={r.ident}>
                                RWY {r.ident} ({r.lengthFt.toLocaleString()} ft)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-outline block mb-1">SELECT SID</label>
                          <select
                            value={flightPlan.sid}
                            onChange={(e) => onUpdateProcedures({ sidName: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 text-secondary font-bold text-xs focus:outline-none focus:border-secondary cursor-pointer"
                          >
                            {flightPlan.availableSids.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name} — {s.description.slice(0, 36)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] font-mono text-secondary">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                        <span>Active SID: <strong>{flightPlan.sid}</strong></span>
                      </span>
                      <span className="text-outline text-[10px]">RWY {flightPlan.originRunway.ident}</span>
                    </div>
                  </div>

                  {/* Arrival Procedure Card */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-tertiary/15 text-tertiary text-[10px] font-mono font-bold">
                            ARR
                          </span>
                          <span className="text-base font-bold text-white tracking-tight">
                            {flightPlan.destination.icao} • {flightPlan.destination.name}
                          </span>
                        </div>
                        <JargonTooltip term="STAR" align="right">
                          <span className="text-[10px] font-mono text-tertiary font-bold uppercase">
                            Arrival &amp; Approach
                          </span>
                        </JargonTooltip>
                      </div>

                      {/* Interactive Arrival Runway, STAR & Approach Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 font-mono text-xs">
                        <div>
                          <label className="text-[10px] text-outline block mb-1">ARRIVAL RUNWAY</label>
                          <select
                            value={flightPlan.destRunway.ident}
                            onChange={(e) => onUpdateProcedures({ arrRwyIdent: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-tertiary cursor-pointer"
                          >
                            {flightPlan.destination.runways.map((r) => (
                              <option key={r.ident} value={r.ident}>
                                RWY {r.ident} {r.ils ? `(ILS ${r.ils.freq})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-outline block mb-1">SELECT STAR</label>
                          <select
                            value={flightPlan.star}
                            onChange={(e) => onUpdateProcedures({ starName: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 text-tertiary font-bold text-xs focus:outline-none focus:border-tertiary cursor-pointer"
                          >
                            {flightPlan.availableStars.map((s) => (
                              <option key={s.name} value={s.name}>
                                {s.name} — {s.description.slice(0, 36)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-outline block mb-1">APPROACH / ILS</label>
                          <select
                            value={flightPlan.approach}
                            onChange={(e) => onUpdateProcedures({ approachName: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/10 text-[#e879f9] font-bold text-xs focus:outline-none focus:border-[#e879f9] cursor-pointer"
                          >
                            {flightPlan.availableApproaches.map((a) => (
                              <option key={a.name} value={a.name}>
                                {a.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.04] text-[11px] font-mono text-tertiary">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e879f9]" />
                        <span className="text-white">Active Approach: <strong className="text-[#e879f9]">{flightPlan.approach}</strong></span>
                      </span>
                      <span className="text-outline text-[10px]">
                        RWY {flightPlan.destRunway.ident} {flightPlan.destRunway.ils ? `• ILS ${flightPlan.destRunway.ils.freq} MHz` : '• VISUAL'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Waypoints Horizontal Scroll Ribbon */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs font-mono">
                  <span className="text-[10px] text-outline shrink-0 uppercase tracking-widest font-bold pr-1">
                    LEGS:
                  </span>
                  {flightPlan.waypoints.map((wp, idx) => {
                    const isSid = wp.phase === 'sid';
                    const isStar = wp.phase === 'star';
                    const isApp = wp.phase === 'approach';

                    return (
                      <React.Fragment key={wp.ident + idx}>
                        {idx > 0 && <span className="text-outline text-xs">→</span>}
                        <div
                          className={`px-2 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                            isApp
                              ? 'bg-[#e879f9]/15 border-[#e879f9] text-[#e879f9]'
                              : isStar
                              ? 'bg-tertiary/15 border-tertiary text-tertiary'
                              : isSid
                              ? 'bg-secondary/15 border-secondary text-secondary'
                              : wp.isTOC
                              ? 'bg-primary/20 border-primary text-white shadow-[0_0_12px_rgba(76,215,246,0.3)]'
                              : 'bg-white/[0.04] border-white/[0.07] text-on-surface'
                          }`}
                        >
                          <span className="font-bold">{wp.ident}</span>
                          <span className="text-[10px] opacity-80">
                            {idx === 0 || idx === flightPlan.waypoints.length - 1
                              ? 'GND'
                              : `FL${Math.round(wp.altFt / 100)}`}
                          </span>
                          {wp.isTOC && <span className="text-[8px] font-bold text-primary bg-primary/20 px-1 rounded">TOC</span>}
                          {wp.isTOD && <span className="text-[8px] font-bold text-tertiary bg-tertiary/20 px-1 rounded">TOD</span>}
                        </div>
                      </React.Fragment>
                    );
                  })}
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
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            selectedRwyType === 'origin'
                              ? 'bg-secondary/20 text-secondary border border-secondary/30'
                              : 'text-outline hover:text-white border border-transparent'
                          }`}
                        >
                          {flightPlan.origin.icao} ({flightPlan.originRunway.ident})
                        </button>
                        <button
                          onClick={() => setSelectedRwyType('dest')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            selectedRwyType === 'dest'
                              ? 'bg-tertiary/20 text-tertiary border border-tertiary/30'
                              : 'text-outline hover:text-white border border-transparent'
                          }`}
                        >
                          {flightPlan.destination.icao} ({flightPlan.destRunway.ident})
                        </button>
                      </div>

                      <JargonTooltip term="RUNWAY_HEADING" align="right">
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

            {/* PANEL 3: Vertical Profile Cross-Section (VSD) with Real Waypoints & Elevations */}
            {activeTab === 'profile' && (() => {
              const waypoints = flightPlan.waypoints;
              const crzAlt = Math.max(flightPlan.cruisingAlt, 10000);
              const startX = 65;
              const endX = 940;
              const groundY = 142;
              const topY = 28;

              const points = waypoints.map((wp, idx) => {
                const x = startX + (idx / Math.max(waypoints.length - 1, 1)) * (endX - startX);
                const altRatio = Math.min(Math.max(wp.altFt / crzAlt, 0), 1);
                const y = groundY - altRatio * (groundY - topY);
                return { wp, x, y };
              });

              const pathD = points
                .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
                .join(' ');

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-outline">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-primary">show_chart</span>
                      <span>
                        VERTICAL SITUATION PROFILE (VSD) • {flightPlan.origin.icao} ({flightPlan.sid}) → {flightPlan.destination.icao} ({flightPlan.approach})
                      </span>
                    </span>
                    <div className="hidden sm:flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" /> SID</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]" /> CRUISE</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#ffb95f]" /> STAR</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#e879f9]" /> APPROACH</span>
                    </div>
                  </div>

                  <div className="w-full h-48 bg-black/50 rounded-xl border border-white/10 p-2 overflow-hidden relative shadow-inner">
                    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 170">
                      <defs>
                        <linearGradient id="vsdTerrainGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#3d494c" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#121622" stopOpacity="0.95" />
                        </linearGradient>
                        <linearGradient id="vsdFlightEnvelope" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.18" />
                          <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Altitude Horizontal Reference Grid Lines */}
                      <line stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" x1="45" x2="980" y1={topY} y2={topY} />
                      <text className="fill-primary font-mono text-[9px] font-bold" x="8" y={topY + 3}>
                        FL{Math.round(crzAlt / 100)}
                      </text>

                      <line
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="2 4"
                        x1="45"
                        x2="980"
                        y1={topY + (groundY - topY) * 0.45}
                        y2={topY + (groundY - topY) * 0.45}
                      />
                      <text className="fill-outline/60 font-mono text-[9px]" x="8" y={topY + (groundY - topY) * 0.45 + 3}>
                        FL180
                      </text>

                      <line
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="2 4"
                        x1="45"
                        x2="980"
                        y1={topY + (groundY - topY) * 0.72}
                        y2={topY + (groundY - topY) * 0.72}
                      />
                      <text className="fill-outline/60 font-mono text-[9px]" x="8" y={topY + (groundY - topY) * 0.72 + 3}>
                        10,000'
                      </text>

                      <line stroke="rgba(255,255,255,0.12)" x1="45" x2="980" y1={groundY} y2={groundY} />
                      <text className="fill-outline/70 font-mono text-[9px]" x="8" y={groundY + 3}>
                        GND
                      </text>

                      {/* Flight envelope gradient fill */}
                      <polygon
                        fill="url(#vsdFlightEnvelope)"
                        points={`${points[0].x},${groundY} ${points.map((p) => `${p.x},${p.y}`).join(' ')} ${points[points.length - 1].x},${groundY}`}
                      />

                      {/* Terrain silhouette along base */}
                      <path
                        d="M 50 170 L 50 148 Q 180 145 280 138 Q 420 115 560 126 Q 720 136 860 144 Q 940 146 980 148 L 980 170 Z"
                        fill="url(#vsdTerrainGrad)"
                      />

                      {/* Connect Flight Path Polyline */}
                      <path d={pathD} fill="none" stroke="#4cd7f6" strokeWidth="2.5" strokeLinecap="round" />
                      <path d={pathD} fill="none" stroke="#ffffff" strokeDasharray="4 2" strokeWidth="1" strokeLinecap="round" />

                      {/* Waypoint Altitude Ticks & Vertical Drop Lines */}
                      {points.map((pt, idx) => {
                        const isOrigin = idx === 0;
                        const isDest = idx === points.length - 1;
                        const color =
                          pt.wp.phase === 'approach'
                            ? '#e879f9'
                            : pt.wp.phase === 'star'
                            ? '#ffb95f'
                            : pt.wp.phase === 'sid'
                            ? '#4edea3'
                            : pt.wp.isTOC
                            ? '#4edea3'
                            : '#4cd7f6';

                        // Stagger labels vertically to prevent overlap
                        const isStaggered = idx % 2 === 1;
                        const nameY = Math.max(pt.y - (isStaggered ? 16 : 24), 14);
                        const altY = nameY + 8;

                        // Formatted altitude text
                        const altLabel =
                          pt.wp.altFt >= 18000
                            ? `FL${Math.round(pt.wp.altFt / 100)}`
                            : pt.wp.altFt <= 200
                            ? `${pt.wp.altFt}' GND`
                            : `${pt.wp.altFt.toLocaleString()}'`;

                        return (
                          <g key={pt.wp.ident + idx} className="cursor-pointer group">
                            {/* Vertical drop line down to ground */}
                            <line
                              x1={pt.x}
                              x2={pt.x}
                              y1={pt.y}
                              y2={groundY}
                              stroke={color}
                              strokeWidth="1"
                              strokeDasharray="2 3"
                              opacity="0.35"
                            />

                            {/* Waypoint Marker Diamond */}
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isOrigin || isDest || pt.wp.isTOC || pt.wp.isTOD ? '4.5' : '3.5'}
                              fill={color}
                              stroke="#080c15"
                              strokeWidth="1.5"
                            />

                            {/* Waypoint Ident Label */}
                            <text
                              x={pt.x}
                              y={nameY}
                              textAnchor="middle"
                              className="font-mono text-[9px] font-bold fill-white tracking-tight"
                            >
                              {pt.wp.ident}
                            </text>

                            {/* Waypoint Elevation / Altitude Label */}
                            <text
                              x={pt.x}
                              y={altY}
                              textAnchor="middle"
                              fill={color}
                              className="font-mono text-[8px] font-semibold"
                            >
                              {altLabel}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>
              );
            })()}

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
                        Includes SID: <strong>{flightPlan.sid}</strong>, STAR: <strong>{flightPlan.star}</strong>, and
                        Approach: <strong>{flightPlan.approach}</strong> with auto-tuning NAV1 radio.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleCopyRoute}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-white transition-all flex items-center gap-1.5 border border-white/[0.08] cursor-pointer"
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
