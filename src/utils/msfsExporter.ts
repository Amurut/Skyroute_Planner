import { FlightPlan } from '../types/aviation';

/**
 * Converts decimal degrees latitude, longitude and altitude to MSFS LLA DMS string
 * Example: N37° 37' 08.00",W122° 22' 29.00",+000013.00
 */
export function formatMSFSLLA(lat: number, lon: number, altFt: number): string {
  const latHemi = lat >= 0 ? 'N' : 'S';
  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);
  const latSec = ((absLat - latDeg - latMin / 60) * 3600).toFixed(2);

  const lonHemi = lon >= 0 ? 'E' : 'W';
  const absLon = Math.abs(lon);
  const lonDeg = Math.floor(absLon);
  const lonMin = Math.floor((absLon - lonDeg) * 60);
  const lonSec = ((absLon - lonDeg - lonMin / 60) * 3600).toFixed(2);

  const formattedLat = `${latHemi}${String(latDeg).padStart(2, '0')}° ${String(latMin).padStart(2, '0')}' ${String(latSec).padStart(5, '0')}"`;
  const formattedLon = `${lonHemi}${String(lonDeg).padStart(3, '0')}° ${String(lonMin).padStart(2, '0')}' ${String(lonSec).padStart(5, '0')}"`;
  const formattedAlt = `${altFt >= 0 ? '+' : '-'}${String(Math.abs(Math.round(altFt))).padStart(6, '0')}.00`;

  return `${formattedLat},${formattedLon},${formattedAlt}`;
}

/**
 * Extracts runway number and designator (LEFT, RIGHT, CENTER, NONE)
 */
function parseRunwayDesignator(ident: string): { num: string; desig: string } {
  const clean = ident.replace(/[^0-9LCR]/gi, '').toUpperCase();
  const numMatch = clean.match(/^\d+/);
  const num = numMatch ? numMatch[0] : '01';
  let desig = 'NONE';
  if (clean.endsWith('L')) desig = 'LEFT';
  else if (clean.endsWith('R')) desig = 'RIGHT';
  else if (clean.endsWith('C')) desig = 'CENTER';
  return { num, desig };
}

/**
 * Generates an AceXML compliant .pln file string for MSFS 2024 / 2020
 */
export function generateMSFSPln(plan: FlightPlan): string {
  const arrRwy = parseRunwayDesignator(plan.destRunway.ident);

  const waypointsXml = plan.waypoints
    .map(
      (wp) => `        <ATCWaypoint id="${wp.ident}">
            <ATCWaypointType>${wp.type}</ATCWaypointType>
            <WorldPosition>${formatMSFSLLA(wp.lat, wp.lon, wp.altFt)}</WorldPosition>
            <ICAO>
                <ICAOIdent>${wp.ident}</ICAOIdent>
            </ICAO>
        </ATCWaypoint>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<SimBase.Document Type="AceXML" version="1,0">
    <Descr>AceXML Document</Descr>
    <FlightPlan.FlightPlan>
        <Title>${plan.origin.icao} to ${plan.destination.icao} VectorEFB</Title>
        <FPType>IFR</FPType>
        <RouteType>HighAlt</RouteType>
        <CruisingAlt>${plan.cruisingAlt}</CruisingAlt>
        <DepartureID>${plan.origin.icao}</DepartureID>
        <DepartureLLA>${formatMSFSLLA(plan.origin.lat, plan.origin.lon, plan.origin.elevation)}</DepartureLLA>
        <DestinationID>${plan.destination.icao}</DestinationID>
        <DestinationLLA>${formatMSFSLLA(plan.destination.lat, plan.destination.lon, plan.destination.elevation)}</DestinationLLA>
        <DeparturePosition>${plan.originRunway.ident}</DeparturePosition>
        <DepartureName>${plan.origin.name}</DepartureName>
        <DestinationName>${plan.destination.name}</DestinationName>
        <DepartureFP>${plan.sid}</DepartureFP>
        <ArrivalFP>${plan.star}</ArrivalFP>
        <ApproachType>ILS</ApproachType>
        <ApproachNumber>${arrRwy.num}</ApproachNumber>
        <ApproachDesignator>${arrRwy.desig}</ApproachDesignator>
        <ApproachFP>${plan.approach}</ApproachFP>
        <AppVersion>
            <AppVersionMajor>11</AppVersionMajor>
            <AppVersionBuild>282174</AppVersionBuild>
        </AppVersion>
${waypointsXml}
    </FlightPlan.FlightPlan>
</SimBase.Document>`;
}

/**
 * Triggers instant browser download of the .pln file
 */
export function downloadPlnFile(plan: FlightPlan): void {
  const xml = generateMSFSPln(plan);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${plan.origin.icao}_${plan.destination.icao}_MSFS2024.pln`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
