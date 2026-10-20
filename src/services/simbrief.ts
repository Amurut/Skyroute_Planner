import { Airport, FlightPlan, Waypoint } from '../types/aviation';

/**
 * Calculates Great Circle distance between two lat/lon coordinates in Nautical Miles
 */
export function calculateDistanceNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in NM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Pre-computed authentic AIRAC routes for popular simulator city-pairs
 */
const CURATED_ROUTES: Record<
  string,
  {
    sid: string;
    star: string;
    approach: string;
    crzAlt: number;
    routeString: string;
    waypoints: Omit<Waypoint, 'altFt'>[];
  }
> = {
  'KSFO-KLAX': {
    sid: 'WESLA5',
    star: 'IRNMN2',
    approach: 'ILS 25L',
    crzAlt: 33000,
    routeString: 'KSFO WESLA5 SKAGS Q120 ECA PIRAT IRNMN2 KLAX',
    waypoints: [
      { ident: 'KSFO', type: 'Airport', lat: 37.618999, lon: -122.375, info: 'Origin Runway 28L' },
      { ident: 'WESLA', type: 'Intersection', lat: 37.495, lon: -122.14, airway: 'SID Exit' },
      { ident: 'SKAGS', type: 'Intersection', lat: 37.255, lon: -121.836, airway: 'Q120' },
      { ident: 'ECA', type: 'VOR', lat: 36.702, lon: -120.806, airway: 'J110', isTOC: true, info: 'Manteca VOR' },
      { ident: 'PIRAT', type: 'Intersection', lat: 35.211, lon: -119.536, airway: 'J110', isTOD: true },
      { ident: 'IRNMN', type: 'Intersection', lat: 34.306, lon: -118.87, airway: 'STAR Entry' },
      { ident: 'KLAX', type: 'Airport', lat: 33.942501, lon: -118.407997, info: 'Dest Runway 25L' },
    ],
  },
  'EGLL-LFPG': {
    sid: 'DET2G',
    star: 'BIBA5A',
    approach: 'ILS 26L',
    crzAlt: 21000,
    routeString: 'EGLL DET2G DET L6 DVR UL9 KONAN BIBA5A LFPG',
    waypoints: [
      { ident: 'EGLL', type: 'Airport', lat: 51.4706, lon: -0.461941, info: 'Origin Runway 27R' },
      { ident: 'DET', type: 'VOR', lat: 51.303, lon: 0.603, airway: 'SID' },
      { ident: 'DVR', type: 'VOR', lat: 51.162, lon: 1.358, airway: 'L6', isTOC: true },
      { ident: 'KONAN', type: 'Intersection', lat: 50.849, lon: 1.833, airway: 'UL9', isTOD: true },
      { ident: 'BIBAX', type: 'Intersection', lat: 49.524, lon: 2.21, airway: 'STAR' },
      { ident: 'LFPG', type: 'Airport', lat: 49.012798, lon: 2.55, info: 'Dest Runway 26L' },
    ],
  },
  'KJFK-KMIA': {
    sid: 'SKORR4',
    star: 'CUDDA3',
    approach: 'ILS 08R',
    crzAlt: 36000,
    routeString: 'KJFK SKORR4 RNGRR WHITE J121 CHS AR17 CUDDA3 KMIA',
    waypoints: [
      { ident: 'KJFK', type: 'Airport', lat: 40.639801, lon: -73.7789, info: 'Origin Runway 13L' },
      { ident: 'RNGRR', type: 'Intersection', lat: 39.81, lon: -74.45, airway: 'SID' },
      { ident: 'WHITE', type: 'Intersection', lat: 38.38, lon: -75.48, airway: 'J121' },
      { ident: 'CHS', type: 'VOR', lat: 32.898, lon: -80.038, airway: 'J121', isTOC: true },
      { ident: 'CUDDA', type: 'Intersection', lat: 26.68, lon: -80.24, airway: 'AR17', isTOD: true },
      { ident: 'KMIA', type: 'Airport', lat: 25.793199, lon: -80.290603, info: 'Dest Runway 08R' },
    ],
  },
};

/**
 * Creates or fetches an authentic flight plan between two airports
 */
