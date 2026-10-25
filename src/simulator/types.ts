/** Settings and records of the developer simulator (client-side only). */

export type TempoId = 'rustig' | 'normaal' | 'snel' | 'stress' | 'custom';
export type SizeMode = 'count' | 'duration';
export type TermPresetId = 'vlaams' | 'personen' | 'plaatsen' | 'materialen' | 'catalogus';

export interface Tempo {
  /** Pause between starting two requests, in ms. */
  intervalMs: number;
  /** Maximum requests in flight. */
  concurrency: number;
  /** Random extra pause added to each interval, 0..jitterMs. */
  jitterMs: number;
}

export const TEMPO_PRESETS: Record<Exclude<TempoId, 'custom'>, Tempo> = {
  rustig: {intervalMs: 5000, concurrency: 1, jitterMs: 0},
  normaal: {intervalMs: 2000, concurrency: 2, jitterMs: 0},
  snel: {intervalMs: 500, concurrency: 4, jitterMs: 0},
  stress: {intervalMs: 0, concurrency: 8, jitterMs: 0},
};

export const TERM_PRESETS: Record<Exclude<TermPresetId, 'catalogus'>, string[]> = {
  vlaams: ['Ieper', 'Gent', 'Rubens', 'Van Eyck', 'lakenhal', 'belfort', 'kerk', 'schilderij', 'fotografie', 'jurk', 'kant', 'Permeke', 'Ensor', 'Brugge', 'begijnhof'],
  personen: ['Rubens', 'Van Eyck', 'Ensor', 'Permeke', 'Memling', 'Bruegel', 'Jordaens', 'Van Dyck', 'Magritte', 'Spilliaert', 'Khnopff', 'Delvaux', 'Minne', 'Wouters', 'Claus'],
  plaatsen: ['Gent', 'Brugge', 'Antwerpen', 'Leuven', 'Mechelen', 'Ieper', 'Oostende', 'Kortrijk', 'Hasselt', 'Lier', 'Damme', 'Tongeren', 'Dendermonde', 'Aalst', 'Sint-Niklaas'],
  materialen: ['hout', 'zilver', 'kant', 'wol', 'linnen', 'zijde', 'brons', 'ivoor', 'glas', 'keramiek', 'papier', 'perkament', 'leer', 'steen', 'goud'],
};

export const RESULT_TYPES = ['CONCEPT', 'PERSON', 'ORGANIZATION', 'PLACE', 'EVENT'] as const;

export interface SimSettings {
  terms: string[];
  sources: string[];
  types: string[];
  lang: 'nl' | 'en';
  tempoId: TempoId;
  tempo: Tempo;
  sizeMode: SizeMode;
  count: number;
  minutes: number;
  stopOnError: boolean;
  limit: number;
}

export const DEFAULT_SETTINGS: SimSettings = {
  terms: TERM_PRESETS.vlaams,
  sources: [],
  types: [],
  lang: 'nl',
  tempoId: 'normaal',
  tempo: {...TEMPO_PRESETS.normaal},
  sizeMode: 'count',
  count: 20,
  minutes: 2,
  stopOnError: false,
  limit: 20,
};

export type RequestStatus = 'pending' | 'running' | 'done' | 'timeout' | 'error' | 'aborted';
export type SourceStatus = 'ok' | 'none' | 'timeout' | 'error';

export interface SourceRecord {
  source: string;
  name: string;
  status: SourceStatus;
  results: number;
  /** Response time reported by the API for this source, ms. */
  apiMs: number | null;
}

export interface RequestRecord {
  id: number;
  /** ISO start time. */
  t: string;
  term: string;
  status: RequestStatus;
  /** Wall-clock duration measured in the browser, ms. */
  ms: number | null;
  message?: string;
  perSource: SourceRecord[];
}

export interface RunSummary {
  requests: number;
  results: number;
  timeouts: number;
  errors: number;
  aborted: number;
  durationMs: number;
}

export interface SimRun {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  settings: SimSettings;
  /** Which optional `terms` arguments the API accepted during this run. */
  capabilities: {types: boolean; limit: boolean};
  records: RequestRecord[];
  summary: RunSummary;
  stoppedBy: 'finished' | 'user' | 'error' | null;
}

/** One export line per request × source. */
export interface ExportLine {
  t: string;
  term: string;
  source: string;
  ms: number | null;
  apiMs: number | null;
  status: string;
  results: number;
  lang: string;
  types: string;
}
