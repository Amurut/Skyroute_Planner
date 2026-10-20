import React, { useState, useEffect } from 'react';
import { Airport, FlightPlan } from './types/aviation';
import { GLOBAL_AIRPORTS } from './data/airports';
import { generateFlightPlan } from './services/simbrief';
import { downloadPlnFile } from './utils/msfsExporter';
import { Header } from './components/Header';
import { InteractiveMap } from './components/InteractiveMap';
import { BottomTray } from './components/BottomTray';
import { AirportSearchModal } from './components/AirportSearchModal';
import { GuideModal } from './components/GuideModal';

export const App: React.FC = () => {
  const [flightPlan, setFlightPlan] = useState<FlightPlan | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [simbriefUsername, setSimbriefUsername] = useState('');

  // Initial load: KSFO -> KLAX California Express
  useEffect(() => {
    const origin = GLOBAL_AIRPORTS[0]; // KSFO
    const dest = GLOBAL_AIRPORTS[1]; // KLAX
    generateFlightPlan(origin, dest).then(setFlightPlan);
  }, []);

  const handleSelectPair = async (origin: Airport, dest: Airport) => {
    const plan = await generateFlightPlan(origin, dest, simbriefUsername);
    setFlightPlan(plan);
  };

  const handleSelectAirport = (apt: Airport, role: 'origin' | 'dest') => {
    if (!flightPlan) return;
    if (role === 'origin') {
      handleSelectPair(apt, flightPlan.destination);
    } else {
      handleSelectPair(flightPlan.origin, apt);
    }
  };

  const handleUpdateProcedures = async (updates: {
    depRwyIdent?: string;
    sidName?: string;
    arrRwyIdent?: string;
    starName?: string;
    approachName?: string;
  }) => {
    if (!flightPlan) return;
    const updatedPlan = await generateFlightPlan(
      flightPlan.origin,
      flightPlan.destination,
      simbriefUsername,
      {
        depRwyIdent: updates.depRwyIdent || flightPlan.originRunway.ident,
        sidName: updates.sidName || flightPlan.sid,
        arrRwyIdent: updates.arrRwyIdent || flightPlan.destRunway.ident,
        starName: updates.starName || flightPlan.star,
        approachName: updates.approachName || flightPlan.approach,
      }
    );
    setFlightPlan(updatedPlan);
  };

  const handleExport = () => {
    if (!flightPlan) return;
    downloadPlnFile(flightPlan);
    setIsGuideOpen(true); // Open the step-by-step loading guide immediately on download!
  };

  if (!flightPlan) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070a11] text-primary font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>SkyRouter Initializing Flight Operations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#070a11] text-on-surface">
      {/* Fullscreen Interactive Leaflet Map with Phase Colors */}
      <InteractiveMap flightPlan={flightPlan} onSelectAirport={handleSelectAirport} />

      {/* Floating Glass Top Island */}
      <Header
        flightPlan={flightPlan}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onExport={handleExport}
      />

      {/* Bottom Collapsible Command Dock with Procedure Selectors */}
      <BottomTray
        flightPlan={flightPlan}
        onExport={handleExport}
        onUpdateProcedures={handleUpdateProcedures}
      />

      {/* Airport Search & Dispatch Modal */}
      <AirportSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPair={handleSelectPair}
        simbriefUsername={simbriefUsername}
        onUpdateSimbriefUsername={setSimbriefUsername}
        currentOrigin={flightPlan.origin}
        currentDest={flightPlan.destination}
      />

      {/* MSFS 2024 Loading Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} flightPlan={flightPlan} />
    </div>
  );
};

export default App;