export async function generateFlightPlan(
  origin: Airport,
  destination: Airport,
  simbriefUsername?: string
): Promise<FlightPlan> {
  const originRunway = origin.runways[0];
  const destRunway = destination.runways.find((r) => r.ils) || destination.runways[0];
  const pairKey = `${origin.icao}-${destination.icao}`;
  const distance = calculateDistanceNm(origin.lat, origin.lon, destination.lat, destination.lon);

  // If user provided a SimBrief username, attempt live fetch
  if (simbriefUsername && simbriefUsername.trim().length > 0) {
    try {
      const res = await fetch(
        `https://www.simbrief.com/api/xml.fetcher.php?username=${encodeURIComponent(simbriefUsername.trim())}&json=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.origin && data.destination && data.navlog) {
          const rawWaypoints: Waypoint[] = [];
          const fixes = Array.isArray(data.navlog.fix) ? data.navlog.fix : [];

          fixes.forEach((f: any, idx: number) => {
            rawWaypoints.push({
              ident: f.ident,
              type: f.type === 'vor' ? 'VOR' : f.type === 'ndb' ? 'NDB' : 'Intersection',
              lat: parseFloat(f.pos_lat),
              lon: parseFloat(f.pos_long),
              altFt: parseInt(f.altitude_feet || '30000', 10),
              airway: f.airway || undefined,
              isTOC: idx === Math.floor(fixes.length * 0.3),
              isTOD: idx === Math.floor(fixes.length * 0.7),
            });
          });

          return {
            title: `${origin.icao} to ${destination.icao}`,
            origin,
            destination,
            originRunway,
            destRunway,
            sid: data.general?.sid || 'DIRECT',
            star: data.general?.star || 'DIRECT',
            approach: destRunway.ils ? `ILS ${destRunway.ident}` : `VISUAL ${destRunway.ident}`,
            cruisingAlt: parseInt(data.general?.initial_fl || '32000', 10),
            aircraft: data.aircraft?.icaocode || 'A320',
            aircraftEngine: 'CFM-LEAP 1A',
            distanceNm: parseInt(data.general?.air_distance || String(distance), 10),
            eteMinutes: Math.round(distance / 7.5),
            waypoints: rawWaypoints.length > 0 ? rawWaypoints : generateSyntheticWaypoints(origin, destination, 33000),
            routeString: data.general?.route || `${origin.icao} DCT ${destination.icao}`,
            costIndex: parseInt(data.params?.costindex || '35', 10),
            blockFuelLbs: parseInt(data.fuel?.plan_ramp || '12500', 10),
          };
        }
      }
    } catch {
      // Fallback silently to internal routing engine
    }
  }

  // Check if we have an authentic curated route for this pair
  if (CURATED_ROUTES[pairKey]) {
    const cur = CURATED_ROUTES[pairKey];
    const waypoints: Waypoint[] = cur.waypoints.map((w, idx) => {
      let alt = cur.crzAlt;
      if (idx === 0) alt = origin.elevation;
      else if (idx === 1) alt = 10000;
      else if (idx === cur.waypoints.length - 2) alt = 8000;
      else if (idx === cur.waypoints.length - 1) alt = destination.elevation;
      return { ...w, altFt: alt };
    });

    return {
      title: `${origin.icao} to ${destination.icao}`,
      origin,
      destination,
      originRunway,
      destRunway,
      sid: cur.sid,
      star: cur.star,
      approach: cur.approach,
      cruisingAlt: cur.crzAlt,
      aircraft: 'A320neo',
      aircraftEngine: 'CFM-LEAP 1A',
      distanceNm: distance,
      eteMinutes: Math.round(distance / 7.2) + 15,
      waypoints,
      routeString: cur.routeString,
      costIndex: 32,
      blockFuelLbs: Math.round(distance * 14.5 + 4200),
    };
  }

  // Dynamic procedural flight plan generator for any arbitrary airport pair
  const crzAlt = distance > 500 ? 36000 : distance > 250 ? 32000 : 18000;
  const sid = `${origin.icao.slice(1)}1D`;
  const star = `${destination.icao.slice(1)}1A`;
  const waypoints = generateSyntheticWaypoints(origin, destination, crzAlt);
  const routeString = `${origin.icao} ${sid} DCT ${waypoints[2]?.ident || 'MIDPT'} DCT ${star} ${destination.icao}`;

  return {
    title: `${origin.icao} to ${destination.icao}`,
    origin,
    destination,
    originRunway,
    destRunway,
    sid,
    star,
    approach: destRunway.ils ? `ILS ${destRunway.ident}` : `VISUAL ${destRunway.ident}`,
    cruisingAlt: crzAlt,
    aircraft: 'A320neo',
    aircraftEngine: 'CFM-LEAP 1A',
    distanceNm: distance,
    eteMinutes: Math.round(distance / 7.2) + 12,
    waypoints,
    routeString,
    costIndex: 30,
    blockFuelLbs: Math.round(distance * 13.8 + 3800),
  };
}

/**
 * Generates intermediate realistic waypoints along the Great Circle arc
 */
function generateSyntheticWaypoints(origin: Airport, destination: Airport, crzAlt: number): Waypoint[] {
  const steps = 5;
  const waypoints: Waypoint[] = [
    {
      ident: origin.icao,
      type: 'Airport',
      lat: origin.lat,
      lon: origin.lon,
      altFt: origin.elevation,
      info: `Origin Runway ${origin.runways[0].ident}`,
    },
  ];

  for (let i = 1; i < steps; i++) {
    const fraction = i / steps;
    const lat = origin.lat + (destination.lat - origin.lat) * fraction;
    const lon = origin.lon + (destination.lon - origin.lon) * fraction;
    let ident = `FIX0${i}`;
    let isTOC = false;
    let isTOD = false;
    let alt = crzAlt;

    if (i === 1) {
      ident = `${origin.icao.slice(1)}OUT`;
      alt = Math.min(10000, crzAlt);
    } else if (i === 2) {
      ident = 'TOCPT';
      isTOC = true;
      alt = crzAlt;
    } else if (i === steps - 1) {
      ident = `${destination.icao.slice(1)}IN`;
      isTOD = true;
      alt = Math.min(8000, crzAlt);
    }

    waypoints.push({
      ident,
      type: i === 2 ? 'VOR' : 'Intersection',
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      altFt: alt,
      isTOC,
      isTOD,
    });
  }

  waypoints.push({
    ident: destination.icao,
    type: 'Airport',
    lat: destination.lat,
    lon: destination.lon,
    altFt: destination.elevation,
    info: `Dest Runway ${destination.runways[0].ident}`,
  });

  return waypoints;
}
