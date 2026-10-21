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
 * Gets exact runway threshold coordinates (or projects from airport center if missing)
 */
export function getRunwayThresholdCoords(airport: Airport, runway: Runway): { lat: number; lon: number } {
  if (runway.thresholdLat !== undefined && runway.thresholdLon !== undefined) {
    return { lat: runway.thresholdLat, lon: runway.thresholdLon };
  }
  const backCourse = (runway.heading + 180) % 360;
  const halfLengthNm = (runway.lengthFt / 2) / 6076.12;
  return projectCoordinates(airport.lat, airport.lon, backCourse, halfLengthNm);
}

/**
 * Gets exact runway departure/liftoff end coordinates
 */
export function getRunwayDepartureEndCoords(airport: Airport, runway: Runway): { lat: number; lon: number } {
  if (runway.endLat !== undefined && runway.endLon !== undefined) {
    return { lat: runway.endLat, lon: runway.endLon };
  }
  const halfLengthNm = (runway.lengthFt / 2) / 6076.12;
  return projectCoordinates(airport.lat, airport.lon, runway.heading, halfLengthNm);
}

/**
 * Tests if a procedure is valid for the specified runway
 */
export function isProcedureForRunway(proc: ProcedureOption, rwyIdent: string): boolean {
  if (!proc || !rwyIdent) return false;
  const cleanRwy = rwyIdent.trim().toUpperCase();
  const rwyDigits = cleanRwy.replace(/[^0-9]/g, '');

  if (proc.runway) {
    const cleanProc = proc.runway.trim().toUpperCase();
    if (cleanProc === cleanRwy) return true;
    const procDigits = cleanProc.replace(/[^0-9]/g, '');
    const procHasLetter = /[LRC]/i.test(cleanProc);
    // If proc specifies runway number without suffix (e.g. "09"), it applies to parallel runways (09L/09R)
    if (!procHasLetter && procDigits && rwyDigits && procDigits === rwyDigits) {
      return true;
    }
    return false;
  }
  if (proc.runways && proc.runways.length > 0) {
    return proc.runways.some((r) => {
      const cleanR = r.trim().toUpperCase();
      if (cleanR === cleanRwy) return true;
      const digits = cleanR.replace(/[^0-9]/g, '');
      const hasLetter = /[LRC]/i.test(cleanR);
      if (!hasLetter && digits && rwyDigits && digits === rwyDigits) {
        return true;
      }
      return false;
    });
  }
  return true;
}

/**
 * Dynamically generates authentic ILS / RNAV approach fixes along the extended runway centerline
 * down to the exact physical runway landing threshold.
 */
export function generateRunwayApproach(
  airport: Airport,
  runway: Runway,
  approachType: 'ILS' | 'RNAV' | 'VISUAL'
): ProcedureOption {
  const threshold = getRunwayThresholdCoords(airport, runway);
  const backCourse = (runway.heading + 180) % 360;

  // 1. Final Approach Fix (FAF): ~5.5 NM out on extended centerline from landing threshold
  const fafCoords = projectCoordinates(threshold.lat, threshold.lon, backCourse, 5.5);
  // 2. Intermediate / Initial Approach Fix (IAF): ~12.0 NM out on extended centerline
  const iafCoords = projectCoordinates(threshold.lat, threshold.lon, backCourse, 12.0);

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
      lat: threshold.lat,
      lon: threshold.lon,
      altFt: airport.elevation,
      info: `Runway ${runway.ident} Landing Threshold Zone`,
    },
  ];

  return {
    name: `${approachType} ${runway.ident}`,
    type: 'APPROACH',
    runway: runway.ident,
    description: runway.ils
      ? `Precision ${approachType} Cat III via Localizer ${runway.ils.freq} MHz / CRS ${runway.ils.course}°`
      : `Non-precision ${approachType} Approach to Runway ${runway.ident}`,
    waypoints: fixes,
  };
}

/**
 * Curated authentic SIDs and STARs for major simulator airports & Indian hubs,
 * with strict runway associations.
 */
export const AIRPORT_PROCEDURES: Record<
  string,
  {
    sids: ProcedureOption[];
    stars: ProcedureOption[];
  }
