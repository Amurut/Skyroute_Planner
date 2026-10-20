import { Airport, ProcedureOption, Runway, Waypoint } from '../types/aviation';

/**
 * Calculates geographical coordinates given start point, bearing (deg), and distance (NM)
 */
export function projectCoordinates(
  lat: number,
  lon: number,
  bearingDeg: number,
  distanceNm: number
): { lat: number; lon: number } {
  const R = 3440.065; // Earth radius in NM
  const radLat = (lat * Math.PI) / 180;
  const radLon = (lon * Math.PI) / 180;
  const radBearing = (bearingDeg * Math.PI) / 180;
  const d = distanceNm / R;

  const newLat = Math.asin(
    Math.sin(radLat) * Math.cos(d) + Math.cos(radLat) * Math.sin(d) * Math.cos(radBearing)
  );
  const newLon =
    radLon +
    Math.atan2(
      Math.sin(radBearing) * Math.sin(d) * Math.cos(radLat),
      Math.cos(d) - Math.sin(radLat) * Math.sin(newLat)
    );

  return {
    lat: Number(((newLat * 180) / Math.PI).toFixed(5)),
    lon: Number(((newLon * 180) / Math.PI).toFixed(5)),
  };
}

/**
 * Dynamically generates authentic ILS / RNAV approach fixes along the extended runway centerline
 */
export function generateRunwayApproach(
  airport: Airport,
  runway: Runway,
  approachType: 'ILS' | 'RNAV' | 'VISUAL'
): ProcedureOption {
  // Runway heading is where the runway points.
  // The inbound approach comes from the opposite direction (heading + 180).
  const backCourse = (runway.heading + 180) % 360;

  // 1. Final Approach Fix (FAF): ~5.5 NM out on extended centerline
  const fafCoords = projectCoordinates(airport.lat, airport.lon, backCourse, 5.5);
  // 2. Intermediate / Initial Approach Fix (IAF): ~12 NM out on extended centerline
  const iafCoords = projectCoordinates(airport.lat, airport.lon, backCourse, 12.0);

  const fafAlt = Math.max(airport.elevation + 1800, 2200);
  const iafAlt = Math.max(airport.elevation + 3800, 4200);

  const fixes: Omit<Waypoint, 'phase'>[] = [
    {
      ident: `IAF${runway.ident}`,
      type: 'Intersection',
      lat: iafCoords.lat,
      lon: iafCoords.lon,
      altFt: iafAlt,
      info: `Initial Approach Fix (${approachType} ${runway.ident})`,
    },
    {
      ident: `FAF${runway.ident}`,
      type: 'Intersection',
      lat: fafCoords.lat,
      lon: fafCoords.lon,
      altFt: fafAlt,
      info: `Final Approach Fix (Glideslope Intercept ${runway.ils?.gsAngle || 3.0}°)`,
    },
    {
      ident: `RW${runway.ident}`,
      type: 'Airport',
      lat: airport.lat,
      lon: airport.lon,
      altFt: airport.elevation,
      info: `Runway ${runway.ident} Touchdown Zone`,
    },
  ];

  return {
    name: `${approachType} ${runway.ident}`,
    type: 'APPROACH',
    runway: runway.ident,
    description: runway.ils
      ? `Precision ${approachType} Cat III via Localizer ${runway.ils.freq} MHz / CRS ${runway.ils.course}°`
      : `Non-precision ${approachType} Approach`,
    waypoints: fixes,
  };
}

/**
 * Curated authentic SIDs, STARs, and Approaches for major simulator airports
 */
export const AIRPORT_PROCEDURES: Record<
  string,
  {
    sids: ProcedureOption[];
    stars: ProcedureOption[];
    approaches: ProcedureOption[];
  }
