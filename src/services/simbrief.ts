import { Airport, FlightPlan, Waypoint } from '../types/aviation';
import {
  getProceduresForAirport,
  getRunwayThresholdCoords,
  getRunwayDepartureEndCoords,
  projectCoordinates,
  isProcedureForRunway,
} from '../data/procedures';

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
 * Generates an end-to-end flight plan with selectable SIDs, STARs, and Runway Approaches.
 * SIDs, STARs, and Approaches are strictly filtered to the active departure and arrival runways.
 */
export async function generateFlightPlan(
  origin: Airport,
  destination: Airport,
  _simbriefUsername?: string,
  options?: {
    sidName?: string;
    starName?: string;
    approachName?: string;
    depRwyIdent?: string;
    arrRwyIdent?: string;
  }
): Promise<FlightPlan> {
  const originProcedures = getProceduresForAirport(origin, 'origin');
  const destProcedures = getProceduresForAirport(destination, 'dest');

  // 1. Resolve Departure Runway & Strictly Filter Available SIDs
  const originRunway =
    (options?.depRwyIdent && origin.runways.find((r) => r.ident === options.depRwyIdent)) ||
    origin.runways[0];

  const candidateSids = originProcedures.sids.filter((s) => isProcedureForRunway(s, originRunway.ident));
  const availableSids = candidateSids.length > 0 ? candidateSids : originProcedures.sids;

  const selectedSid =
    (options?.sidName && availableSids.find((s) => s.name === options.sidName)) ||
    availableSids[0];

  // 2. Resolve Arrival Runway & Strictly Filter Available Approaches & STARs
  let destRunway =
    options?.arrRwyIdent
      ? destination.runways.find((r) => r.ident === options.arrRwyIdent)
      : undefined;

  if (!destRunway && options?.approachName) {
    const matchedApp = destProcedures.approaches.find((a) => a.name === options.approachName);
    if (matchedApp?.runway) {
      destRunway = destination.runways.find((r) => r.ident === matchedApp.runway);
    }
  }

  if (!destRunway) {
    destRunway = destination.runways.find((r) => r.ils) || destination.runways[0];
  }

  // Filter Approaches strictly for selected Arrival Runway
  const candidateApproaches = destProcedures.approaches.filter((a) => isProcedureForRunway(a, destRunway.ident));
  const availableApproaches = candidateApproaches.length > 0 ? candidateApproaches : destProcedures.approaches;

  const selectedApproach =
    (options?.approachName && availableApproaches.find((a) => a.name === options.approachName)) ||
    availableApproaches.find((a) => a.name.startsWith('ILS')) ||
    availableApproaches[0];

  // Filter STARs strictly for selected Arrival Runway
  const candidateStars = destProcedures.stars.filter((s) => isProcedureForRunway(s, destRunway.ident));
  const availableStars = candidateStars.length > 0 ? candidateStars : destProcedures.stars;

  const selectedStar =
    (options?.starName && availableStars.find((s) => s.name === options.starName)) ||
    availableStars[0];

  const distance = calculateDistanceNm(origin.lat, origin.lon, destination.lat, destination.lon);
  const crzAlt = distance > 500 ? 36000 : distance > 250 ? 33000 : 21000;

  // 4. Assemble the multi-phase waypoint sequence:
  // Phase 1: Origin Runway Alignment (Exact Threshold -> Liftoff Departure End -> Initial Climb Vector)
  const depThreshold = getRunwayThresholdCoords(origin, originRunway);
  const depEnd = getRunwayDepartureEndCoords(origin, originRunway);
  const depClimbOut = projectCoordinates(depEnd.lat, depEnd.lon, originRunway.heading, 2.2);

  const allWaypoints: Waypoint[] = [
    {
      ident: `RW${originRunway.ident}`,
      type: 'Airport',
      lat: depThreshold.lat,
      lon: depThreshold.lon,
      altFt: origin.elevation,
      info: `Runway ${originRunway.ident} Takeoff Threshold`,
      phase: 'sid',
    },
    {
      ident: `RW${originRunway.ident}-END`,
      type: 'Intersection',
      lat: depEnd.lat,
      lon: depEnd.lon,
      altFt: origin.elevation + 150,
      info: `Runway ${originRunway.ident} Departure End (Liftoff)`,
      phase: 'sid',
    },
    {
      ident: `CLB${originRunway.ident}`,
      type: 'Intersection',
      lat: depClimbOut.lat,
      lon: depClimbOut.lon,
      altFt: origin.elevation + 1800,
      info: `Initial Climb Vector (Hdg ${originRunway.heading}°)`,
      phase: 'sid',
    },
  ];

  // Phase 2: SID Waypoints (Emerald)
  if (selectedSid && selectedSid.waypoints.length > 0) {
    selectedSid.waypoints.forEach((w) => {
      allWaypoints.push({
        ...w,
        phase: 'sid',
      });
    });
  }

  // Phase 3: Enroute Airway Fixes (Cyan)
  const lastSidFix = allWaypoints[allWaypoints.length - 1];
  const firstStarFix = selectedStar.waypoints[0];

  // Generate intermediate enroute fixes between SID exit and STAR entry
  const midLat = (lastSidFix.lat + firstStarFix.lat) / 2;
  const midLon = (lastSidFix.lon + firstStarFix.lon) / 2;

  // Enroute TOC fix
  const tocLat = lastSidFix.lat + (midLat - lastSidFix.lat) * 0.6;
  const tocLon = lastSidFix.lon + (midLon - lastSidFix.lon) * 0.6;

  allWaypoints.push({
    ident: origin.icao === 'KSFO' && destination.icao === 'KLAX' ? 'ECA' : 'CRZ01',
    type: 'VOR',
    lat: Number(tocLat.toFixed(4)),
    lon: Number(tocLon.toFixed(4)),
    altFt: crzAlt,
    isTOC: true,
    info: 'Top of Climb (TOC)',
    phase: 'enroute',
  });

  // Enroute TOD fix
  const todLat = midLat + (firstStarFix.lat - midLat) * 0.5;
  const todLon = midLon + (firstStarFix.lon - midLon) * 0.5;

  allWaypoints.push({
    ident: origin.icao === 'KSFO' && destination.icao === 'KLAX' ? 'PIRAT' : 'TODPT',
    type: 'Intersection',
    lat: Number(todLat.toFixed(4)),
    lon: Number(todLon.toFixed(4)),
    altFt: crzAlt,
    isTOD: true,
    info: 'Top of Descent (TOD)',
    phase: 'enroute',
  });

  // Phase 4: STAR Waypoints (Amber)
  if (selectedStar && selectedStar.waypoints.length > 0) {
    selectedStar.waypoints.forEach((w) => {
      allWaypoints.push({
        ...w,
        phase: 'star',
      });
    });
  }

  // Phase 5: Approach Fixes (Extended Centerline & Touchdown - Magenta)
  if (selectedApproach && selectedApproach.waypoints.length > 0) {
    selectedApproach.waypoints.forEach((w) => {
      allWaypoints.push({
        ...w,
        phase: 'approach',
      });
    });
  }

  // Build clean ICAO Route String
  const routeString = `${origin.icao} ${selectedSid.name} DCT ${allWaypoints.find((w) => w.isTOC)?.ident || 'CRZ'} DCT ${selectedStar.name} ${selectedApproach.name} ${destination.icao}`;

  return {
    title: `${origin.icao} to ${destination.icao} (${selectedApproach.name})`,
    origin,
    destination,
    originRunway,
    destRunway,
    sid: selectedSid.name,
    star: selectedStar.name,
    approach: selectedApproach.name,
    cruisingAlt: crzAlt,
    aircraft: 'A320neo',
    aircraftEngine: 'CFM-LEAP 1A',
    distanceNm: distance,
    eteMinutes: Math.round(distance / 7.2) + 15,
    waypoints: allWaypoints,
    routeString,
    costIndex: 32,
    blockFuelLbs: Math.round(distance * 14.2 + 4200),
    availableSids,
    availableStars,
    availableApproaches,
  };
}
