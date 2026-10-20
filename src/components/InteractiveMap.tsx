import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Airport, FlightPlan } from '../types/aviation';
import { GLOBAL_AIRPORTS } from '../data/airports';

interface InteractiveMapProps {
  flightPlan: FlightPlan;
  onSelectAirport: (apt: Airport, role: 'origin' | 'dest') => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ flightPlan, onSelectAirport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const airportLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [flightPlan.origin.lat, flightPlan.origin.lon],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    // Dark Matter CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const airportLayer = L.layerGroup().addTo(map);

    routeLayerRef.current = routeLayer;
    airportLayerRef.current = airportLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline and Waypoints when flight plan changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeLayer = routeLayerRef.current;
    const airportLayer = airportLayerRef.current;
    if (!map || !routeLayer || !airportLayer) return;

    routeLayer.clearLayers();
    airportLayer.clearLayers();

    // 1. Draw Global Airport Markers
    GLOBAL_AIRPORTS.forEach((apt) => {
      const isOrigin = apt.icao === flightPlan.origin.icao;
      const isDest = apt.icao === flightPlan.destination.icao;

      let markerColor = '#4cd7f6';
      let radius = 6;
      if (isOrigin) {
        markerColor = '#4edea3';
        radius = 9;
      } else if (isDest) {
        markerColor = '#ffb95f';
        radius = 9;
      }

      const icon = L.divIcon({
        className: 'custom-airport-icon',
        html: `<div style="
          width: ${radius * 2}px;
          height: ${radius * 2}px;
          background: ${markerColor};
          border-radius: 50%;
          border: 2px solid #060910;
          box-shadow: 0 0 ${isOrigin || isDest ? '12px' : '4px'} ${markerColor};
          cursor: pointer;
        "></div>`,
        iconSize: [radius * 2, radius * 2],
        iconAnchor: [radius, radius],
      });

      const marker = L.marker([apt.lat, apt.lon], { icon });

      // Interactive popup
      const rwyListHtml = apt.runways
        .slice(0, 3)
        .map(
          (r) =>
            `<div style="display:flex;justify-content:space-between;font-family:monospace;font-size:10px;margin-top:2px;">
              <span style="color:#4cd7f6;font-weight:bold;">RWY ${r.ident}</span>
              <span style="color:#a2b0ba;">${r.lengthFt.toLocaleString()} FT</span>
              ${r.ils ? `<span style="color:#4edea3;">ILS ${r.ils.freq}</span>` : '<span style="color:#7a8790;">VISUAL</span>'}
            </div>`
        )
        .join('');

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '220px';
      popupContent.innerHTML = `
        <div style="font-family:sans-serif;padding:2px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:6px;">
            <span style="font-size:14px;font-weight:bold;color:#f0f3ff;font-family:monospace;">${apt.icao} / ${apt.iata}</span>
            <span style="font-size:10px;color:#4cd7f6;font-family:monospace;">Elev ${apt.elevation}'</span>
          </div>
          <div style="font-size:11px;color:#a2b0ba;margin-bottom:6px;">${apt.name} (${apt.city})</div>
          <div style="margin-bottom:8px;background:rgba(0,0,0,0.3);padding:4px 6px;border-radius:6px;">
            ${rwyListHtml}
          </div>
          <div style="display:flex;gap:6px;">
            <button id="btn-set-dep-${apt.icao}" style="flex:1;padding:4px 8px;background:#4edea3;color:#003824;font-size:10px;font-weight:bold;font-family:monospace;border:none;border-radius:6px;cursor:pointer;">Set Origin</button>
            <button id="btn-set-arr-${apt.icao}" style="flex:1;padding:4px 8px;background:#ffb95f;color:#472a00;font-size:10px;font-weight:bold;font-family:monospace;border:none;border-radius:6px;cursor:pointer;">Set Dest</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btnDep = document.getElementById(`btn-set-dep-${apt.icao}`);
        const btnArr = document.getElementById(`btn-set-arr-${apt.icao}`);
        if (btnDep) btnDep.onclick = () => onSelectAirport(apt, 'origin');
        if (btnArr) btnArr.onclick = () => onSelectAirport(apt, 'dest');
      });

      airportLayer.addLayer(marker);
    });

    // 2. Draw Route Polyline
    const latlngs: L.LatLngExpression[] = flightPlan.waypoints.map((w) => [w.lat, w.lon]);

    // Outer glow polyline
    const glowLine = L.polyline(latlngs, {
      color: '#4cd7f6',
      weight: 6,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    });

    // Inner crisp core polyline
    const coreLine = L.polyline(latlngs, {
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      dashArray: '6, 6',
      lineCap: 'round',
    });

    routeLayer.addLayer(glowLine);
    routeLayer.addLayer(coreLine);

    // 3. Draw Waypoint Markers along Route
    flightPlan.waypoints.forEach((wp) => {
      const isEndpoint = wp.type === 'Airport';
      if (isEndpoint) return; // Handled by airport markers

      const wpIcon = L.divIcon({
        className: 'custom-wp-icon',
        html: `<div style="
          width: 8px;
          height: 8px;
          background: ${wp.isTOC ? '#4edea3' : wp.isTOD ? '#ffb95f' : '#4cd7f6'};
          transform: rotate(45deg);
          border: 1px solid #060910;
          box-shadow: 0 0 6px ${wp.isTOC ? '#4edea3' : wp.isTOD ? '#ffb95f' : '#4cd7f6'};
        "></div>`,
        iconSize: [8, 8],
        iconAnchor: [4, 4],
      });

