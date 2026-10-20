import { AviationJargon } from '../types/aviation';

export const AVIATION_GLOSSARY: Record<string, AviationJargon> = {
  ICAO: {
    term: 'ICAO',
    title: 'ICAO vs IATA Airport Codes',
    explanation: 'ICAO (4 letters, e.g., KSFO) is used by pilots, air traffic control, and flight planners. IATA (3 letters, e.g., SFO) is the code printed on airline passenger tickets and baggage tags.',
    simTip: 'In MSFS, search for airports using their 4-letter ICAO code.',
  },
  SID: {
    term: 'SID',
    title: 'Standard Instrument Departure',
    explanation: 'Think of a SID as a designated highway on-ramp for airplanes taking off. It keeps departing aircraft safely separated from arriving traffic and tall terrain/mountains.',
    simTip: 'When you load this .pln file into MSFS 2024, your aircraft autopilot will automatically fly this departure path.',
  },
  STAR: {
    term: 'STAR',
    title: 'Standard Terminal Arrival Route',
    explanation: 'The highway off-ramp in the sky. It connects the high-altitude cruising airways down to the specific approach corridor of the destination airport.',
    simTip: 'The STAR guides your jet smoothly from cruising altitude down toward the runway environment.',
  },
  ILS: {
    term: 'ILS',
    title: 'Instrument Landing System',
    explanation: 'A highly accurate ground-based radio beam system. One radio beam (Localizer) aligns your plane with the runway centerline; a second beam (Glideslope) guides your vertical descent angle (typically 3.0°).',
    simTip: 'Tune your NAV1 radio to the frequency shown (e.g. 111.70 MHz) and press the APR (Approach) button on your autopilot to land automatically.',
  },
  TOC: {
    term: 'TOC',
    title: 'Top of Climb',
    explanation: 'The exact point along your route where your airplane reaches its assigned cruising altitude (e.g. FL330 / 33,000 feet) and levels off.',
    simTip: 'At TOC, you throttle back from climb thrust to cruise thrust to save fuel.',
  },
  TOD: {
    term: 'TOD',
    title: 'Top of Descent',
    explanation: 'The calculated point where you must leave your cruising altitude and begin descending toward your destination airport.',
    simTip: 'Descend at ~1,800 to 2,200 feet per minute to arrive at the STAR approach waypoint at the correct altitude.',
  },
  RUNWAY_HEADING: {
    term: 'RUNWAY_HEADING',
    title: 'Runway Heading & Numbering',
    explanation: 'Runways are named after their magnetic compass direction rounded to the nearest 10 degrees. Runway 28 points west at ~280°. The opposite end of the same strip is Runway 10 (pointing east at 100°).',
    simTip: 'The "L", "C", and "R" suffixes stand for Left, Center, and Right when an airport has parallel runways.',
  },
  METAR: {
    term: 'METAR',
    title: 'Aviation Routine Weather Report',
    explanation: 'A standardized real-time weather observation for an airport reporting wind speed/direction, visibility, cloud layers, temperature, and altimeter pressure.',
    simTip: 'Always take off and land heading into the wind (headwind) to maximize lift and safety.',
  },
  COST_INDEX: {
    term: 'COST_INDEX',
    title: 'Cost Index (CI)',
    explanation: 'A number airlines program into the Flight Management Computer (FMC) to balance the cost of time against the cost of fuel. A higher number flies faster, while a lower number saves fuel.',
    simTip: 'A standard value of 30–45 is common for modern airliners like the A320neo and Boeing 737.',
  },
};
