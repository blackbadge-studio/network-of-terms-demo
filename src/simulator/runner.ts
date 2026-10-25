import {TERM_FIELDS} from '../query';
import type {RequestRecord, SimRun, SimSettings, SourceRecord, SourceStatus} from './types';

/**
 * Client-side session runner. Fires one `terms` query per search term over the
 * selected sources, with a tempo (interval, jitter, concurrency), measures the
 * wall-clock time in the browser and records what the API reported per source.
 * Every request carries `X-Simulation: 1` so the API can filter it later.
 */

export interface RunnerCallbacks {
  onRecord: (record: RequestRecord) => void;
  onProgress: (done: number, total: number | null, elapsedMs: number) => void;
  onFinish: (stoppedBy: SimRun['stoppedBy']) => void;
}

interface ApiCapabilities {
  types: boolean;
  limit: boolean;
}

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve) => {
  if (ms <= 0 || signal.aborted) {
    resolve();
    return;
  }
  const timer = setTimeout(done, ms);
  function done() {
    signal.removeEventListener('abort', done);
    clearTimeout(timer);
    resolve();
  }
  signal.addEventListener('abort', done, {once: true});
});

/** Ask the schema which optional arguments `terms` accepts (the production API may lag). */
export async function probeCapabilities(url: string, signal?: AbortSignal): Promise<ApiCapabilities> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Simulation': '1'},
      body: JSON.stringify({query: '{ __type(name: "Query") { fields { name args { name } } } }'}),
      signal,
    });
    const json = await response.json();
    const fields: {name: string, args: {name: string}[]}[] = json?.data?.__type?.fields ?? [];
    const args = new Set((fields.find(field => field.name === 'terms')?.args ?? []).map(arg => arg.name));
    return {types: args.has('types'), limit: args.has('limit')};
  } catch {
    return {types: false, limit: false};
  }
}

function buildQuery(capabilities: ApiCapabilities) {
  const vars = ['$sources: [ID]!', '$query: String!', '$languages: [Language!]'];
  const args = ['sources: $sources', 'query: $query', 'languages: $languages'];
  if (capabilities.types) {
    vars.push('$types: [ResultType!]');
    args.push('types: $types');
  }
  if (capabilities.limit) {
    vars.push('$limit: Int');
    args.push('limit: $limit');
  }
  return `query Simulated (${vars.join(', ')}) {
    terms (${args.join(', ')}) {
      source { uri name }
      result {
        ... on TranslatedTerms { terms { ${TERM_FIELDS} } }
        ... on Error { __typename message }
      }
      responseTimeMs
    }
  }`;
}

const sourceStatus = (result: {__typename?: string, terms?: unknown[]} | null): SourceStatus => {
  if (!result) {
    return 'error';
  }
  if (Array.isArray(result.terms)) {
    return result.terms.length > 0 ? 'ok' : 'none';
  }
  return result.__typename === 'TimeoutError' ? 'timeout' : 'error';
};

export function createRunner(url: string, settings: SimSettings, sourceNames: Map<string, string>, callbacks: RunnerCallbacks) {
  const controller = new AbortController();
  const {signal} = controller;
  let nextId = 1;
  let started = 0;
  let finished = 0;
  let inFlight = 0;
  let stopping: SimRun['stoppedBy'] = null;
  const startedAt = performance.now();
  const total = settings.sizeMode === 'count' ? settings.count : null;
  const durationMs = settings.minutes * 60_000;
  let capabilities: ApiCapabilities = {types: false, limit: false};

  const timeIsUp = () => settings.sizeMode === 'duration' && performance.now() - startedAt >= durationMs;
  const allStarted = () => total !== null && started >= total;

  function progress() {
    callbacks.onProgress(finished, total, performance.now() - startedAt);
  }

  async function fire(term: string) {
    const id = nextId++;
    const record: RequestRecord = {id, t: new Date().toISOString(), term, status: 'running', ms: null, perSource: []};
    callbacks.onRecord({...record});
    const t0 = performance.now();
    try {
      const variables: Record<string, unknown> = {
        sources: settings.sources,
        query: term,
        languages: [...new Set([settings.lang, 'nl', 'en'])],
      };
      if (capabilities.types && settings.types.length > 0) {
        variables.types = settings.types;
      }
      if (capabilities.limit) {
        variables.limit = settings.limit;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': settings.lang,
          'X-Simulation': '1',
        },
        body: JSON.stringify({query: buildQuery(capabilities), variables}),
        signal,
      });
      record.ms = Math.round(performance.now() - t0);
      const json = await response.json();
      if (!response.ok || !json?.data?.terms) {
        record.status = 'error';
        record.message = json?.errors?.[0]?.message ?? `HTTP ${response.status}`;
      } else {
        const entries: {source: {uri: string, name: string}, result: {__typename?: string, terms?: unknown[]} | null, responseTimeMs: number}[] = json.data.terms;
        record.perSource = entries.map((entry): SourceRecord => ({
          source: entry.source.uri,
          name: entry.source.name || sourceNames.get(entry.source.uri) || entry.source.uri,
          status: sourceStatus(entry.result),
          results: Array.isArray(entry.result?.terms) ? entry.result!.terms!.length : 0,
          apiMs: typeof entry.responseTimeMs === 'number' ? entry.responseTimeMs : null,
        }));
        const statuses = record.perSource.map(entry => entry.status);
        record.status = statuses.includes('error') ? 'error' : statuses.includes('timeout') ? 'timeout' : 'done';
      }
    } catch (error) {
      record.ms = Math.round(performance.now() - t0);
      if (signal.aborted) {
        record.status = 'aborted';
      } else {
        record.status = 'error';
        record.message = error instanceof Error ? error.message : String(error);
      }
    }
    callbacks.onRecord({...record, perSource: [...record.perSource]});
    if (settings.stopOnError && (record.status === 'error' || record.status === 'timeout') && !stopping) {
      stopping = 'error';
      controller.abort();
    }
  }

  async function loop() {
    capabilities = await probeCapabilities(url, signal);
    const terms = settings.terms.length > 0 ? settings.terms : ['Gent'];
    while (!signal.aborted && !allStarted() && !timeIsUp()) {
      if (inFlight >= settings.tempo.concurrency) {
        await sleep(50, signal);
        continue;
      }
      const term = terms[started % terms.length];
      started++;
      inFlight++;
      fire(term).finally(() => {
        inFlight--;
        finished++;
        progress();
      });
      const jitter = settings.tempo.jitterMs > 0 ? Math.random() * settings.tempo.jitterMs : 0;
      await sleep(settings.tempo.intervalMs + jitter, signal);
    }
    while (inFlight > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    callbacks.onFinish(stopping ?? (signal.aborted ? 'user' : 'finished'));
  }

  return {
    start: () => { loop(); },
    stop: () => {
      if (!stopping) {
        stopping = 'user';
      }
      controller.abort();
    },
    /** Which optional `terms` arguments the API accepted (known after the probe). */
    get capabilities() {
      return capabilities;
    },
  };
}

export type Runner = ReturnType<typeof createRunner>;
