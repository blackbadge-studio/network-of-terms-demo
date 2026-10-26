import type {ExportLine, RequestRecord, RunSummary, SimRun} from './types';

export const percentile = (values: number[], p: number): number | null => {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
};

export const summarize = (records: RequestRecord[], durationMs: number): RunSummary => ({
  requests: records.filter(record => record.status !== 'pending' && record.status !== 'running').length,
  results: records.reduce((sum, record) => sum + record.perSource.reduce((s, entry) => s + entry.results, 0), 0),
  timeouts: records.reduce((sum, record) => sum + (record.perSource.length > 0
    ? record.perSource.filter(entry => entry.status === 'timeout').length
    : (record.status === 'timeout' ? 1 : 0)), 0),
  // Per-source errors, plus requests that failed before any source answered.
  errors: records.reduce((sum, record) => sum + (record.perSource.length > 0
    ? record.perSource.filter(entry => entry.status === 'error').length
    : (record.status === 'error' ? 1 : 0)), 0),
  aborted: records.filter(record => record.status === 'aborted').length,
  cacheHits: records.filter(record => record.cached === true).length,
  cacheKnown: records.filter(record => record.cached !== null && record.cached !== undefined).length,
  durationMs: Math.round(durationMs),
});

export interface SourceStats {
  source: string;
  name: string;
  requests: number;
  ok: number;
  none: number;
  timeouts: number;
  errors: number;
  successRate: number;
  avgResults: number;
  p50: number | null;
  p95: number | null;
  max: number | null;
  /** Result-type distribution across all results of this source. */
  types: Record<string, number>;
}

export const perSourceStats = (records: RequestRecord[]): SourceStats[] => {
  const map = new Map<string, {name: string, times: number[], ok: number, none: number, timeouts: number, errors: number, results: number, requests: number, types: Record<string, number>}>();
  for (const record of records) {
    for (const entry of record.perSource) {
      const key = entry.source || entry.name;
      let bucket = map.get(key);
      if (!bucket) {
        bucket = {name: entry.name, times: [], ok: 0, none: 0, timeouts: 0, errors: 0, results: 0, requests: 0, types: {}};
        map.set(key, bucket);
      }
      bucket.requests++;
      bucket.results += entry.results;
      if (entry.apiMs !== null) {
        bucket.times.push(entry.apiMs);
      }
      for (const [type, count] of Object.entries(entry.types ?? {})) {
        bucket.types[type] = (bucket.types[type] ?? 0) + count;
      }
      if (entry.status === 'ok') bucket.ok++;
      else if (entry.status === 'none') bucket.none++;
      else if (entry.status === 'timeout') bucket.timeouts++;
      else bucket.errors++;
    }
  }
  return [...map.entries()].map(([source, bucket]) => ({
    source,
    name: bucket.name,
    requests: bucket.requests,
    ok: bucket.ok,
    none: bucket.none,
    timeouts: bucket.timeouts,
    errors: bucket.errors,
    successRate: bucket.requests > 0 ? (bucket.ok + bucket.none) / bucket.requests : 0,
    avgResults: bucket.requests > 0 ? bucket.results / bucket.requests : 0,
    p50: percentile(bucket.times, 50),
    p95: percentile(bucket.times, 95),
    max: bucket.times.length > 0 ? Math.max(...bucket.times) : null,
    types: bucket.types,
  })).sort((a, b) => a.name.localeCompare(b.name));
};

export interface CompareRow {
  source: string;
  name: string;
  a: SourceStats | null;
  b: SourceStats | null;
}

/** Side-by-side per-source stats of two runs, keyed by source. */
export const compareRuns = (runA: SimRun, runB: SimRun): CompareRow[] => {
  const statsA = new Map(perSourceStats(runA.records).map(row => [row.source, row]));
  const statsB = new Map(perSourceStats(runB.records).map(row => [row.source, row]));
  const keys = [...new Set([...statsA.keys(), ...statsB.keys()])];
  return keys.map(source => ({
    source,
    name: (statsA.get(source) ?? statsB.get(source))!.name,
    a: statsA.get(source) ?? null,
    b: statsB.get(source) ?? null,
  })).sort((x, y) => x.name.localeCompare(y.name));
};

export const exportLines = (run: SimRun): ExportLine[] => {
  const lang = run.settings.lang;
  const types = run.settings.types.join(',');
  const lines: ExportLine[] = [];
  for (const record of run.records) {
    const base = {t: record.t, kind: record.kind ?? 'search', term: record.term, ms: record.ms, cached: record.cached ?? null, lang, types};
    if (record.perSource.length === 0) {
      lines.push({...base, source: '', apiMs: null, status: record.status, results: 0});
      continue;
    }
    for (const entry of record.perSource) {
      lines.push({...base, source: entry.source, apiMs: entry.apiMs, status: entry.status, results: entry.results});
    }
  }
  return lines;
};

export const toNdjson = (run: SimRun) => exportLines(run).map(line => JSON.stringify(line)).join('\n') + '\n';

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (run: SimRun) => {
  const lines = exportLines(run);
  const header: (keyof ExportLine)[] = ['t', 'kind', 'term', 'source', 'ms', 'apiMs', 'status', 'results', 'cached', 'lang', 'types'];
  return [header.join(','), ...lines.map(line => header.map(key => csvCell(line[key])).join(','))].join('\n') + '\n';
};

export const downloadText = (filename: string, text: string, type: string) => {
  const blob = new Blob([text], {type});
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(href), 1000);
};

/** Points for a plain SVG sparkline: wall-clock ms per finished request, in order. */
export const sparklinePath = (records: RequestRecord[], width: number, height: number) => {
  const values = records.filter(record => record.ms !== null).map(record => record.ms as number);
  if (values.length < 2) {
    return {path: '', max: values[0] ?? 0, values};
  }
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const path = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(1)},${(height - (value / max) * (height - 2) - 1).toFixed(1)}`).join(' ');
  return {path, max, values};
};