> = {
  KSFO: {
    sids: [
      {
        name: 'WESLA5',
        type: 'SID',
        runway: '28L',
        transitionFix: 'SKAGS',
        description: 'Standard Southbound Departure via San Francisco Bay & Silicon Valley',
        waypoints: [
          { ident: 'SFO06', type: 'Intersection', lat: 37.64, lon: -122.42, altFt: 1800 },
          { ident: 'GAP', type: 'VOR', lat: 37.58, lon: -122.35, altFt: 4000, info: 'San Bruno Gap' },
          { ident: 'WESLA', type: 'Intersection', lat: 37.495, lon: -122.14, altFt: 10000, airway: 'SID Exit' },
          { ident: 'SKAGS', type: 'Intersection', lat: 37.255, lon: -121.836, altFt: 16000, airway: 'Q120' },
        ],
      },
      {
        name: 'OFFSH9',
        type: 'SID',
        runway: '28R',
        transitionFix: 'OSI',
        description: 'Pacific Coastal Offshore Departure via Woodside',
        waypoints: [
          { ident: 'SWORD', type: 'Intersection', lat: 37.68, lon: -122.52, altFt: 3000 },
          { ident: 'OFFSH', type: 'Intersection', lat: 37.52, lon: -122.65, altFt: 8000 },
          { ident: 'OSI', type: 'VOR', lat: 37.39, lon: -122.28, altFt: 14000, info: 'Woodside VOR' },
        ],
      },
      {
        name: 'SFO2',
        type: 'SID',
        runway: '01R',
        transitionFix: 'OAK',
        description: 'Northbound Bay Visual / Radar Departure toward Oakland',
        waypoints: [
          { ident: 'BAY01', type: 'Intersection', lat: 37.69, lon: -122.35, altFt: 2500 },
          { ident: 'OAK', type: 'VOR', lat: 37.72, lon: -122.22, altFt: 6000 },
        ],
      },
    ],
    stars: [
      {
        name: 'BDEGA3',
        type: 'STAR',
        transitionFix: 'BDEGA',
        description: 'Northwest Arrival over Point Reyes & Golden Gate',
        waypoints: [
          { ident: 'BDEGA', type: 'Intersection', lat: 38.31, lon: -123.01, altFt: 15000 },
          { ident: 'BRIXX', type: 'Intersection', lat: 38.05, lon: -122.81, altFt: 11000 },
          { ident: 'MENLO', type: 'Intersection', lat: 37.75, lon: -122.55, altFt: 6000 },
        ],
      },
      {
        name: 'SERFR4',
        type: 'STAR',
        transitionFix: 'SERFR',
        description: 'South/East Arrival from Central Valley & Los Angeles',
        waypoints: [
          { ident: 'SERFR', type: 'Intersection', lat: 36.98, lon: -121.65, altFt: 14000 },
          { ident: 'WWAVS', type: 'Intersection', lat: 37.21, lon: -121.95, altFt: 10000 },
          { ident: 'EDDYY', type: 'Intersection', lat: 37.45, lon: -122.18, altFt: 5000 },
        ],
      },
    ],
    approaches: [
      {
        name: 'ILS 28L',
        type: 'APPROACH',
        runway: '28L',
        description: 'Precision Cat III ILS via Localizer 111.70 MHz (I-SFO)',
        waypoints: [
          { ident: 'AXMUL', type: 'Intersection', lat: 37.53, lon: -122.15, altFt: 4000, info: 'IAF' },
          { ident: 'DUMBA', type: 'Intersection', lat: 37.58, lon: -122.27, altFt: 1900, info: 'FAF Glideslope' },
          { ident: 'RW28L', type: 'Airport', lat: 37.618999, lon: -122.375, altFt: 13, info: 'Runway 28L' },
        ],
      },
      {
        name: 'ILS 28R',
        type: 'APPROACH',
        runway: '28R',
        description: 'Precision Cat III ILS via Localizer 110.70 MHz (I-GWQ)',
        waypoints: [
          { ident: 'EDDYY', type: 'Intersection', lat: 37.54, lon: -122.14, altFt: 4000, info: 'IAF' },
          { ident: 'ARCHI', type: 'Intersection', lat: 37.59, lon: -122.26, altFt: 1900, info: 'FAF Glideslope' },
          { ident: 'RW28R', type: 'Airport', lat: 37.618999, lon: -122.375, altFt: 13, info: 'Runway 28R' },
        ],
      },
    ],
  },
  KLAX: {
    sids: [
      {
        name: 'DOTSS2',
        type: 'SID',
        runway: '25L',
        transitionFix: 'SLI',
        description: 'Offshore Pacific Climb & Turn toward Seal Beach',
        waypoints: [
          { ident: 'SKWRL', type: 'Intersection', lat: 33.92, lon: -118.52, altFt: 2500 },
          { ident: 'DOTSS', type: 'Intersection', lat: 33.82, lon: -118.62, altFt: 6000 },
          { ident: 'SLI', type: 'VOR', lat: 33.78, lon: -118.05, altFt: 10000, info: 'Seal Beach VOR' },
        ],
      },
      {
        name: 'GABRE2',
        type: 'SID',
        runway: '24L',
        transitionFix: 'GABRE',
        description: 'Over-Ocean Departure with Eastbound Loop',
        waypoints: [
          { ident: 'PEVEE', type: 'Intersection', lat: 33.91, lon: -118.55, altFt: 3000 },
          { ident: 'GABRE', type: 'Intersection', lat: 33.81, lon: -118.42, altFt: 7000 },
        ],
      },
    ],
    stars: [
      {
        name: 'IRNMN2',
        type: 'STAR',
        transitionFix: 'IRNMN',
        description: 'North/West Arrival over Simi Valley & Santa Monica',
        waypoints: [
          { ident: 'IRNMN', type: 'Intersection', lat: 34.306, lon: -118.87, altFt: 12000, airway: 'STAR Entry' },
          { ident: 'DOWNE', type: 'Intersection', lat: 34.15, lon: -118.62, altFt: 9000 },
          { ident: 'HUNDA', type: 'Intersection', lat: 33.99, lon: -118.28, altFt: 6000 },
        ],
      },
      {
        name: 'SADDE6',
        type: 'STAR',
        transitionFix: 'SADDE',
        description: 'Classic Arrival via Fillmore & Van Nuys',
        waypoints: [
          { ident: 'SADDE', type: 'Intersection', lat: 34.38, lon: -119.05, altFt: 14000 },
          { ident: 'FILMO', type: 'Intersection', lat: 34.25, lon: -118.82, altFt: 11000 },
          { ident: 'VNY', type: 'VOR', lat: 34.22, lon: -118.49, altFt: 8000, info: 'Van Nuys VOR' },
          { ident: 'SMO', type: 'VOR', lat: 34.02, lon: -118.45, altFt: 5000, info: 'Santa Monica VOR' },
        ],
      },
      {
        name: 'ANJLL4',
        type: 'STAR',
        transitionFix: 'ANJLL',
        description: 'Eastbound High Sierra & Las Vegas Transition',
        waypoints: [
          { ident: 'ANJLL', type: 'Intersection', lat: 34.45, lon: -117.85, altFt: 15000 },
          { ident: 'FERN', type: 'Intersection', lat: 34.22, lon: -117.98, altFt: 11000 },
          { ident: 'CRCUS', type: 'Intersection', lat: 34.02, lon: -118.15, altFt: 7000 },
        ],
      },
    ],
    approaches: [
      {
        name: 'ILS 25L',
        type: 'APPROACH',
        runway: '25L',
        description: 'Precision Cat III ILS via Localizer 109.90 MHz (I-OSS) / CRS 251°',
        waypoints: [
          { ident: 'CIVIT', type: 'Intersection', lat: 33.97, lon: -118.15, altFt: 5000, info: 'IAF' },
          { ident: 'GAATE', type: 'Intersection', lat: 33.96, lon: -118.25, altFt: 3200 },
          { ident: 'HABLO', type: 'Intersection', lat: 33.95, lon: -118.32, altFt: 2200, info: 'FAF Glideslope' },
          { ident: 'RW25L', type: 'Airport', lat: 33.942501, lon: -118.407997, altFt: 128, info: 'Runway 25L' },
        ],
      },
      {
        name: 'ILS 25R',
        type: 'APPROACH',
        runway: '25R',
        description: 'Precision Cat III ILS via Localizer 111.10 MHz (I-LAX) / CRS 251°',
        waypoints: [
          { ident: 'MERCE', type: 'Intersection', lat: 33.98, lon: -118.15, altFt: 5000, info: 'IAF' },
          { ident: 'ROMEN', type: 'Intersection', lat: 33.97, lon: -118.25, altFt: 3200 },
          { ident: 'CLAVY', type: 'Intersection', lat: 33.96, lon: -118.32, altFt: 2200, info: 'FAF Glideslope' },
          { ident: 'RW25R', type: 'Airport', lat: 33.942501, lon: -118.407997, altFt: 128, info: 'Runway 25R' },
        ],
      },
      {
        name: 'ILS 24R',
        type: 'APPROACH',
        runway: '24R',
        description: 'Precision ILS via Localizer 111.70 MHz (I-CNA) / CRS 251°',
        waypoints: [
          { ident: 'JETTI', type: 'Intersection', lat: 34.01, lon: -118.18, altFt: 5000, info: 'IAF' },
          { ident: 'FAITH', type: 'Intersection', lat: 33.98, lon: -118.31, altFt: 2200, info: 'FAF Glideslope' },
          { ident: 'RW24R', type: 'Airport', lat: 33.942501, lon: -118.407997, altFt: 128, info: 'Runway 24R' },
        ],
      },
    ],
  },
};

