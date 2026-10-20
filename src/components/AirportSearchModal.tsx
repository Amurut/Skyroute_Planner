import React, { useState } from 'react';
import { GLOBAL_AIRPORTS } from '../data/airports';
import { Airport } from '../types/aviation';

interface AirportSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPair: (origin: Airport, dest: Airport) => void;
  simbriefUsername: string;
  onUpdateSimbriefUsername: (username: string) => void;
  currentOrigin: Airport;
  currentDest: Airport;
}

export const AirportSearchModal: React.FC<AirportSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectPair,
  simbriefUsername,
  onUpdateSimbriefUsername,
  currentOrigin,
  currentDest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<Airport>(currentOrigin);
  const [selectedDest, setSelectedDest] = useState<Airport>(currentDest);
  const [tempUsername, setTempUsername] = useState(simbriefUsername);

  if (!isOpen) return null;

  const filteredAirports = GLOBAL_AIRPORTS.filter(
    (apt) =>
      apt.icao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.iata.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presets = [
    { label: 'California Express (KSFO → KLAX)', dep: 'KSFO', arr: 'KLAX' },
    { label: 'Trans-Channel Hopper (EGLL → LFPG)', dep: 'EGLL', arr: 'LFPG' },
    { label: 'East Coast Corridor (KJFK → KMIA)', dep: 'KJFK', arr: 'KMIA' },
    { label: 'Alpine Valley Challenge (EDDF → LOWI)', dep: 'EDDF', arr: 'LOWI' },
    { label: 'Caribbean Holiday (KMIA → TNCM)', dep: 'KMIA', arr: 'TNCM' },
  ];

  const handleApplyPreset = (depCode: string, arrCode: string) => {
    const dep = GLOBAL_AIRPORTS.find((a) => a.icao === depCode);
    const arr = GLOBAL_AIRPORTS.find((a) => a.icao === arrCode);
    if (dep && arr) {
      setSelectedOrigin(dep);
      setSelectedDest(arr);
      onSelectPair(dep, arr);
      onClose();
    }
  };

  const handleConfirm = () => {
    onUpdateSimbriefUsername(tempUsername);
    onSelectPair(selectedOrigin, selectedDest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-island w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Flight Route &amp; Airport Dispatch</h3>
              <span className="text-[11px] font-mono text-outline">Select Airport Pair or Connect SimBrief</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.1] text-outline hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* SimBrief Username Connect */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-mono font-bold text-primary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                SimBrief Account Integration (Optional)
              </span>
              <span className="text-[10px] font-mono text-outline">Approach A Active</span>
            </div>
            <p className="text-[11px] text-on-surface-variant mb-2">
              Enter your SimBrief username or Pilot ID to automatically fetch your latest generated OFP route, SIDs,
              STARs, and fuel:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CaptainSim99"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-mono text-outline uppercase tracking-wider block mb-2 font-semibold">
              Popular Flight Simulator City-Pairs
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handleApplyPreset(p.dep, p.arr)}
                  className="px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-primary/40 text-left transition-all flex items-center justify-between group"
                >
                  <span className="text-xs font-medium text-white group-hover:text-primary transition-colors">
                    {p.label}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-outline group-hover:text-primary transition-colors">
                    east
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Airport Selector */}
          <div className="pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] font-mono text-outline uppercase tracking-wider block mb-2 font-semibold">
              Search &amp; Pick Custom Airports
            </span>
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Filter by ICAO, IATA, or City Name (e.g. SFO, London, Dubai)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-primary"
                />
                <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[16px] text-outline">
                  search
                </span>
              </div>
            </div>

            {/* Selected Active Summary */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/[0.06] mb-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-secondary/20 text-secondary font-bold text-[10px]">DEP</span>
                <span className="text-white font-bold">{selectedOrigin.icao}</span>
                <span className="text-outline text-[11px]">({selectedOrigin.city})</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-outline">east</span>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-tertiary/20 text-tertiary font-bold text-[10px]">ARR</span>
                <span className="text-white font-bold">{selectedDest.icao}</span>
                <span className="text-outline text-[11px]">({selectedDest.city})</span>
              </div>
            </div>

            {/* Airport List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredAirports.map((apt) => (
                <div
                  key={apt.icao}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] flex items-center justify-between transition-colors text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{apt.icao}</span>
                      <span className="font-mono text-[10px] text-outline">({apt.iata})</span>
                      <span className="font-medium text-white truncate max-w-[200px]">{apt.name}</span>
                    </div>
                    <span className="text-[10px] text-outline font-mono">
                      {apt.city}, {apt.country} • Elev {apt.elevation} FT • {apt.runways.length} Runways
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setSelectedOrigin(apt)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        selectedOrigin.icao === apt.icao
                          ? 'bg-secondary text-surface-container-lowest'
                          : 'bg-white/[0.05] text-on-surface-variant hover:text-white'
                      }`}
                    >
                      Set DEP
                    </button>
                    <button
                      onClick={() => setSelectedDest(apt)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                        selectedDest.icao === apt.icao
                          ? 'bg-tertiary text-surface-container-lowest'
                          : 'bg-white/[0.05] text-on-surface-variant hover:text-white'
                      }`}
                    >
                      Set ARR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.08] bg-black/30 flex items-center justify-between">
          <span className="text-[11px] font-mono text-outline">
            {selectedOrigin.icao} → {selectedDest.icao}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] text-xs font-mono text-white hover:bg-white/[0.1] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 rounded-xl bg-primary text-surface-container-lowest font-bold text-xs font-mono hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(76,215,246,0.3)]"
            >
              Generate Flight Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
