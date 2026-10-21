import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Airport, FlightPlan, Waypoint } from '../types/aviation';
import { GLOBAL_AIRPORTS } from '../data/airports';

interface InteractiveMapProps {
  flightPlan: FlightPlan;
  onSelectAirport: (apt: Airport, role: 'origin' | 'dest') => void;
}

type MapTheme = 'dark' | 'satellite' | 'osm';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ flightPlan, onSelectAirport }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const refLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const airportLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeTheme, setActiveTheme] = useState<MapTheme>('dark');

  // Tile layer configurations (100% Free, NO API KEY required)
  const TILE_SOURCES: Record<MapTheme, { base: string; ref?: string; maxZoom: number }> = {
    dark: {
      base: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      ref: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 16,
    },
    satellite: {
      base: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 18,
    },
    osm: {
      base: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
    },
  };

  // Phase color definitions for real IFR visualization
  const PHASE_COLORS: Record<NonNullable<Waypoint['phase']>, string> = {
    sid: '#4edea3', // Green / Emerald
    enroute: '#4cd7f6', // Cyan
    star: '#ffb95f', // Amber / Gold
    approach: '#e879f9', // Magenta / Purple
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [flightPlan.origin.lat, flightPlan.origin.lon],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    // Default: Esri Dark Gray (No API key needed)
    const baseTile = L.tileLayer(TILE_SOURCES.dark.base, {
      maxZoom: TILE_SOURCES.dark.maxZoom,
    }).addTo(map);

    const refTile = L.tileLayer(TILE_SOURCES.dark.ref!, {
      maxZoom: TILE_SOURCES.dark.maxZoom,
      opacity: 0.8,
    }).addTo(map);

    const routeLayer = L.layerGroup().addTo(map);
    const airportLayer = L.layerGroup().addTo(map);

    tileLayerRef.current = baseTile;
    refLayerRef.current = refTile;
    routeLayerRef.current = routeLayer;
    airportLayerRef.current = airportLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Theme Change
  const switchTheme = (theme: MapTheme) => {
    setActiveTheme(theme);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (refLayerRef.current) map.removeLayer(refLayerRef.current);

    const conf = TILE_SOURCES[theme];
    const newBase = L.tileLayer(conf.base, { maxZoom: conf.maxZoom }).addTo(map);
    tileLayerRef.current = newBase;

    if (conf.ref) {
      const newRef = L.tileLayer(conf.ref, { maxZoom: conf.maxZoom, opacity: 0.8 }).addTo(map);
      refLayerRef.current = newRef;
    } else {
      refLayerRef.current = null;
    }

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      map.addLayer(routeLayerRef.current);
    }
    if (airportLayerRef.current) {
      map.removeLayer(airportLayerRef.current);
      map.addLayer(airportLayerRef.current);
    }
  };

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

      const buildPopupContent = () => {
        const rwyListHtml = apt.runways
          .slice(0, 4)
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
        popupContent.style.minWidth = '230px';
        popupContent.innerHTML = `
          <div style="font-family:sans-serif;padding:2px;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;margin-bottom:6px;">
              <span style="font-size:14px;font-weight:bold;color:#f0f3ff;font-family:monospace;">${apt.icao} / ${apt.iata}</span>
              <span style="font-size:10px;color:#4cd7f6;font-family:monospace;">Elev ${apt.elevation}'</span>
            </div>
            <div style="font-size:11px;color:#a2b0ba;margin-bottom:6px;">${apt.name} (${apt.city}, ${apt.country})</div>
            <div style="margin-bottom:8px;background:rgba(0,0,0,0.3);padding:4px 6px;border-radius:6px;">
              ${rwyListHtml}
            </div>
            <div style="display:flex;gap:6px;">
              <button id="btn-set-dep-${apt.icao}" style="flex:1;padding:4px 8px;background:#4edea3;color:#003824;font-size:10px;font-weight:bold;font-family:monospace;border:none;border-radius:6px;cursor:pointer;">Set Origin</button>
              <button id="btn-set-arr-${apt.icao}" style="flex:1;padding:4px 8px;background:#ffb95f;color:#472a00;font-size:10px;font-weight:bold;font-family:monospace;border:none;border-radius:6px;cursor:pointer;">Set Dest</button>
            </div>
          </div>
        `;
        return popupContent;
      };

      if (isOrigin || isDest) {
        const markerColor = isOrigin ? '#4edea3' : '#ffb95f';
        const radius = 9;
        const icon = L.divIcon({
          className: 'custom-airport-icon',
          html: `<div style="
            width: ${radius * 2}px;
            height: ${radius * 2}px;
            background: ${markerColor};
            border-radius: 50%;
            border: 2px solid #060910;
            box-shadow: 0 0 16px ${markerColor};
            cursor: pointer;
          "></div>`,
          iconSize: [radius * 2, radius * 2],
          iconAnchor: [radius, radius],
        });

        const marker = L.marker([apt.lat, apt.lon], { icon, zIndexOffset: 1000 });
        marker.bindPopup(buildPopupContent);
        marker.on('popupopen', () => {
          const btnDep = document.getElementById(`btn-set-dep-${apt.icao}`);
          const btnArr = document.getElementById(`btn-set-arr-${apt.icao}`);
          if (btnDep) btnDep.onclick = () => onSelectAirport(apt, 'origin');
          if (btnArr) btnArr.onclick = () => onSelectAirport(apt, 'dest');
        });
        airportLayer.addLayer(marker);
      } else {
        const circle = L.circleMarker([apt.lat, apt.lon], {
          radius: 3.5,
          fillColor: '#4cd7f6',
          color: '#060910',
          weight: 1.5,
          fillOpacity: 0.8,
        });
        circle.bindPopup(buildPopupContent);
        circle.on('popupopen', () => {
          const btnDep = document.getElementById(`btn-set-dep-${apt.icao}`);
          const btnArr = document.getElementById(`btn-set-arr-${apt.icao}`);
          if (btnDep) btnDep.onclick = () => onSelectAirport(apt, 'origin');
          if (btnArr) btnArr.onclick = () => onSelectAirport(apt, 'dest');
        });
        airportLayer.addLayer(circle);
      }
    });

    // 2. Draw Multi-Phase Color-Coded Polylines (SID, Enroute, STAR, Approach)
    const wps = flightPlan.waypoints;
    for (let i = 0; i < wps.length - 1; i++) {
      const from = wps[i];
      const to = wps[i + 1];
      const phase = to.phase || from.phase || 'enroute';
      const color = PHASE_COLORS[phase] || '#4cd7f6';

      // Outer glow line
      const glowSegment = L.polyline(
        [
          [from.lat, from.lon],
          [to.lat, to.lon],
        ],
        {
          color,
          weight: 6,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }
      );

      // Inner crisp core line
      const coreSegment = L.polyline(
        [
          [from.lat, from.lon],
          [to.lat, to.lon],
        ],
        {
          color: '#ffffff',
          weight: 2,
          opacity: 0.9,
          dashArray: phase === 'approach' ? '3, 4' : phase === 'sid' ? '6, 4' : undefined,
          lineCap: 'round',
        }
      );

      routeLayer.addLayer(glowSegment);
      routeLayer.addLayer(coreSegment);
    }

    // 3. Draw Waypoint Markers along Route
    wps.forEach((wp) => {
      const isOriginApt = wp.ident === flightPlan.origin.icao;
      const isDestApt = wp.ident === flightPlan.destination.icao;
      if (isOriginApt || isDestApt) return; // Handled by airport markers

      const color = PHASE_COLORS[wp.phase || 'enroute'] || '#4cd7f6';
      const isRwyThreshold = wp.ident.startsWith('RW') && !wp.ident.includes('-END');
      const isRwyEnd = wp.ident.includes('-END');

      let iconHtml = '';
      let iconSize: [number, number] = [10, 10];
      let iconAnchor: [number, number] = [5, 5];

      if (isRwyThreshold) {
        iconSize = [12, 12];
        iconAnchor = [6, 6];
        iconHtml = `<div style="
          width: 12px;
          height: 12px;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 2px;
          box-shadow: 0 0 10px ${color};
        "></div>`;
      } else if (isRwyEnd) {
        iconSize = [8, 8];
        iconAnchor = [4, 4];
        iconHtml = `<div style="
          width: 8px;
          height: 8px;
          background: ${color};
          border: 1px solid #ffffff;
          border-radius: 50%;
        "></div>`;
      } else {
        iconHtml = `<div style="
          width: ${wp.phase === 'approach' ? '10px' : '8px'};
          height: ${wp.phase === 'approach' ? '10px' : '8px'};
          background: ${color};
          transform: rotate(45deg);
          border: 1px solid #060910;
          box-shadow: 0 0 8px ${color};
        "></div>`;
      }

      const wpIcon = L.divIcon({
        className: 'custom-wp-icon',
        html: iconHtml,
        iconSize,
        iconAnchor,
      });

      const wpMarker = L.marker([wp.lat, wp.lon], { icon: wpIcon });
      const altDisplay = wp.altFt <= Math.max(flightPlan.origin.elevation, flightPlan.destination.elevation) + 300
        ? `${wp.altFt}' GND`
        : `FL${Math.round(wp.altFt / 100)}`;

      wpMarker.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;font-weight:bold;color:#f0f3ff;">
          <span style="color:${color};text-transform:uppercase;">[${wp.phase || 'FIX'}]</span> ${wp.ident} • ${altDisplay}
          ${wp.info ? `<div style="font-size:9px;color:#a2b0ba;font-weight:normal;">${wp.info}</div>` : ''}
        </div>`,
        { permanent: false, direction: 'top', className: 'dark-tooltip' }
      );

      routeLayer.addLayer(wpMarker);
    });

    // Fit map bounds smoothly
    if (wps.length > 0) {
      const allCoords = wps.map((w) => [w.lat, w.lon] as [number, number]);
      const bounds = L.latLngBounds(allCoords);
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

      {/* Top-Left Floating Map Controls & Theme Switcher */}
      <aside className="fixed top-24 left-6 z-30 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Switcher */}
        <div className="glass-island p-1 rounded-xl flex flex-col gap-1 w-36 shadow-xl">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-mono font-semibold text-outline uppercase tracking-wider">
            <span>Layers</span>
            <span className="material-symbols-outlined text-[13px]">layers</span>
          </div>
          <button
            onClick={() => switchTheme('dark')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTheme === 'dark'
                ? 'text-primary bg-primary/10 border border-primary/20 font-bold'
                : 'text-outline hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>Tactical Dark</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${activeTheme === 'dark' ? 'bg-primary' : 'bg-outline/40'}`}
            />
          </button>
          <button
            onClick={() => switchTheme('satellite')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTheme === 'satellite'
                ? 'text-secondary bg-secondary/10 border border-secondary/20 font-bold'
                : 'text-outline hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>Satellite</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${activeTheme === 'satellite' ? 'bg-secondary' : 'bg-outline/40'}`}
            />
          </button>
          <button
            onClick={() => switchTheme('osm')}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
              activeTheme === 'osm'
                ? 'text-tertiary bg-tertiary/10 border border-tertiary/20 font-bold'
                : 'text-outline hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <span>OpenStreet</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${activeTheme === 'osm' ? 'bg-tertiary' : 'bg-outline/40'}`}
            />
          </button>
        </div>

        {/* Flight Phase Color Legend */}
        <div className="glass-island p-2 rounded-xl flex flex-col gap-1 w-36 shadow-xl text-[10px] font-mono">
          <span className="text-outline uppercase tracking-wider text-[9px] font-bold px-1 mb-0.5">IFR Route Phases</span>
          <div className="flex items-center gap-1.5 px-1 py-0.5 rounded bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <span className="text-secondary font-semibold">SID Departure</span>
          </div>
          <div className="flex items-center gap-1.5 px-1 py-0.5 rounded bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-[#4cd7f6]" />
            <span className="text-primary font-semibold">Enroute Cruise</span>
          </div>
          <div className="flex items-center gap-1.5 px-1 py-0.5 rounded bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-[#ffb95f]" />
            <span className="text-tertiary font-semibold">STAR Arrival</span>
          </div>
          <div className="flex items-center gap-1.5 px-1 py-0.5 rounded bg-white/[0.02]">
            <span className="w-2 h-2 rounded-full bg-[#e879f9]" />
            <span className="text-[#e879f9] font-semibold">Approach / ILS</span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="glass-island p-1 rounded-xl flex items-center justify-between w-36 shadow-xl">
          <button
            onClick={() => handleZoom(1)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-outline hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={() => handleZoom(-1)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-outline hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-[16px]">remove</span>
          </button>
          <div className="w-px h-3.5 bg-white/10" />
          <button
            onClick={handleRecenter}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-primary flex items-center justify-center transition-colors cursor-pointer"
            title="Fit Route to Viewport"
          >
            <span className="material-symbols-outlined text-[16px]">my_location</span>
          </button>
        </div>
      </aside>

      {/* Top-Right Sleek Flight Telemetry HUD Widget */}
      <aside className="fixed top-24 right-6 z-30 hidden md:flex flex-col gap-2 pointer-events-auto">
        <div className="glass-island p-3.5 rounded-2xl w-72 shadow-2xl">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.07]">
            <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-outline">
              <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              <span className="text-white font-semibold">IFR PROCEDURES</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-primary font-bold">
              MSFS 2024
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">SID DEPARTURE</span>
              <span className="text-xs font-bold text-secondary font-mono truncate block">{flightPlan.sid}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">STAR ARRIVAL</span>
              <span className="text-xs font-bold text-tertiary font-mono truncate block">{flightPlan.star}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">CRZ ALTITUDE</span>
              <span className="text-sm font-bold text-white font-mono">FL{flightPlan.cruisingAlt / 100}</span>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[10px] text-outline block mb-0.5">APPROACH</span>
              <span className="text-xs font-bold text-[#e879f9] font-mono truncate block">{flightPlan.approach}</span>
            </div>
          </div>

          {/* Next Target Fix Highlight */}
          <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-primary/80 uppercase font-semibold">Approach Target</span>
              <span className="text-xs font-mono font-bold text-white">
                {flightPlan.destRunway.ident} • {flightPlan.destRunway.ils?.freq ? `ILS ${flightPlan.destRunway.ils.freq} MHz` : 'VISUAL'}
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
