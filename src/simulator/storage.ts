import {DEFAULT_SETTINGS, SimRun, SimSettings} from './types';

const SETTINGS_KEY = 'vtn-sim-settings';
const RUNS_KEY = 'vtn-sim-runs';
const UNLOCK_KEY = 'vtn-sim-unlocked';
export const MAX_RUNS = 20;
/** Records are kept in full for the most recent runs only; older runs keep their summary. */
const RUNS_WITH_RECORDS = 5;
const MAX_RECORDS_PER_RUN = 500;

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? {...fallback, ...JSON.parse(raw)} as T : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown): boolean => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const loadSettings = (): SimSettings => {
  const stored = read<SimSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  return {...DEFAULT_SETTINGS, ...stored, tempo: {...DEFAULT_SETTINGS.tempo, ...stored.tempo}};
};
export const saveSettings = (settings: SimSettings) => write(SETTINGS_KEY, settings);

export const loadRuns = (): SimRun[] => {
  try {
    const raw = window.localStorage.getItem(RUNS_KEY);
    return raw ? JSON.parse(raw) as SimRun[] : [];
  } catch {
    return [];
  }
};

/** Keeps at most MAX_RUNS runs; trims records of older runs; drops the oldest when the quota is hit. */
export const saveRuns = (runs: SimRun[]): SimRun[] => {
  let kept = runs.slice(0, MAX_RUNS).map((run, index) => ({
    ...run,
    records: index < RUNS_WITH_RECORDS ? run.records.slice(0, MAX_RECORDS_PER_RUN) : [],
  }));
  while (!write(RUNS_KEY, kept) && kept.length > 0) {
    kept = kept.slice(0, -1);
  }
  return kept;
};

export const isUnlocked = (key: string) => {
  try {
    return window.localStorage.getItem(UNLOCK_KEY) === key;
  } catch {
    return false;
  }
};
export const unlock = (key: string) => write(UNLOCK_KEY, key);
