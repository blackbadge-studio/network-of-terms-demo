/** Settings and records of the developer simulator (client-side only). */

export type TempoId = 'rustig' | 'normaal' | 'snel' | 'stress' | 'custom';
export type SizeMode = 'count' | 'duration';
export type TermPresetId = 'vlaams' | 'personen' | 'plaatsen' | 'materialen' | 'catalogus';
export type UriPresetId = 'gemengd' | 'wikidata' | 'vlaams';
export type Workload = 'search' | 'lookup' | 'mixed';

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

/** Lookup presets: known URIs from Wikidata, the Gent thesaurus, VTMK and RKD, plus one unknown and one without a source. */
export const URI_PRESETS: Record<UriPresetId, string[]> = {
  gemengd: [
    'http://www.wikidata.org/entity/Q1296',
    'http://www.wikidata.org/entity/Q5599',
    'https://stad.gent/id/concept/570024444',
    'https://vtmk.data.momu.be/id/106054',
    'https://data.rkd.nl/artists/381372',
    'http://vocab.getty.edu/aat/300033618',
    'http://www.wikidata.org/entity/Q999999999999',
    'https://example.org/term/1',
  ],
  wikidata: [
    'http://www.wikidata.org/entity/Q1296',
    'http://www.wikidata.org/entity/Q5599',
    'http://www.wikidata.org/entity/Q239',
    'http://www.wikidata.org/entity/Q12994',
    'http://www.wikidata.org/entity/Q12892',
  ],
  vlaams: [
    'https://stad.gent/id/concept/570024444',
    'https://stad.gent/id/concept/470009125',
    'https://stad.gent/id/concept/570013165',
    'https://vtmk.data.momu.be/id/106054',
    'https://vtmk.data.momu.be/id/105840',
    'https://vtmk.data.momu.be/id/106349',
    'https://data.rkd.nl/artists/381372',
    'https://data.rkd.nl/artists/461827',
  ],
};

export const RESULT_TYPES = ['CONCEPT', 'PERSON', 'ORGANIZATION', 'PLACE', 'EVENT'] as const;

export interface SimSettings {
  workload: Workload;
  terms: string[];
  uris: string[];
  /** Share of search requests in a mixed workload, 0–100. */
  mixRatio: number;
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
  /** Request timeout in ms (client abort and, when supported, the API's timeoutMs). */
  timeoutMs: number;
}

export const DEFAULT_SETTINGS: SimSettings = {
  workload: 'search',
  terms: TERM_PRESETS.vlaams,
  uris: URI_PRESETS.gemengd,
  mixRatio: 70,
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
  timeoutMs: 10000,
};

export type RequestKind = 'search' | 'lookup';
export type RequestStatus = 'pending' | 'running' | 'done' | 'timeout' | 'error' | 'aborted';
export type SourceStatus = 'ok' | 'none' | 'timeout' | 'error';

export interface SourceRecord {
  source: string;
  name: string;
  status: SourceStatus;
  results: number;
  /** Response time reported by the API for this source, ms. */
  apiMs: number | null;
  /** Count of results per resultType (CONCEPT, PERSON, …). */
  types: Record<string, number>;
  /** The API's `cached` flag for this source entry; null when the schema has no such field. */
  cached: boolean | null;
}

export interface RequestRecord {
  id: number;
  /** ISO start time. */
  t: string;
  kind: RequestKind;
  /** The search term or the looked-up URI. */
  term: string;
  status: RequestStatus;
  /** Wall-clock duration measured in the browser, ms. */
  ms: number | null;
  /** True when every source entry was served from the API cache, false when none/some, null when unknown. */
  cached: boolean | null;
  message?: string;
  perSource: SourceRecord[];
}

export interface RunSummary {
  requests: number;
  results: number;
  timeouts: number;
  errors: number;
  aborted: number;
  /** Source entries the API flagged as cache hits, and how many carried a flag at all. */
  cacheHits: number;
  cacheKnown: number;
  durationMs: number;
}

export interface ApiCapabilities {
  types: boolean;
  limit: boolean;
  timeoutMs: boolean;
  resultType: boolean;
  /** `cached: Boolean!` on the terms/lookup result items. */
  cached: boolean;
}

export interface SimRun {
  id: string;
  name: string;
  startedAt: string;
  finishedAt: string | null;
  settings: SimSettings;
  /** Which optional arguments and fields the API accepted during this run. */
  capabilities: ApiCapabilities;
  records: RequestRecord[];
  summary: RunSummary;
  stoppedBy: 'finished' | 'user' | 'error' | null;
}

/** One export line per request × source. */
export interface ExportLine {
  t: string;
  kind: RequestKind;
  term: string;
  source: string;
  ms: number | null;
  apiMs: number | null;
  status: string;
  results: number;
  cached: boolean | null;
  lang: string;
  types: string;
}
