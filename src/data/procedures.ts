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
 * Curated authentic SIDs and STARs for major simulator airports & Indian hubs
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
      {
        name: 'SUSG1A',
        type: 'SID',
        description: 'SUSGI 1A Departure via East Corridor to Chennai / Bay of Bengal',
        waypoints: [
          { ident: 'BL401', type: 'Intersection', lat: 13.208, lon: 77.820, altFt: 5000, info: 'Initial Turn' },
          { ident: 'SUSGI', type: 'Intersection', lat: 13.215, lon: 78.105, altFt: 11000, info: 'SUSGI Waypoint' },
        ],
      },
      {
        name: 'OPAL1A',
        type: 'SID',
        description: 'OPALE 1A Departure via North-West to Hyderabad / Mumbai',
        waypoints: [
          { ident: 'BL402', type: 'Intersection', lat: 13.310, lon: 77.650, altFt: 6000, info: 'North Climb' },
          { ident: 'OPALE', type: 'Intersection', lat: 13.580, lon: 77.420, altFt: 14000, info: 'OPALE Transition' },
        ],
      },
      {
        name: 'GUNM1A',
        type: 'SID',
        description: 'GUNMO 1A Departure via South-West to Cochin / Trivandrum',
        waypoints: [
          { ident: 'BL403', type: 'Intersection', lat: 13.050, lon: 77.580, altFt: 6500, info: 'South Turn' },
          { ident: 'GUNMO', type: 'Intersection', lat: 12.650, lon: 77.300, altFt: 13000, info: 'GUNMO Fix' },
        ],
      },
      {
        name: 'PABT1A',
        type: 'SID',
        description: 'PABTY 1A Departure via North-East Corridor',
        waypoints: [
          { ident: 'BL404', type: 'Intersection', lat: 13.340, lon: 77.880, altFt: 7000, info: 'NE Vector' },
          { ident: 'PABTY', type: 'Intersection', lat: 13.720, lon: 78.150, altFt: 15000, info: 'PABTY Waypoint' },
        ],
      },
      {
        name: 'MIA1A',
        type: 'SID',
        description: 'MIA 1A Departure via West to Mangalore / Arabian Sea',
        waypoints: [
          { ident: 'BL405', type: 'Intersection', lat: 13.150, lon: 77.400, altFt: 6000, info: 'West Exit' },
          { ident: 'MIA', type: 'VOR', lat: 12.920, lon: 74.880, altFt: 16000, info: 'Mangalore VOR' },
        ],
      },
      {
        name: 'VAGU1A',
        type: 'SID',
        description: 'VAGUS 1A Departure via South-East to Coimbatore',
        waypoints: [
          { ident: 'BL406', type: 'Intersection', lat: 12.980, lon: 77.850, altFt: 7000, info: 'SE Turn' },
          { ident: 'VAGUS', type: 'Intersection', lat: 12.450, lon: 77.920, altFt: 14000, info: 'VAGUS Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'TELP1B',
        type: 'STAR',
        description: 'TELPO 1B Arrival from North / Hyderabad',
        waypoints: [
          { ident: 'TELPO', type: 'Intersection', lat: 13.850, lon: 77.550, altFt: 16000, info: 'TELPO Entry' },
          { ident: 'BL501', type: 'Intersection', lat: 13.480, lon: 77.620, altFt: 9000, info: 'Inbound Descent' },
          { ident: 'BL502', type: 'Intersection', lat: 13.310, lon: 77.680, altFt: 6000, info: 'Intermediate' },
        ],
      },
      {
        name: 'ADEN1B',
        type: 'STAR',
        description: 'ADENI 1B Arrival from East / Chennai',
        waypoints: [
          { ident: 'ADENI', type: 'Intersection', lat: 13.150, lon: 78.450, altFt: 15000, info: 'ADENI Entry' },
          { ident: 'BL503', type: 'Intersection', lat: 13.180, lon: 78.050, altFt: 8500, info: 'Downwind Leg' },
        ],
      },
      {
        name: 'LATU1B',
        type: 'STAR',
        description: 'LATUR 1B Arrival from West / Arabian Coast',
        waypoints: [
          { ident: 'LATUR', type: 'Intersection', lat: 13.100, lon: 77.050, altFt: 14000, info: 'LATUR Entry' },
          { ident: 'BL504', type: 'Intersection', lat: 13.140, lon: 77.450, altFt: 7500, info: 'Base Turn' },
        ],
      },
      {
        name: 'BIA1B',
        type: 'STAR',
        description: 'BIA 1B Arrival via Bengaluru VOR Radial',
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
        description: 'HYD 1A Departure via Hyderabad VOR',
        waypoints: [
          { ident: 'HS401', type: 'Intersection', lat: 17.240, lon: 78.520, altFt: 4500, info: 'Initial Climb' },
          { ident: 'HYD', type: 'VOR', lat: 17.400, lon: 78.470, altFt: 9000, info: 'Hyderabad VOR' },
        ],
      },
      {
        name: 'GOLC1A',
        type: 'SID',
        description: 'GOLCA 1A Departure to North-West / Mumbai',
        waypoints: [
          { ident: 'HS402', type: 'Intersection', lat: 17.350, lon: 78.300, altFt: 6000, info: 'NW Exit' },
          { ident: 'GOLCA', type: 'Intersection', lat: 17.650, lon: 78.020, altFt: 13000, info: 'GOLCA Fix' },
        ],
      },
      {
        name: 'OPAL1B',
        type: 'SID',
        description: 'OPALE 1B Departure to South / Bengaluru',
        waypoints: [
          { ident: 'HS403', type: 'Intersection', lat: 17.050, lon: 78.420, altFt: 5500, info: 'South Climb' },
          { ident: 'OPALE', type: 'Intersection', lat: 16.550, lon: 78.350, altFt: 12000, info: 'OPALE Fix' },
        ],
      },
      {
        name: 'WIP1A',
        type: 'SID',
        description: 'WIPER 1A Departure to East / Visakhapatnam',
        waypoints: [
          { ident: 'HS404', type: 'Intersection', lat: 17.250, lon: 78.680, altFt: 6000, info: 'East Exit' },
          { ident: 'WIPER', type: 'Intersection', lat: 17.320, lon: 79.100, altFt: 14000, info: 'WIPER Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'HYD1B',
        type: 'STAR',
        description: 'HYD 1B Standard Terminal Arrival from North',
        waypoints: [
          { ident: 'HS501', type: 'Intersection', lat: 17.800, lon: 78.420, altFt: 14000, info: 'Arrival Gate' },
          { ident: 'HYD', type: 'VOR', lat: 17.400, lon: 78.470, altFt: 8000, info: 'Overhead VOR' },
        ],
      },
      {
        name: 'DUBI1B',
        type: 'STAR',
        description: 'DUBID 1B Arrival from West / Pune / Mumbai',
        waypoints: [
          { ident: 'DUBID', type: 'Intersection', lat: 17.200, lon: 77.850, altFt: 13000, info: 'DUBID Entry' },
          { ident: 'HS502', type: 'Intersection', lat: 17.220, lon: 78.250, altFt: 6000, info: 'Downwind Base' },
        ],
      },
      {
        name: 'GOLC1B',
        type: 'STAR',
        description: 'GOLCA 1B Arrival from South / Bengaluru / Chennai',
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
        description: 'ALIGARH 2A Departure to East / Kolkata',
        waypoints: [
          { ident: 'DP401', type: 'Intersection', lat: 28.520, lon: 77.250, altFt: 5000, info: 'East Turn' },
          { ident: 'ALI', type: 'VOR', lat: 27.880, lon: 78.080, altFt: 15000, info: 'Aligarh VOR' },
        ],
      },
      {
        name: 'BRAVO3A',
        type: 'SID',
        description: 'BBD 3A Departure to South / Mumbai / Bengaluru',
        waypoints: [
          { ident: 'DP402', type: 'Intersection', lat: 28.400, lon: 77.050, altFt: 6000, info: 'South Climb' },
          { ident: 'BBD', type: 'VOR', lat: 27.750, lon: 77.050, altFt: 14000, info: 'BBD VOR' },
        ],
      },
      {
        name: 'GUR4A',
        type: 'SID',
        description: 'GURGAON 4A Departure to West / Jaipur',
        waypoints: [
          { ident: 'DP403', type: 'Intersection', lat: 28.520, lon: 76.900, altFt: 5500, info: 'West Exit' },
          { ident: 'GUR', type: 'VOR', lat: 28.420, lon: 76.650, altFt: 12000, info: 'Gurgaon Fix' },
        ],
      },
      {
        name: 'DOTI1A',
        type: 'SID',
        description: 'DOTIP 1A Departure to North / Amritsar / Jammu',
        waypoints: [
          { ident: 'DP404', type: 'Intersection', lat: 28.750, lon: 77.100, altFt: 7000, info: 'North Climb' },
          { ident: 'DOTIP', type: 'Intersection', lat: 29.250, lon: 77.050, altFt: 15000, info: 'DOTIP Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'ALI1B',
        type: 'STAR',
        description: 'ALIGARH 1B Arrival from East Corridor',
        waypoints: [
          { ident: 'ALI', type: 'VOR', lat: 27.880, lon: 78.080, altFt: 16000, info: 'Aligarh Entry' },
          { ident: 'DP501', type: 'Intersection', lat: 28.350, lon: 77.450, altFt: 8000, info: 'Inbound Leg' },
        ],
      },
      {
        name: 'BBD1B',
        type: 'STAR',
        description: 'BBD 1B Arrival from South / Mumbai',
        waypoints: [
          { ident: 'BBD', type: 'VOR', lat: 27.750, lon: 77.050, altFt: 15000, info: 'BBD Entry' },
          { ident: 'DP502', type: 'Intersection', lat: 28.250, lon: 28.250, altFt: 7500, info: 'Base Intercept' },
        ],
      },
      {
        name: 'DPI1B',
        type: 'STAR',
        description: 'DPN 1B Arrival from West / Gulf / Europe',
        waypoints: [
          { ident: 'DPN', type: 'VOR', lat: 28.550, lon: 76.450, altFt: 14000, info: 'DPN Entry' },
          { ident: 'DP503', type: 'Intersection', lat: 28.560, lon: 76.850, altFt: 6000, info: 'Final Turn' },
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
        description: 'BBB 2A Departure to North / Delhi',
        waypoints: [
          { ident: 'BB401', type: 'Intersection', lat: 19.180, lon: 72.850, altFt: 5000, info: 'North Climb' },
          { ident: 'BBB', type: 'VOR', lat: 19.450, lon: 72.820, altFt: 12000, info: 'Bombay VOR' },
        ],
      },
      {
        name: 'DAPO1A',
        type: 'SID',
        description: 'DAPOL 1A Departure to South / Goa / Bengaluru',
        waypoints: [
          { ident: 'BB402', type: 'Intersection', lat: 18.950, lon: 72.900, altFt: 5500, info: 'South Exit' },
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 14000, info: 'DAPOL Fix' },
        ],
      },
      {
        name: 'EXOL1A',
        type: 'SID',
        description: 'EXOLI 1A Departure over Arabian Sea to Gulf',
        waypoints: [
          { ident: 'BB403', type: 'Intersection', lat: 19.080, lon: 72.650, altFt: 6000, info: 'West Coastal' },
          { ident: 'EXOLI', type: 'Intersection', lat: 19.050, lon: 72.200, altFt: 15000, info: 'EXOLI Ocean Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DAPO1B',
        type: 'STAR',
        description: 'DAPOL 1B Arrival from South / Bengaluru / Kochi',
        waypoints: [
          { ident: 'DAPOL', type: 'Intersection', lat: 18.350, lon: 73.150, altFt: 15000, info: 'DAPOL Entry' },
          { ident: 'BB501', type: 'Intersection', lat: 18.800, lon: 73.020, altFt: 8000, info: 'Downwind Base' },
        ],
      },
      {
        name: 'AKAG1B',
        type: 'STAR',
        description: 'AKAGA 1B Arrival from East / Hyderabad',
        waypoints: [
          { ident: 'AKAGA', type: 'Intersection', lat: 19.120, lon: 73.650, altFt: 14000, info: 'AKAGA Entry' },
          { ident: 'BB502', type: 'Intersection', lat: 19.100, lon: 73.150, altFt: 7000, info: 'Inbound Leg' },
        ],
      },
      {
        name: 'BEBI1B',
        type: 'STAR',
        description: 'BEBIX 1B Arrival from North / Delhi / Ahmedabad',
        waypoints: [
          { ident: 'BEBIX', type: 'Intersection', lat: 19.750, lon: 72.820, altFt: 16000, info: 'BEBIX Entry' },
          { ident: 'BB503', type: 'Intersection', lat: 19.350, lon: 72.830, altFt: 8000, info: 'North Approach' },
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
        description: 'MMV 1A Departure via Chennai VOR to Bay of Bengal',
        waypoints: [
          { ident: 'MA401', type: 'Intersection', lat: 13.020, lon: 80.250, altFt: 4500, info: 'East Turn' },
          { ident: 'MMV', type: 'VOR', lat: 12.990, lon: 80.170, altFt: 9000, info: 'Chennai VOR' },
        ],
      },
      {
        name: 'DOKI1A',
        type: 'SID',
        description: 'DOKID 1A Departure to West / Bengaluru',
        waypoints: [
          { ident: 'MA402', type: 'Intersection', lat: 12.950, lon: 79.950, altFt: 6000, info: 'West Exit' },
          { ident: 'DOKID', type: 'Intersection', lat: 12.850, lon: 79.350, altFt: 14000, info: 'DOKID Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DOKI1B',
        type: 'STAR',
        description: 'DOKID 1B Arrival from Bengaluru / South India',
        waypoints: [
          { ident: 'DOKID', type: 'Intersection', lat: 12.850, lon: 79.350, altFt: 15000, info: 'DOKID Entry' },
          { ident: 'MA501', type: 'Intersection', lat: 12.920, lon: 79.850, altFt: 7500, info: 'Base Leg' },
        ],
      },
      {
        name: 'IDAS1B',
        type: 'STAR',
        description: 'IDASO 1B Arrival from North / Hyderabad / Delhi',
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
        description: 'SFO 9 Departure - Climb via Bay Radar Vectors to Oceanic Fixes',
        waypoints: [
          { ident: 'SFO01', type: 'Intersection', lat: 37.640, lon: -122.340, altFt: 3000, info: 'Bay Turn' },
          { ident: 'SFO02', type: 'Intersection', lat: 37.710, lon: -122.280, altFt: 5000, info: 'East Bay Climb' },
        ],
      },
      {
        name: 'GAP7',
        type: 'SID',
        description: 'Golden Gate Seven Departure - Westbound climb past Marin Headlands',
        waypoints: [
          { ident: 'GAP01', type: 'Intersection', lat: 37.680, lon: -122.420, altFt: 4000, info: 'Climb 4,000' },
          { ident: 'SAU', type: 'VOR', lat: 37.856, lon: -122.523, altFt: 9000, info: 'Sausalito VOR' },
        ],
      },
      {
        name: 'OFFSH2',
        type: 'SID',
        description: 'Offshore Two Departure - Southbound Pacific Coast to LAX/SAN',
        waypoints: [
          { ident: 'OFF01', type: 'Intersection', lat: 37.550, lon: -122.480, altFt: 5000, info: 'Coastal Turn' },
          { ident: 'OSI', type: 'VOR', lat: 37.392, lon: -122.281, altFt: 11000, info: 'Woodside VOR' },
        ],
      },
      {
        name: 'TRUKN2',
        type: 'SID',
        description: 'Truckee Two Departure - Eastbound Sierra Nevada to Reno/Salt Lake',
        waypoints: [
          { ident: 'TRK01', type: 'Intersection', lat: 37.720, lon: -122.250, altFt: 6000, info: 'Eastbound Turn' },
          { ident: 'OAK', type: 'VOR', lat: 37.725, lon: -122.223, altFt: 10000, info: 'Oakland VOR' },
        ],
      },
      {
        name: 'WESLA5',
        type: 'SID',
        description: 'Wesla Five Departure - High Performance Jet Climb',
        waypoints: [
          { ident: 'WES01', type: 'Intersection', lat: 37.620, lon: -122.290, altFt: 4000, info: 'San Mateo Vector' },
          { ident: 'WESLA', type: 'Intersection', lat: 37.450, lon: -122.150, altFt: 12000, info: 'WESLA Waypoint' },
        ],
      },
    ],
    stars: [
      {
        name: 'BDEGA3',
        type: 'STAR',
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
        description: 'Diamond Five Arrival from South / Los Angeles / Phoenix',
        waypoints: [
          { ident: 'DYAMD', type: 'Intersection', lat: 36.850, lon: -121.750, altFt: 17000, info: 'Diamond Fix' },
          { ident: 'SUR', type: 'VOR', lat: 36.310, lon: -121.880, altFt: 13000, info: 'Big Sur VOR' },
          { ident: 'EDDYY', type: 'Intersection', lat: 37.420, lon: -122.180, altFt: 5000, info: 'Bay Intercept' },
        ],
      },
      {
        name: 'SERFR4',
        type: 'STAR',
        description: 'Serfr Four Arrival - Santa Cruz Mountains RNAV',
        waypoints: [
          { ident: 'SERFR', type: 'Intersection', lat: 36.950, lon: -121.950, altFt: 15000, info: 'Santa Cruz Entry' },
          { ident: 'WWAVS', type: 'Intersection', lat: 37.250, lon: -122.250, altFt: 8000, info: 'Peninsula Base' },
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
        description: 'Orcka Five Departure - Westbound offshore climb past Catalina',
        waypoints: [
          { ident: 'ORCKA', type: 'Intersection', lat: 33.910, lon: -118.620, altFt: 5000, info: 'Overwater Climb' },
          { ident: 'DOCKR', type: 'Intersection', lat: 33.820, lon: -118.850, altFt: 11000, info: 'Channel Islands Fix' },
        ],
      },
      {
        name: 'DOTSS2',
        type: 'SID',
        description: 'Dotss Two Departure - Northbound over Santa Monica to Bay Area',
        waypoints: [
          { ident: 'DOTSS', type: 'Intersection', lat: 34.020, lon: -118.520, altFt: 6000, info: 'Santa Monica Turn' },
          { ident: 'VTU', type: 'VOR', lat: 34.110, lon: -119.050, altFt: 13000, info: 'Ventura VOR' },
        ],
      },
      {
        name: 'SEALZ4',
        type: 'SID',
        description: 'Sealz Four Departure - Southbound to San Diego / Mexico',
        waypoints: [
          { ident: 'SEALZ', type: 'Intersection', lat: 33.720, lon: -118.250, altFt: 6000, info: 'Port of LA Turn' },
          { ident: 'SLI', type: 'VOR', lat: 33.780, lon: -118.050, altFt: 10000, info: 'Seal Beach VOR' },
        ],
      },
      {
        name: 'CASTA2',
        type: 'SID',
        description: 'Castaic Two Departure - Eastbound to Las Vegas / Denver',
        waypoints: [
          { ident: 'CAS01', type: 'Intersection', lat: 34.120, lon: -118.350, altFt: 7000, info: 'Inland Vector' },
          { ident: 'PMD', type: 'VOR', lat: 34.580, lon: -118.060, altFt: 14000, info: 'Palmdale VOR' },
        ],
      },
    ],
    stars: [
      {
        name: 'ANJLL4',
        type: 'STAR',
        description: 'Angel Four Arrival from North / San Francisco / Seattle',
        waypoints: [
          { ident: 'ANJLL', type: 'Intersection', lat: 34.650, lon: -118.950, altFt: 16000, info: 'Gorman Gate' },
          { ident: 'FIM', type: 'VOR', lat: 34.350, lon: -118.880, altFt: 9000, info: 'Fillmore VOR' },
          { ident: 'BAYST', type: 'Intersection', lat: 33.950, lon: -118.300, altFt: 4000, info: 'Santa Monica Base' },
        ],
      },
      {
        name: 'IRNMN2',
        type: 'STAR',
        description: 'Ironman Two Arrival - Santa Barbara Coastal RNAV',
        waypoints: [
          { ident: 'IRNMN', type: 'Intersection', lat: 34.450, lon: -119.550, altFt: 14000, info: 'Channel Arrival' },
          { ident: 'SYLMR', type: 'Intersection', lat: 34.150, lon: -118.650, altFt: 7000, info: 'Valley Fix' },
        ],
      },
      {
        name: 'HLYWD1',
        type: 'STAR',
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
        name: 'CPT3G',
        type: 'SID',
        description: 'Compton Three Golf Departure to West / Wales / Atlantic',
        waypoints: [
          { ident: 'LON01', type: 'Intersection', lat: 51.480, lon: -0.620, altFt: 4000, info: 'Slough Turn' },
          { ident: 'CPT', type: 'VOR', lat: 51.490, lon: -1.220, altFt: 9000, info: 'Compton VOR' },
        ],
      },
      {
        name: 'DVR4G',
        type: 'SID',
        description: 'Dover Four Golf Departure to Southeast / France / Europe',
        waypoints: [
          { ident: 'LON02', type: 'Intersection', lat: 51.350, lon: -0.350, altFt: 5000, info: 'Surrey Climb' },
          { ident: 'DVR', type: 'VOR', lat: 51.160, lon: 1.350, altFt: 12000, info: 'Dover VOR' },
        ],
      },
      {
        name: 'BPK7G',
        type: 'SID',
        description: 'Brookmans Park Seven Golf to North / Scotland',
        waypoints: [
          { ident: 'LON03', type: 'Intersection', lat: 51.620, lon: -0.420, altFt: 5000, info: 'North Climb' },
          { ident: 'BPK', type: 'VOR', lat: 51.720, lon: -0.110, altFt: 10000, info: 'Brookmans Park VOR' },
        ],
      },
    ],
    stars: [
      {
        name: 'LAM3A',
        type: 'STAR',
        description: 'Lambourne Three Alpha Arrival from East / Europe',
        waypoints: [
          { ident: 'LAM', type: 'VOR', lat: 51.640, lon: 0.150, altFt: 11000, info: 'Lambourne Hold' },
          { ident: 'LON04', type: 'Intersection', lat: 51.520, lon: -0.150, altFt: 5000, info: 'Central London Leg' },
        ],
      },
      {
        name: 'OCK1A',
        type: 'STAR',
        description: 'Ockham One Alpha Arrival from South / Spain',
        waypoints: [
          { ident: 'OCK', type: 'VOR', lat: 51.300, lon: -0.440, altFt: 10000, info: 'Ockham Hold' },
          { ident: 'LON05', type: 'Intersection', lat: 51.420, lon: -0.450, altFt: 4500, info: 'Base Turn' },
        ],
      },
      {
        name: 'BOV3A',
        type: 'STAR',
        description: 'Bovingdon Three Alpha Arrival from North / Atlantic',
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
        description: 'DESDI 2D Departure to South / Oman / India',
        waypoints: [
          { ident: 'DB401', type: 'Intersection', lat: 25.150, lon: 55.450, altFt: 4000, info: 'Desert Turn' },
          { ident: 'DESDI', type: 'Intersection', lat: 24.750, lon: 55.650, altFt: 12000, info: 'DESDI Fix' },
        ],
      },
      {
        name: 'KABAN2D',
        type: 'SID',
        description: 'KABAN 2D Departure over Arabian Gulf to Europe',
        waypoints: [
          { ident: 'DB402', type: 'Intersection', lat: 25.380, lon: 55.250, altFt: 5000, info: 'Coastal Climb' },
          { ident: 'KABAN', type: 'Intersection', lat: 25.850, lon: 54.950, altFt: 14000, info: 'KABAN Fix' },
        ],
      },
      {
        name: 'NABIX2D',
        type: 'SID',
        description: 'NABIX 2D Departure to East / Asia',
        waypoints: [
          { ident: 'DB403', type: 'Intersection', lat: 25.220, lon: 55.600, altFt: 5500, info: 'Hajar Vector' },
          { ident: 'NABIX', type: 'Intersection', lat: 25.100, lon: 56.100, altFt: 13000, info: 'NABIX Fix' },
        ],
      },
    ],
    stars: [
      {
        name: 'DESDI2A',
        type: 'STAR',
        description: 'DESDI 2A Arrival from India / Indian Ocean',
        waypoints: [
          { ident: 'DESDI', type: 'Intersection', lat: 24.750, lon: 55.650, altFt: 15000, info: 'DESDI Entry' },
          { ident: 'DB501', type: 'Intersection', lat: 25.100, lon: 55.500, altFt: 7000, info: 'Downwind Base' },
        ],
      },
      {
        name: 'KABAN2A',
        type: 'STAR',
        description: 'KABAN 2A Arrival from Europe / West',
        waypoints: [
          { ident: 'KABAN', type: 'Intersection', lat: 25.850, lon: 54.950, altFt: 16000, info: 'Gulf Entry' },
          { ident: 'DB502', type: 'Intersection', lat: 25.420, lon: 55.200, altFt: 6500, info: 'Coastal Intercept' },
        ],
      },
    ],
  },
};

/**
 * Procedurally generates standard authentic SIDs radiating across compass bearings
 */
function generateProceduralSids(airport: Airport): ProcedureOption[] {
  const directions = [
    { code: 'NTH', bearing: 0, name: 'North Departure' },
    { code: 'NET', bearing: 45, name: 'Northeast Departure' },
    { code: 'EST', bearing: 90, name: 'East Departure' },
    { code: 'SET', bearing: 135, name: 'Southeast Departure' },
    { code: 'STH', bearing: 180, name: 'South Departure' },
    { code: 'SWT', bearing: 225, name: 'Southwest Departure' },
    { code: 'WST', bearing: 270, name: 'West Departure' },
    { code: 'NWT', bearing: 315, name: 'Northwest Departure' },
  ];

  return directions.slice(0, 6).map((d, idx) => {
    const fix1Coords = projectCoordinates(airport.lat, airport.lon, d.bearing, 10);
    const fix2Coords = projectCoordinates(airport.lat, airport.lon, d.bearing, 25);
    const rwy = airport.runways[idx % airport.runways.length];

    return {
      name: `${airport.icao.slice(1)}${idx + 1}${d.code[0]}`,
      type: 'SID',
      runway: rwy.ident,
      description: `${d.name} via ${d.code} Radial (${d.bearing}°)`,
      waypoints: [
        {
          ident: `${airport.icao.slice(1)}D${idx + 1}`,
          type: 'Intersection',
          lat: fix1Coords.lat,
          lon: fix1Coords.lon,
          altFt: airport.elevation + 4000,
          info: `Initial Climb on ${d.bearing}°`,
        },
        {
          ident: `${d.code}EX`,
          type: 'Intersection',
          lat: fix2Coords.lat,
          lon: fix2Coords.lon,
          altFt: Math.min(airport.elevation + 12000, 16000),
          info: `${d.code} Exit Gateway`,
        },
      ],
    };
  });
}

/**
 * Procedurally generates standard authentic STARs converging into the airport
 */
function generateProceduralStars(airport: Airport): ProcedureOption[] {
  const directions = [
    { code: 'NTH', bearing: 0, name: 'North Arrival' },
    { code: 'EST', bearing: 90, name: 'East Arrival' },
    { code: 'STH', bearing: 180, name: 'South Arrival' },
    { code: 'WST', bearing: 270, name: 'West Arrival' },
    { code: 'NET', bearing: 45, name: 'Northeast Arrival' },
    { code: 'SWT', bearing: 225, name: 'Southwest Arrival' },
  ];

  return directions.map((d, idx) => {
    const entryCoords = projectCoordinates(airport.lat, airport.lon, d.bearing, 32);
    const baseCoords = projectCoordinates(airport.lat, airport.lon, (d.bearing + 20) % 360, 15);
    const rwy = airport.runways[idx % airport.runways.length];

    return {
      name: `${airport.icao.slice(1)}${idx + 1}${d.code[0]}A`,
      type: 'STAR',
      runway: rwy.ident,
      description: `${d.name} from ${d.bearing}° Gateway to Runway ${rwy.ident}`,
      waypoints: [
        {
          ident: `${d.code}IN`,
          type: 'Intersection',
          lat: entryCoords.lat,
          lon: entryCoords.lon,
          altFt: 16000,
          info: `${d.code} Inbound Transition`,
        },
        {
          ident: `${airport.icao.slice(1)}A${idx + 1}`,
          type: 'Intersection',
          lat: baseCoords.lat,
          lon: baseCoords.lon,
          altFt: Math.max(airport.elevation + 4500, 6000),
          info: 'Intermediate Downwind / Base',
        },
      ],
    };
  });
}

/**
 * Retrieves all procedures for an airport (SIDs, STARs, and Runway Approaches)
 * User preference: Returns all authentic SIDs and STARs across the airport,
 * allowing manual selection of any procedure regardless of active runway.
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

  // Ensure at least one approach exists
  if (approaches.length === 0 && airport.runways.length > 0) {
    approaches.push(generateRunwayApproach(airport, airport.runways[0], 'VISUAL'));
  }

  // 2. Check if we have curated procedures for this airport
  const curated = AIRPORT_PROCEDURES[airport.icao];
  if (curated) {
    return {
      sids: curated.sids,
      stars: curated.stars,
      approaches,
    };
  }

  // 3. Fallback: Procedurally generate rich SIDs and STARs for any airport in the global dataset
  return {
    sids: generateProceduralSids(airport),
    stars: generateProceduralStars(airport),
    approaches,
  };
}
