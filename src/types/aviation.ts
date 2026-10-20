export interface RunwayILS {
  freq: string;
  ident: string;
  course: number;
  gsAngle: number;
}

export interface Runway {
  ident: string;
  heading: number;
  lengthFt: number;
  lengthM: number;
  widthFt: number;
  surface: string;
  ils?: RunwayILS;
}

export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevation: number;
  size: 'large' | 'medium' | 'small';
  runways: Runway[];
}

export interface Waypoint {
  ident: string;
  type: 'Airport' | 'VOR' | 'NDB' | 'Intersection';
  lat: number;
  lon: number;
  altFt: number;
  airway?: string;
  info?: string;
  isTOC?: boolean;
  isTOD?: boolean;
}

export interface FlightPlan {
  title: string;
  origin: Airport;
  destination: Airport;
  originRunway: Runway;
  destRunway: Runway;
  sid: string;
  star: string;
  approach: string;
  cruisingAlt: number;
  aircraft: string;
  aircraftEngine: string;
  distanceNm: number;
  eteMinutes: number;
  waypoints: Waypoint[];
  routeString: string;
  costIndex: number;
  blockFuelLbs: number;
}

export interface AviationJargon {
  term: string;
  title: string;
  explanation: string;
  simTip: string;
}