      const wpMarker = L.marker([wp.lat, wp.lon], { icon: wpIcon });
      wpMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;font-weight:bold;color:#f0f3ff;">
          ${wp.ident} <span style="color:#4cd7f6;">FL${Math.round(wp.altFt / 100)}</span>
          ${wp.isTOC ? '<span style="color:#4edea3;">[TOC]</span>' : ''}
          ${wp.isTOD ? '<span style="color:#ffb95f;">[TOD]</span>' : ''}
        </div>`,
        { permanent: false, direction: 'top', className: 'dark-tooltip' }
      );

      routeLayer.addLayer(wpMarker);
    });

    // Fit map bounds smoothly
    if (latlngs.length > 0) {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [120, 120], maxZoom: 8 });
    }
  }, [flightPlan, onSelectAirport]);

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && flightPlan.waypoints.length > 0) {
      const bounds = L.latLngBounds(flightPlan.waypoints.map((w) => [w.lat, w.lon]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [120, 120] });
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Real Interactive Leaflet Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0 cursor-grab active:cursor-grabbing" />

      {/* Top-Left Micro Controls */}
      <aside className="fixed top-24 left-6 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <div className="glass-island p-1 rounded-xl flex items-center justify-between w-36 shadow-xl">
          <button
            onClick={() => handleZoom(1)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-outline hover:text-white flex items-center justify-center transition-colors"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-outline hover:text-white flex items-center justify-center transition-colors"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={handleRecenter}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-primary flex items-center justify-center transition-colors"
            title="Fit Route to Viewport"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
          </button>
        </div>

        {/* Airport Click Hint */}
        <div className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-[10px] font-mono text-outline backdrop-blur">
          <span>💡 Click any airport dot to inspect or route</span>
        </div>
      </aside>

      {/* Top-Right Sleek Flight Telemetry HUD Widget from Design 1 */}
      <aside className="fixed top-24 right-6 z-30 hidden md:flex flex-col gap-2 pointer-events-auto">
        <div className="glass-island p-3.5 rounded-2xl w-72 shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.07]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-outline">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="text-white font-semibold">ENROUTE TOC</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-primary font-bold">
              MSFS 2024
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">EST. TIME</span>
              <span className="text-sm font-bold text-secondary font-mono">{flightPlan.eteMinutes} MIN</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">CRZ ALTITUDE</span>
              <span className="text-sm font-bold text-white font-mono">FL{flightPlan.cruisingAlt / 100}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">BLOCK FUEL</span>
              <span className="text-sm font-bold text-tertiary font-mono">
                {flightPlan.blockFuelLbs.toLocaleString()} <span className="text-[10px] font-normal text-outline">LBS</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">AIRWAY FIXES</span>
              <span className="text-sm font-bold text-primary font-mono">{flightPlan.waypoints.length} LEGS</span>
            </div>
          </div>

          {/* Next Target Fix Highlight */}
          <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-primary/80 uppercase font-semibold">Planned Arrival</span>
              <span className="text-xs font-mono font-bold text-white">
                {flightPlan.destination.icao} • {flightPlan.approach}
              </span>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-primary font-bold">{flightPlan.distanceNm} NM</span>
              <span className="text-outline text-[10px] block">ETA {flightPlan.eteMinutes}m</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