/**
 * Returns available SIDs, STARs, and Approaches for an airport pair
 */
export function getProceduresForAirport(
  airport: Airport,
  _type: 'origin' | 'dest'
): { sids: ProcedureOption[]; stars: ProcedureOption[]; approaches: ProcedureOption[] } {
  const curated = AIRPORT_PROCEDURES[airport.icao];

  // Default approaches built from all available airport runways
  const runwayApproaches: ProcedureOption[] = airport.runways.map((rwy) =>
    generateRunwayApproach(airport, rwy, rwy.ils ? 'ILS' : 'RNAV')
  );

  if (curated) {
    // Combine curated with runway approaches (deduplicating by name)
    const approaches = [...curated.approaches];
    runwayApproaches.forEach((ra) => {
      if (!approaches.some((a) => a.name === ra.name)) {
        approaches.push(ra);
      }
    });
    return {
      sids: curated.sids,
      stars: curated.stars,
      approaches,
    };
  }

  // Generic dynamic procedural fallback for any other airport worldwide
  const primaryRwy = airport.runways[0];
  const genericSid: ProcedureOption = {
    name: `${airport.icao.slice(1)}1D`,
    type: 'SID',
    runway: primaryRwy.ident,
    description: `Standard Departure via Runway ${primaryRwy.ident}`,
    waypoints: [
      {
        ident: `${airport.icao.slice(1)}D1`,
        type: 'Intersection',
        ...projectCoordinates(airport.lat, airport.lon, primaryRwy.heading, 8),
        altFt: airport.elevation + 3000,
      },
      {
        ident: `${airport.icao.slice(1)}D2`,
        type: 'Intersection',
        ...projectCoordinates(airport.lat, airport.lon, primaryRwy.heading + 20, 18),
        altFt: airport.elevation + 8000,
      },
    ],
  };

  const genericStar: ProcedureOption = {
    name: `${airport.icao.slice(1)}1A`,
    type: 'STAR',
    runway: primaryRwy.ident,
    description: `Standard Terminal Arrival to Runway ${primaryRwy.ident}`,
    waypoints: [
      {
        ident: `${airport.icao.slice(1)}A1`,
        type: 'Intersection',
        ...projectCoordinates(airport.lat, airport.lon, (primaryRwy.heading + 160) % 360, 25),
        altFt: 14000,
      },
      {
        ident: `${airport.icao.slice(1)}A2`,
        type: 'Intersection',
        ...projectCoordinates(airport.lat, airport.lon, (primaryRwy.heading + 170) % 360, 16),
        altFt: 8000,
      },
    ],
  };

  return {
    sids: [genericSid],
    stars: [genericStar],
    approaches: runwayApproaches,
  };
}