> = {
  // BENGALURU (VOBL) - Kempegowda Intl
  VOBL: {
    sids: [
      // 09L / 09R Departures (Eastbound heading ~092°)
      {
        name: 'SUSG1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'SUSGI 1A Departure via East Corridor to Chennai / Bay of Bengal',
        waypoints: [
          { ident: 'BL401', type: 'Intersection', lat: 13.208, lon: 77.820, altFt: 5000, info: 'Initial Turn' },
          { ident: 'SUSGI', type: 'Intersection', lat: 13.215, lon: 78.105, altFt: 11000, info: 'SUSGI Waypoint' },
        ],
      },
      {
        name: 'PABT1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'PABTY 1A Departure via North-East Corridor',
        waypoints: [
          { ident: 'BL404', type: 'Intersection', lat: 13.340, lon: 77.880, altFt: 7000, info: 'NE Vector' },
          { ident: 'PABTY', type: 'Intersection', lat: 13.720, lon: 78.150, altFt: 15000, info: 'PABTY Waypoint' },
        ],
      },
      {
        name: 'VAGU1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'VAGUS 1A Departure via South-East to Coimbatore',
        waypoints: [
          { ident: 'BL406', type: 'Intersection', lat: 12.980, lon: 77.850, altFt: 7000, info: 'SE Turn' },
          { ident: 'VAGUS', type: 'Intersection', lat: 12.450, lon: 77.920, altFt: 14000, info: 'VAGUS Fix' },
        ],
      },
      {
        name: 'OPAL1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'OPALE 1A Departure via North-West to Hyderabad / Mumbai',
        waypoints: [
          { ident: 'BL402', type: 'Intersection', lat: 13.310, lon: 77.650, altFt: 6000, info: 'North Climb' },
          { ident: 'OPALE', type: 'Intersection', lat: 13.580, lon: 77.420, altFt: 14000, info: 'OPALE Transition' },
        ],
      },
      // 27L / 27R Departures (Westbound heading ~272°)
      {
        name: 'MIA1B',
        type: 'SID',
        runways: ['27R', '27L'],
        description: 'MIA 1B Departure via West to Mangalore / Arabian Sea',
        waypoints: [
          { ident: 'BL405', type: 'Intersection', lat: 13.150, lon: 77.400, altFt: 6000, info: 'West Exit' },
          { ident: 'MIA', type: 'VOR', lat: 12.920, lon: 74.880, altFt: 16000, info: 'Mangalore VOR' },
        ],
      },
      {
        name: 'GUNM1B',
        type: 'SID',
        runways: ['27R', '27L'],
        description: 'GUNMO 1B Departure via South-West to Cochin / Trivandrum',
        waypoints: [
          { ident: 'BL403', type: 'Intersection', lat: 13.050, lon: 77.580, altFt: 6500, info: 'South Turn' },
          { ident: 'GUNMO', type: 'Intersection', lat: 12.650, lon: 77.300, altFt: 13000, info: 'GUNMO Fix' },
        ],
      },
      {
        name: 'OPAL1B',
        type: 'SID',
        runways: ['27R', '27L'],
        description: 'OPALE 1B Departure via North-West to Hyderabad / Mumbai',
        waypoints: [
          { ident: 'BL407', type: 'Intersection', lat: 13.250, lon: 77.500, altFt: 6000, info: 'West-North Climb' },
          { ident: 'OPALE', type: 'Intersection', lat: 13.580, lon: 77.420, altFt: 14000, info: 'OPALE Transition' },
        ],
      },
    ],
    stars: [
      // 09L / 09R Arrivals (landing on heading 092°, arriving from West/North)
      {
        name: 'LATU1A',
        type: 'STAR',
        runways: ['09L', '09R'],
        description: 'LATUR 1A Arrival from West / Arabian Coast to RWY 09',
        waypoints: [
          { ident: 'LATUR', type: 'Intersection', lat: 13.100, lon: 77.050, altFt: 14000, info: 'LATUR Entry' },
          { ident: 'BL504', type: 'Intersection', lat: 13.140, lon: 77.450, altFt: 7500, info: 'Base Turn' },
        ],
      },
      {
        name: 'MIA1A',
        type: 'STAR',
        runways: ['09L', '09R'],
        description: 'MIA 1A Arrival from Mangalore / West to RWY 09',
        waypoints: [
          { ident: 'MIA', type: 'VOR', lat: 12.920, lon: 74.880, altFt: 16000, info: 'MIA Entry' },
          { ident: 'BL506', type: 'Intersection', lat: 13.180, lon: 77.480, altFt: 6500, info: 'Inbound Vector' },
        ],
      },
      // 27L / 27R Arrivals (landing on heading 272°, arriving from East/North)
      {
        name: 'TELP1B',
        type: 'STAR',
        runways: ['27R', '27L'],
        description: 'TELPO 1B Arrival from North / Hyderabad to RWY 27',
        waypoints: [
          { ident: 'TELPO', type: 'Intersection', lat: 13.850, lon: 77.550, altFt: 16000, info: 'TELPO Entry' },
          { ident: 'BL501', type: 'Intersection', lat: 13.480, lon: 77.620, altFt: 9000, info: 'Inbound Descent' },
          { ident: 'BL502', type: 'Intersection', lat: 13.310, lon: 77.680, altFt: 6000, info: 'Intermediate' },
        ],
      },
      {
        name: 'ADEN1B',
        type: 'STAR',
        runways: ['27R', '27L'],
        description: 'ADENI 1B Arrival from East / Chennai to RWY 27',
        waypoints: [
          { ident: 'ADENI', type: 'Intersection', lat: 13.150, lon: 78.450, altFt: 15000, info: 'ADENI Entry' },
          { ident: 'BL503', type: 'Intersection', lat: 13.180, lon: 78.050, altFt: 8500, info: 'Downwind Leg' },
        ],
      },
      {
        name: 'BIA1B',
        type: 'STAR',
        runways: ['27R', '27L'],
        description: 'BIA 1B Arrival via Bengaluru VOR Radial to RWY 27',
        waypoints: [
          { ident: 'BIA', type: 'VOR', lat: 13.200, lon: 77.710, altFt: 10000, info: 'BIA VOR' },
          { ident: 'BL505', type: 'Intersection', lat: 13.205, lon: 77.550, altFt: 6000, info: 'Arrival Intercept' },
        ],
      },
    ],
  },

  // HYDERABAD (VOHS) - Rajiv Gandhi Intl
  VOHS: {
    sids: [
      {
        name: 'HYD1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'HYD 1A Departure via East Turn to Hyderabad VOR',
        waypoints: [
          { ident: 'HS401', type: 'Intersection', lat: 17.240, lon: 78.520, altFt: 4500, info: 'Initial Climb' },
          { ident: 'HYD', type: 'VOR', lat: 17.400, lon: 78.470, altFt: 9000, info: 'Hyderabad VOR' },
        ],
      },
      {
        name: 'WIP1A',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'WIPER 1A Departure to East / Visakhapatnam',
        waypoints: [
          { ident: 'HS404', type: 'Intersection', lat: 17.250, lon: 78.680, altFt: 6000, info: 'East Exit' },
          { ident: 'WIPER', type: 'Intersection', lat: 17.320, lon: 79.100, altFt: 14000, info: 'WIPER Fix' },
        ],
      },
      {
        name: 'BOM4B',
        type: 'SID',
        runways: ['27R', '27L'],
        description: 'BOM 4B Departure to West / Mumbai',
        waypoints: [
          { ident: 'HS402', type: 'Intersection', lat: 17.230, lon: 78.300, altFt: 6000, info: 'West Exit' },
          { ident: 'GOLCA', type: 'Intersection', lat: 17.650, lon: 78.020, altFt: 13000, info: 'GOLCA Fix' },
        ],
      },
      {
        name: 'OPAL1B',
        type: 'SID',
        runways: ['27R', '27L'],
        description: 'OPALE 1B Departure to South / Bengaluru',
        waypoints: [
          { ident: 'HS403', type: 'Intersection', lat: 17.050, lon: 78.350, altFt: 5500, info: 'South-West Climb' },
          { ident: 'OPALE', type: 'Intersection', lat: 16.550, lon: 78.350, altFt: 12000, info: 'OPALE Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DUBI1A',
        type: 'STAR',
        runways: ['09L', '09R'],
        description: 'DUBID 1A Arrival from West / Mumbai to RWY 09',
        waypoints: [
          { ident: 'DUBID', type: 'Intersection', lat: 17.200, lon: 77.850, altFt: 13000, info: 'DUBID Entry' },
          { ident: 'HS502', type: 'Intersection', lat: 17.220, lon: 78.250, altFt: 6000, info: 'Straight-in Base' },
        ],
      },
      {
        name: 'HYD1B',
        type: 'STAR',
        runways: ['27R', '27L'],
        description: 'HYD 1B Standard Terminal Arrival to RWY 27',
        waypoints: [
          { ident: 'HS501', type: 'Intersection', lat: 17.800, lon: 78.420, altFt: 14000, info: 'Arrival Gate' },
          { ident: 'HYD', type: 'VOR', lat: 17.400, lon: 78.470, altFt: 8000, info: 'Overhead VOR' },
        ],
      },
      {
        name: 'GOLC1B',
        type: 'STAR',
        runways: ['27R', '27L'],
        description: 'GOLCA 1B Arrival from South / Bengaluru to RWY 27',
        waypoints: [
          { ident: 'GOLCA', type: 'Intersection', lat: 16.750, lon: 78.420, altFt: 14000, info: 'GOLCA South' },
          { ident: 'HS503', type: 'Intersection', lat: 17.100, lon: 78.430, altFt: 7000, info: 'Base Turn' },
        ],
      },
    ],
  },

  // DELHI (VIDP) - Indira Gandhi Intl
  VIDP: {
    sids: [
      {
        name: 'ALI2A',
        type: 'SID',
        runways: ['09', '10', '11R'],
        description: 'ALIGARH 2A Departure to East / Kolkata',
        waypoints: [
          { ident: 'DP401', type: 'Intersection', lat: 28.520, lon: 77.250, altFt: 5000, info: 'East Turn' },
          { ident: 'ALI', type: 'VOR', lat: 27.880, lon: 78.080, altFt: 15000, info: 'Aligarh VOR' },
        ],
      },
      {
        name: 'BRAVO3A',
        type: 'SID',
        runways: ['09', '10', '11R'],
        description: 'BBD 3A Departure to South / Mumbai / Bengaluru',
        waypoints: [
          { ident: 'DP402', type: 'Intersection', lat: 28.400, lon: 77.050, altFt: 6000, info: 'South Climb' },
          { ident: 'BBD', type: 'VOR', lat: 27.750, lon: 77.050, altFt: 14000, info: 'BBD VOR' },
        ],
      },
      {
        name: 'DOTI1B',
        type: 'SID',
        runways: ['27', '28', '29L', '29R'],
        description: 'DOTIP 1B Departure to North / Amritsar / Jammu',
        waypoints: [
          { ident: 'DP404', type: 'Intersection', lat: 28.750, lon: 77.100, altFt: 7000, info: 'North Climb' },
          { ident: 'DOTIP', type: 'Intersection', lat: 29.250, lon: 77.050, altFt: 15000, info: 'DOTIP Fix' },
        ],
      },
      {
        name: 'GUR4B',
        type: 'SID',
        runways: ['27', '28', '29L', '29R'],
        description: 'GURGAON 4B Departure to West / Jaipur',
        waypoints: [
          { ident: 'DP403', type: 'Intersection', lat: 28.520, lon: 76.900, altFt: 5500, info: 'West Exit' },
          { ident: 'GUR', type: 'VOR', lat: 28.420, lon: 76.650, altFt: 12000, info: 'Gurgaon Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DPI1A',
        type: 'STAR',
        runways: ['09', '10', '11R'],
        description: 'DPN 1A Arrival from West / Gulf / Europe to RWY 09/10/11',
        waypoints: [
          { ident: 'DPN', type: 'VOR', lat: 28.550, lon: 76.450, altFt: 14000, info: 'DPN Entry' },
          { ident: 'DP503', type: 'Intersection', lat: 28.560, lon: 76.850, altFt: 6000, info: 'Final Turn' },
        ],
      },
      {
        name: 'ALI1B',
        type: 'STAR',
        runways: ['27', '28', '29L', '29R'],
        description: 'ALIGARH 1B Arrival from East Corridor to RWY 27/28/29',
        waypoints: [
          { ident: 'ALI', type: 'VOR', lat: 27.880, lon: 78.080, altFt: 16000, info: 'Aligarh Entry' },
          { ident: 'DP501', type: 'Intersection', lat: 28.350, lon: 77.450, altFt: 8000, info: 'Inbound Leg' },
        ],
      },
      {
        name: 'BBD1B',
        type: 'STAR',
        runways: ['27', '28', '29L', '29R'],
        description: 'BBD 1B Arrival from South / Mumbai to RWY 27/28/29',
        waypoints: [
          { ident: 'BBD', type: 'VOR', lat: 27.750, lon: 77.050, altFt: 15000, info: 'BBD Entry' },
          { ident: 'DP502', type: 'Intersection', lat: 28.250, lon: 77.100, altFt: 7500, info: 'Base Intercept' },
        ],
      },
    ],
  },

  // MUMBAI (VABB) - Chhatrapati Shivaji Maharaj Intl
  VABB: {
    sids: [
      {
        name: 'BBB2A',
        type: 'SID',
        runways: ['09'],
        description: 'BBB 2A Departure to North / Delhi via Runway 09',
        waypoints: [
          { ident: 'BB401', type: 'Intersection', lat: 19.180, lon: 72.850, altFt: 5000, info: 'North Climb' },
          { ident: 'BBB', type: 'VOR', lat: 19.450, lon: 72.820, altFt: 12000, info: 'Bombay VOR' },
        ],
      },
      {
        name: 'DAPO1A',
        type: 'SID',
        runways: ['09'],
        description: 'DAPOL 1A Departure to South / Bengaluru via Runway 09',
        waypoints: [
          { ident: 'BB402', type: 'Intersection', lat: 18.950, lon: 72.900, altFt: 5500, info: 'South Exit' },
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 14000, info: 'DAPOL Fix' },
        ],
      },
      {
        name: 'EXOL1B',
        type: 'SID',
        runways: ['27'],
        description: 'EXOLI 1B Departure over Arabian Sea to Gulf via Runway 27',
        waypoints: [
          { ident: 'BB403', type: 'Intersection', lat: 19.080, lon: 72.650, altFt: 6000, info: 'West Coastal' },
          { ident: 'EXOLI', type: 'Intersection', lat: 19.050, lon: 72.200, altFt: 15000, info: 'EXOLI Ocean Fix' },
        ],
      },
      {
        name: 'DAPO1B',
        type: 'SID',
        runways: ['27'],
        description: 'DAPOL 1B Departure to South via Coastal Turn on Runway 27',
        waypoints: [
          { ident: 'BB404', type: 'Intersection', lat: 18.850, lon: 72.650, altFt: 5000, info: 'South Coast Turn' },
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 14000, info: 'DAPOL Fix' },
        ],
      },
      {
        name: 'DAPO1C',
        type: 'SID',
        runways: ['14', '32'],
        description: 'DAPOL 1C Departure via Cross Runway',
        waypoints: [
          { ident: 'BB405', type: 'Intersection', lat: 18.950, lon: 72.950, altFt: 6000, info: 'Cross Runway Vector' },
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 14000, info: 'DAPOL Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'EXOL1A',
        type: 'STAR',
        runways: ['09'],
        description: 'EXOLI 1A Arrival from Gulf over Ocean to Runway 09',
        waypoints: [
          { ident: 'EXOLI', type: 'Intersection', lat: 19.050, lon: 72.200, altFt: 14000, info: 'EXOLI Entry' },
          { ident: 'BB504', type: 'Intersection', lat: 19.080, lon: 72.700, altFt: 5000, info: 'Straight-in 09' },
        ],
      },
      {
        name: 'DAPO1B',
        type: 'STAR',
        runways: ['27'],
        description: 'DAPOL 1B Arrival from South / Bengaluru / Kochi to Runway 27',
        waypoints: [
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 15000, info: 'DAPOL Entry' },
          { ident: 'BB501', type: 'Intersection', lat: 18.800, lon: 73.020, altFt: 8000, info: 'Downwind Base' },
        ],
      },
      {
        name: 'AKAG1B',
        type: 'STAR',
        runways: ['27'],
        description: 'AKAGA 1B Arrival from East / Hyderabad to Runway 27',
        waypoints: [
          { ident: 'AKAGA', type: 'Intersection', lat: 19.120, lon: 73.650, altFt: 14000, info: 'AKAGA Entry' },
          { ident: 'BB502', type: 'Intersection', lat: 19.100, lon: 73.150, altFt: 7000, info: 'Inbound Leg' },
        ],
      },
    ],
  },

  // CHENNAI (VOMM)
  VOMM: {
    sids: [
      {
        name: 'MMV1A',
        type: 'SID',
        runways: ['07', '12'],
        description: 'MMV 1A Departure via East Corridor to Bay of Bengal',
        waypoints: [
          { ident: 'MA401', type: 'Intersection', lat: 13.020, lon: 80.250, altFt: 4500, info: 'East Turn' },
          { ident: 'MMV', type: 'VOR', lat: 12.990, lon: 80.170, altFt: 9000, info: 'Chennai VOR' },
        ],
      },
      {
        name: 'DOKI1B',
        type: 'SID',
        runways: ['25', '30'],
        description: 'DOKID 1B Departure to West / Bengaluru',
        waypoints: [
          { ident: 'MA402', type: 'Intersection', lat: 12.950, lon: 79.950, altFt: 6000, info: 'West Exit' },
          { ident: 'DOKID', type: 'Intersection', lat: 12.850, lon: 79.350, altFt: 14000, info: 'DOKID Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DOKI1A',
        type: 'STAR',
        runways: ['07', '12'],
        description: 'DOKID 1A Arrival to Runway 07/12',
        waypoints: [
          { ident: 'DOKID', type: 'Intersection', lat: 12.850, lon: 79.350, altFt: 15000, info: 'DOKID Entry' },
          { ident: 'MA501', type: 'Intersection', lat: 12.920, lon: 79.850, altFt: 7500, info: 'Straight-in Base' },
        ],
      },
      {
        name: 'IDAS1B',
        type: 'STAR',
        runways: ['25', '30'],
        description: 'IDASO 1B Arrival from North to Runway 25/30',
        waypoints: [
          { ident: 'IDASO', type: 'Intersection', lat: 13.650, lon: 80.150, altFt: 14000, info: 'IDASO Entry' },
          { ident: 'MA502', type: 'Intersection', lat: 13.250, lon: 80.160, altFt: 6500, info: 'North Entry' },
        ],
      },
    ],
  },

  // SAN FRANCISCO (KSFO)
  KSFO: {
    sids: [
      {
        name: 'SFO9',
        type: 'SID',
        runways: ['28L', '28R', '01L', '01R'],
        description: 'SFO 9 Departure - Climb via Bay Radar Vectors to Oceanic Fixes',
        waypoints: [
          { ident: 'SFO01', type: 'Intersection', lat: 37.640, lon: -122.340, altFt: 3000, info: 'Bay Turn' },
          { ident: 'SFO02', type: 'Intersection', lat: 37.710, lon: -122.280, altFt: 5000, info: 'East Bay Climb' },
        ],
      },
      {
        name: 'GAP7',
        type: 'SID',
        runways: ['28L', '28R'],
        description: 'Golden Gate Seven Departure - Westbound climb past Marin Headlands',
        waypoints: [
          { ident: 'GAP01', type: 'Intersection', lat: 37.680, lon: -122.420, altFt: 4000, info: 'Climb 4,000' },
          { ident: 'SAU', type: 'VOR', lat: 37.856, lon: -122.523, altFt: 9000, info: 'Sausalito VOR' },
        ],
      },
      {
        name: 'OFFSH2',
        type: 'SID',
        runways: ['28L', '28R'],
        description: 'Offshore Two Departure - Southbound Pacific Coast to LAX/SAN',
        waypoints: [
          { ident: 'OFF01', type: 'Intersection', lat: 37.550, lon: -122.480, altFt: 5000, info: 'Coastal Turn' },
          { ident: 'OSI', type: 'VOR', lat: 37.392, lon: -122.281, altFt: 11000, info: 'Woodside VOR' },
        ],
      },
      {
        name: 'TRUKN2',
        type: 'SID',
        runways: ['28L', '28R'],
        description: 'Truckee Two Departure - Eastbound Sierra Nevada to Reno/Salt Lake',
        waypoints: [
          { ident: 'TRK01', type: 'Intersection', lat: 37.720, lon: -122.250, altFt: 6000, info: 'Eastbound Turn' },
          { ident: 'OAK', type: 'VOR', lat: 37.725, lon: -122.223, altFt: 10000, info: 'Oakland VOR' },
        ],
      },
    ],
    stars: [
      {
        name: 'BDEGA3',
        type: 'STAR',
        runways: ['28L', '28R', '19L', '19R'],
        description: 'Bodega Three Arrival from North / Seattle / Portland',
        waypoints: [
          { ident: 'BDEGA', type: 'Intersection', lat: 38.380, lon: -123.000, altFt: 18000, info: 'Bodega Bay Gate' },
          { ident: 'BRIXX', type: 'Intersection', lat: 38.050, lon: -122.800, altFt: 11000, info: 'Descent Fix' },
          { ident: 'ARCHI', type: 'Intersection', lat: 37.780, lon: -122.450, altFt: 6000, info: 'Golden Gate Intercept' },
        ],
      },
      {
        name: 'DYAMD5',
        type: 'STAR',
        runways: ['28L', '28R'],
        description: 'Diamond Five Arrival from South / Los Angeles / Phoenix',
        waypoints: [
          { ident: 'DYAMD', type: 'Intersection', lat: 36.850, lon: -121.750, altFt: 17000, info: 'Diamond Fix' },
          { ident: 'SUR', type: 'VOR', lat: 36.310, lon: -121.880, altFt: 13000, info: 'Big Sur VOR' },
          { ident: 'EDDYY', type: 'Intersection', lat: 37.420, lon: -122.180, altFt: 5000, info: 'Bay Intercept' },
        ],
      },
    ],
  },

  // LOS ANGELES (KLAX)
  KLAX: {
    sids: [
      {
        name: 'ORCKA5',
        type: 'SID',
        runways: ['24L', '24R', '25L', '25R'],
        description: 'Orcka Five Departure - Westbound offshore climb past Catalina',
        waypoints: [
          { ident: 'ORCKA', type: 'Intersection', lat: 33.910, lon: -118.620, altFt: 5000, info: 'Overwater Climb' },
          { ident: 'DOCKR', type: 'Intersection', lat: 33.820, lon: -118.850, altFt: 11000, info: 'Channel Islands Fix' },
        ],
      },
      {
        name: 'DOTSS2',
        type: 'SID',
        runways: ['24L', '24R', '25L', '25R'],
        description: 'Dotss Two Departure - Northbound over Santa Monica to Bay Area',
        waypoints: [
          { ident: 'DOTSS', type: 'Intersection', lat: 34.020, lon: -118.520, altFt: 6000, info: 'Santa Monica Turn' },
          { ident: 'VTU', type: 'VOR', lat: 34.110, lon: -119.050, altFt: 13000, info: 'Ventura VOR' },
        ],
      },
      {
        name: 'SEALZ4',
        type: 'SID',
        runways: ['24L', '24R', '25L', '25R', '06L', '06R', '07L', '07R'],
        description: 'Sealz Four Departure - Southbound to San Diego / Mexico',
        waypoints: [
          { ident: 'SEALZ', type: 'Intersection', lat: 33.720, lon: -118.250, altFt: 6000, info: 'Port of LA Turn' },
          { ident: 'SLI', type: 'VOR', lat: 33.780, lon: -118.050, altFt: 10000, info: 'Seal Beach VOR' },
        ],
      },
    ],
    stars: [
      {
        name: 'ANJLL4',
        type: 'STAR',
        runways: ['24L', '24R', '25L', '25R'],
        description: 'Angel Four Arrival from North / San Francisco / Seattle',
        waypoints: [
          { ident: 'ANJLL', type: 'Intersection', lat: 34.650, lon: -118.950, altFt: 16000, info: 'Gorman Gate' },
          { ident: 'FIM', type: 'VOR', lat: 34.350, lon: -118.880, altFt: 9000, info: 'Fillmore VOR' },
          { ident: 'BAYST', type: 'Intersection', lat: 33.950, lon: -118.300, altFt: 4000, info: 'Santa Monica Base' },
        ],
      },
      {
        name: 'HLYWD1',
        type: 'STAR',
        runways: ['24L', '24R', '25L', '25R'],
        description: 'Hollywood One Arrival from East / Las Vegas / Phoenix',
        waypoints: [
          { ident: 'HLYWD', type: 'Intersection', lat: 34.250, lon: -117.850, altFt: 15000, info: 'San Gabriel Entry' },
          { ident: 'CRCUS', type: 'Intersection', lat: 34.020, lon: -118.150, altFt: 6000, info: 'Downtown LA Turn' },
        ],
      },
    ],
  },

  // LONDON HEATHROW (EGLL)
  EGLL: {
    sids: [
      {
        name: 'BPK7G',
        type: 'SID',
        runways: ['09L', '09R'],
        description: 'Brookmans Park Seven Golf to North via Runway 09',
        waypoints: [
          { ident: 'LON03', type: 'Intersection', lat: 51.620, lon: -0.420, altFt: 5000, info: 'North Climb' },
          { ident: 'BPK', type: 'VOR', lat: 51.720, lon: -0.110, altFt: 10000, info: 'Brookmans Park VOR' },
        ],
      },
      {
        name: 'CPT3G',
        type: 'SID',
        runways: ['27L', '27R'],
        description: 'Compton Three Golf Departure to West via Runway 27',
        waypoints: [
          { ident: 'LON01', type: 'Intersection', lat: 51.480, lon: -0.620, altFt: 4000, info: 'Slough Turn' },
          { ident: 'CPT', type: 'VOR', lat: 51.490, lon: -1.220, altFt: 9000, info: 'Compton VOR' },
        ],
      },
      {
        name: 'DVR4G',
        type: 'SID',
        runways: ['09L', '09R', '27L', '27R'],
        description: 'Dover Four Golf Departure to Southeast / Europe',
        waypoints: [
          { ident: 'LON02', type: 'Intersection', lat: 51.350, lon: -0.350, altFt: 5000, info: 'Surrey Climb' },
          { ident: 'DVR', type: 'VOR', lat: 51.160, lon: 1.350, altFt: 12000, info: 'Dover VOR' },
        ],
      },
    ],
    stars: [
      {
        name: 'LAM3A',
        type: 'STAR',
        runways: ['09L', '09R'],
        description: 'Lambourne Three Alpha Arrival to Runway 09',
        waypoints: [
          { ident: 'LAM', type: 'VOR', lat: 51.640, lon: 0.150, altFt: 11000, info: 'Lambourne Hold' },
          { ident: 'LON04', type: 'Intersection', lat: 51.520, lon: -0.150, altFt: 5000, info: 'Central London Leg' },
        ],
      },
      {
        name: 'BOV3A',
        type: 'STAR',
        runways: ['27L', '27R'],
        description: 'Bovingdon Three Alpha Arrival to Runway 27',
        waypoints: [
          { ident: 'BNN', type: 'VOR', lat: 51.720, lon: -0.540, altFt: 12000, info: 'Bovingdon Hold' },
          { ident: 'LON06', type: 'Intersection', lat: 51.550, lon: -0.520, altFt: 6000, info: 'North Base' },
        ],
      },
    ],
  },

  // DUBAI (OMDB)
  OMDB: {
    sids: [
      {
        name: 'DESDI2D',
        type: 'SID',
        runways: ['12L', '12R'],
        description: 'DESDI 2D Departure to South via Runway 12',
        waypoints: [
          { ident: 'DB401', type: 'Intersection', lat: 25.150, lon: 55.450, altFt: 4000, info: 'Desert Turn' },
          { ident: 'DESDI', type: 'Intersection', lat: 24.750, lon: 55.650, altFt: 12000, info: 'DESDI Fix' },
        ],
      },
      {
        name: 'KABAN2D',
        type: 'SID',
        runways: ['12L', '12R'],
        description: 'KABAN 2D Departure over Arabian Gulf via Runway 12',
        waypoints: [
          { ident: 'DB402', type: 'Intersection', lat: 25.380, lon: 55.250, altFt: 5000, info: 'Coastal Climb' },
          { ident: 'KABAN', type: 'Intersection', lat: 25.850, lon: 54.950, altFt: 14000, info: 'KABAN Fix' },
        ],
      },
      {
        name: 'SENAP2D',
        type: 'SID',
        runways: ['30L', '30R'],
        description: 'SENAP 2D Departure via Runway 30',
        waypoints: [
          { ident: 'DB403', type: 'Intersection', lat: 25.350, lon: 55.300, altFt: 5000, info: 'West Exit' },
          { ident: 'SENAP', type: 'Intersection', lat: 25.550, lon: 54.850, altFt: 13000, info: 'SENAP Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DESDI2A',
        type: 'STAR',
        runways: ['12L', '12R'],
        description: 'DESDI 2A Arrival to Runway 12',
        waypoints: [
          { ident: 'DESDI', type: 'Intersection', lat: 24.750, lon: 55.650, altFt: 15000, info: 'DESDI Entry' },
          { ident: 'DB501', type: 'Intersection', lat: 25.100, lon: 55.500, altFt: 7000, info: 'Downwind Base' },
        ],
      },
      {
        name: 'DARAX2A',
        type: 'STAR',
        runways: ['30L', '30R'],
        description: 'DARAX 2A Arrival to Runway 30',
        waypoints: [
          { ident: 'DARAX', type: 'Intersection', lat: 25.050, lon: 55.850, altFt: 14000, info: 'DARAX Entry' },
          { ident: 'DB503', type: 'Intersection', lat: 25.150, lon: 55.550, altFt: 6000, info: 'Base Turn 30' },
        ],
      },
    ],
  },
};

/**
 * Procedurally generates authentic runway-specific SIDs radiating outward from each runway
 */
function generateProceduralSids(airport: Airport): ProcedureOption[] {
  const directions = [
    { code: 'N', bearing: 0, name: 'North Departure' },
    { code: 'E', bearing: 90, name: 'East Departure' },
    { code: 'S', bearing: 180, name: 'South Departure' },
    { code: 'W', bearing: 270, name: 'West Departure' },
    { code: 'NE', bearing: 45, name: 'Northeast Departure' },
    { code: 'NW', bearing: 315, name: 'Northwest Departure' },
    { code: 'SE', bearing: 135, name: 'Southeast Departure' },
    { code: 'SW', bearing: 225, name: 'Southwest Departure' },
  ];

  const sids: ProcedureOption[] = [];

  airport.runways.forEach((rwy, rIdx) => {
    // Generate directional SIDs radiating from this runway's heading
    const relativeBearings = [
      rwy.heading,
      (rwy.heading + 40) % 360,
      (rwy.heading + 320) % 360,
      (rwy.heading + 90) % 360,
    ];

    relativeBearings.forEach((brg, bIdx) => {
      const dirMatch = directions.reduce((prev, curr) => {
        const diffPrev = Math.abs(prev.bearing - brg);
        const diffCurr = Math.abs(curr.bearing - brg);
        return diffCurr < diffPrev ? curr : prev;
      });

      const fix1 = projectCoordinates(airport.lat, airport.lon, brg, 10);
      const fix2 = projectCoordinates(airport.lat, airport.lon, brg, 24);
      const sidName = `${rwy.ident.replace(/[^0-9]/g, '')}${dirMatch.code}${bIdx + 1}`;

      sids.push({
        name: sidName,
        type: 'SID',
        runway: rwy.ident,
        description: `${dirMatch.name} from Runway ${rwy.ident} via ${brg}° Radial`,
        waypoints: [
          {
            ident: `${rwy.ident}D${bIdx + 1}`,
            type: 'Intersection',
            lat: fix1.lat,
            lon: fix1.lon,
            altFt: airport.elevation + 3500,
            info: `Initial Climb Vector ${brg}°`,
          },
          {
            ident: `${dirMatch.code}EX${rIdx + 1}`,
            type: 'Intersection',
            lat: fix2.lat,
            lon: fix2.lon,
            altFt: Math.min(airport.elevation + 11000, 16000),
            info: `${dirMatch.code} Exit Gate`,
          },
        ],
      });
    });
  });

  return sids;
}

/**
 * Procedurally generates authentic runway-specific STARs converging into each runway
 */
function generateProceduralStars(airport: Airport): ProcedureOption[] {
  const directions = [
    { code: 'N', bearing: 0, name: 'North Arrival' },
    { code: 'E', bearing: 90, name: 'East Arrival' },
    { code: 'S', bearing: 180, name: 'South Arrival' },
    { code: 'W', bearing: 270, name: 'West Arrival' },
    { code: 'NE', bearing: 45, name: 'Northeast Arrival' },
    { code: 'NW', bearing: 315, name: 'Northwest Arrival' },
    { code: 'SE', bearing: 135, name: 'Southeast Arrival' },
    { code: 'SW', bearing: 225, name: 'Southwest Arrival' },
  ];

  const stars: ProcedureOption[] = [];

  airport.runways.forEach((rwy, rIdx) => {
    // Arrival enters from opposite direction towards the runway touchdown zone
    const backCourse = (rwy.heading + 180) % 360;
    const entryBearings = [
      backCourse,
      (backCourse + 40) % 360,
      (backCourse + 320) % 360,
      (backCourse + 90) % 360,
    ];

    entryBearings.forEach((brg, bIdx) => {
      const dirMatch = directions.reduce((prev, curr) => {
        const diffPrev = Math.abs(prev.bearing - brg);
        const diffCurr = Math.abs(curr.bearing - brg);
        return diffCurr < diffPrev ? curr : prev;
      });

      const entryFix = projectCoordinates(airport.lat, airport.lon, brg, 30);
      const baseFix = projectCoordinates(airport.lat, airport.lon, (brg + 15) % 360, 14);
      const starName = `${dirMatch.code}${rwy.ident.replace(/[^0-9]/g, '')}${String.fromCharCode(65 + bIdx)}`;

      stars.push({
        name: starName,
        type: 'STAR',
        runway: rwy.ident,
        description: `${dirMatch.name} to Runway ${rwy.ident} via ${brg}° Inbound`,
        waypoints: [
          {
            ident: `${dirMatch.code}IN${rIdx + 1}`,
            type: 'Intersection',
            lat: entryFix.lat,
            lon: entryFix.lon,
            altFt: 15000,
            info: `${dirMatch.code} Transition Gateway`,
          },
          {
            ident: `${rwy.ident}A${bIdx + 1}`,
            type: 'Intersection',
            lat: baseFix.lat,
            lon: baseFix.lon,
            altFt: Math.max(airport.elevation + 4500, 6000),
            info: `Downwind / Base to Runway ${rwy.ident}`,
          },
        ],
      });
    });
  });

  return stars;
}

/**
 * Retrieves all procedures for an airport (SIDs, STARs, and Runway Approaches).
 * Procedures are associated with specific runways.
 */
export function getProceduresForAirport(
  airport: Airport,
  _phase: 'origin' | 'dest'
): {
  sids: ProcedureOption[];
  stars: ProcedureOption[];
  approaches: ProcedureOption[];
} {
  // 1. Generate ILS, RNAV, and Visual approaches for ALL runways
  const approaches: ProcedureOption[] = [];
  airport.runways.forEach((rwy) => {
    if (rwy.ils) {
      approaches.push(generateRunwayApproach(airport, rwy, 'ILS'));
    }
    approaches.push(generateRunwayApproach(airport, rwy, 'RNAV'));
  });

  if (approaches.length === 0 && airport.runways.length > 0) {
    approaches.push(generateRunwayApproach(airport, airport.runways[0], 'VISUAL'));
  }

  // 2. Curated procedures
  const curated = AIRPORT_PROCEDURES[airport.icao];
  if (curated) {
    return {
      sids: curated.sids,
      stars: curated.stars,
      approaches,
    };
  }

  // 3. Procedurally generated runway-specific SIDs and STARs
  return {
    sids: generateProceduralSids(airport),
    stars: generateProceduralStars(airport),
    approaches,
  };
}
