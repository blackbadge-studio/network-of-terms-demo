import type {ApiCapabilities, RequestKind, RequestRecord, SimRun, SimSettings, SourceRecord, SourceStatus} from './types';

/**
 * Client-side session runner. Fires one `terms` (search) or `lookup` query per
 * request, with a tempo (interval, jitter, concurrency), measures the wall-clock
 * time in the browser and records what the API reported per source. Every
 * request carries `X-Simulation: 1` so the API can filter it later.
 */

export interface RunnerCallbacks {
  onRecord: (record: RequestRecord) => void;
  onProgress: (done: number, total: number | null, elapsedMs: number) => void;
  onFinish: (stoppedBy: SimRun['stoppedBy']) => void;
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

/** Ask the schema which optional arguments and fields exist (the production API may lag). */
export async function probeCapabilities(url: string, signal?: AbortSignal): Promise<ApiCapabilities> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'X-Simulation': '1'},
      body: JSON.stringify({query: '{ q: __type(name: "Query") { fields { name args { name } } } t: __type(name: "TranslatedTerm") { fields { name } } }'}),
      signal,
    });
    const json = await response.json();
    const fields: {name: string, args: {name: string}[]}[] = json?.data?.q?.fields ?? [];
    const termArgs = new Set((fields.find(field => field.name === 'terms')?.args ?? []).map(arg => arg.name));
    const termFields = new Set(((json?.data?.t?.fields ?? []) as {name: string}[]).map(field => field.name));
    return {
      types: termArgs.has('types'),
      limit: termArgs.has('limit'),
      timeoutMs: termArgs.has('timeoutMs'),
      resultType: termFields.has('resultType'),
    };
  } catch {
    return {types: false, limit: false, timeoutMs: false, resultType: false};
  }
}

function buildSearchQuery(capabilities: ApiCapabilities) {
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
  if (capabilities.timeoutMs) {
    vars.push('$timeoutMs: Int');
    args.push('timeoutMs: $timeoutMs');
  }
  const termFields = `uri prefLabel { language value }${capabilities.resultType ? ' resultType' : ''}`;
  return `query Simulated (${vars.join(', ')}) {
    terms (${args.join(', ')}) {
      source { uri name }
      result {
        ... on TranslatedTerms { terms { ${termFields} } }
        ... on Error { __typename message }
      }
      responseTimeMs
    }
  }`;
}

function buildLookupQuery(capabilities: ApiCapabilities) {
  const vars = ['$uris: [ID]!', '$languages: [Language]!'];
  const args = ['uris: $uris', 'languages: $languages'];
  if (capabilities.timeoutMs) {
    vars.push('$timeoutMs: Int');
    args.push('timeoutMs: $timeoutMs');
  }
  return `query SimulatedLookup (${vars.join(', ')}) {
    lookup (${args.join(', ')}) {
      source { __typename ... on Source { uri name } }
      result {
        __typename
        ... on TranslatedTerm { uri${capabilities.resultType ? ' resultType' : ''} }
        ... on Error { message }
      }
      responseTimeMs
    }
  }`;
}

const searchStatus = (result: {__typename?: string, terms?: unknown[]} | null): SourceStatus => {
  if (!result) {
    return 'error';
  }
  if (Array.isArray(result.terms)) {
    return result.terms.length > 0 ? 'ok' : 'none';
  }
  return result.__typename === 'TimeoutError' ? 'timeout' : 'error';
};

const countTypes = (terms: {resultType?: string | null}[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  for (const term of terms) {
    const type = term.resultType ?? 'UNKNOWN';
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
};

/** Reads a cache flag from common response headers; null when the API does not say. */
const cachedFlag = (response: Response): boolean | null => {
  const value = (response.headers.get('x-cache') ?? response.headers.get('x-cache-status') ?? response.headers.get('x-vtn-cache'))?.toLowerCase();
  if (value) {
    return value.includes('hit');
  }
  const age = Number(response.headers.get('age'));
  return Number.isFinite(age) && response.headers.has('age') ? age > 0 : null;
};

export function createRunner(url: string, settings: SimSettings, sourceNames: Map<string, string>, callbacks: RunnerCallbacks) {
  const controller = new AbortController();
  const {signal} = controller;
  let nextId = 1;
  let started = 0;
  let finished = 0;
  let inFlight = 0;
  let searches = 0;
  let lookups = 0;
  let stopping: SimRun['stoppedBy'] = null;
  const startedAt = performance.now();
  const total = settings.sizeMode === 'count' ? settings.count : null;
  const durationMs = settings.minutes * 60_000;
  let capabilities: ApiCapabilities = {types: false, limit: false, timeoutMs: false, resultType: false};

  const timeIsUp = () => settings.sizeMode === 'duration' && performance.now() - startedAt >= durationMs;
  const allStarted = () => total !== null && started >= total;

  function progress() {
    callbacks.onProgress(finished, total, performance.now() - startedAt);
  }

  function headers(): Record<string, string> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept-Language': settings.lang,
      'X-Simulation': '1',
    };
    if (settings.cacheMode === 'live') {
      base['Cache-Control'] = 'no-cache';
    }
    return base;
  }

  function searchVariables(term: string) {
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
    if (capabilities.timeoutMs) {
      variables.timeoutMs = settings.timeoutMs;
    }
    return variables;
  }

  function lookupVariables(uri: string) {
    const variables: Record<string, unknown> = {
      uris: [uri],
      languages: [...new Set([settings.lang, 'nl', 'en'])],
    };
    if (capabilities.timeoutMs) {
      variables.timeoutMs = settings.timeoutMs;
    }
    return variables;
  }

  function parseSearch(data: unknown): SourceRecord[] {
    const entries = (data as {terms?: {source: {uri: string, name: string}, result: {__typename?: string, terms?: {resultType?: string | null}[]} | null, responseTimeMs: number}[]})?.terms ?? [];
    return entries.map((entry): SourceRecord => ({
      source: entry.source.uri,
      name: entry.source.name || sourceNames.get(entry.source.uri) || entry.source.uri,
      status: searchStatus(entry.result),
      results: Array.isArray(entry.result?.terms) ? entry.result!.terms!.length : 0,
      apiMs: typeof entry.responseTimeMs === 'number' ? entry.responseTimeMs : null,
      types: Array.isArray(entry.result?.terms) ? countTypes(entry.result!.terms!) : {},
    }));
  }

  function parseLookup(data: unknown): SourceRecord[] {
    const entries = (data as {lookup?: {source: {__typename: string, uri?: string, name?: string}, result: {__typename: string, resultType?: string | null}, responseTimeMs: number}[]})?.lookup ?? [];
    return entries.map((entry): SourceRecord => {
      const typename = entry.result?.__typename;
      const status: SourceStatus = typename === 'TranslatedTerm' ? 'ok'
        : typename === 'NotFoundError' ? 'none'
          : typename === 'TimeoutError' ? 'timeout' : 'error';
      return {
        source: entry.source?.uri ?? '',
        name: entry.source?.name ?? entry.source?.__typename ?? '—',
        status,
        results: status === 'ok' ? 1 : 0,
        apiMs: typeof entry.responseTimeMs === 'number' ? entry.responseTimeMs : null,
        types: status === 'ok' ? countTypes([entry.result]) : {},
      };
    });
  }

  async function fire(kind: RequestKind, term: string) {
    const id = nextId++;
    const record: RequestRecord = {id, t: new Date().toISOString(), kind, term, status: 'running', ms: null, cached: null, perSource: []};
    callbacks.onRecord({...record});
    const t0 = performance.now();
    const timeout = AbortSignal.timeout(settings.timeoutMs);
    const requestSignal = AbortSignal.any([signal, timeout]);
    try {
      const body = kind === 'search'
        ? {query: buildSearchQuery(capabilities), variables: searchVariables(term)}
        : {query: buildLookupQuery(capabilities), variables: lookupVariables(term)};
      const response = await fetch(url, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
        signal: requestSignal,
        cache: settings.cacheMode === 'live' ? 'no-cache' : 'default',
      });
      record.ms = Math.round(performance.now() - t0);
      record.cached = cachedFlag(response);
      const json = await response.json();
      const data = json?.data;
      if (!response.ok || !data || (kind === 'search' ? !data.terms : !data.lookup)) {
        record.status = 'error';
        record.message = json?.errors?.[0]?.message ?? `HTTP ${response.status}`;
      } else {
        record.perSource = kind === 'search' ? parseSearch(data) : parseLookup(data);
        const statuses = record.perSource.map(entry => entry.status);
        record.status = statuses.includes('error') ? 'error' : statuses.includes('timeout') ? 'timeout' : 'done';
      }
    } catch (error) {
      record.ms = Math.round(performance.now() - t0);
      if (signal.aborted) {
        record.status = 'aborted';
      } else if (timeout.aborted) {
        record.status = 'timeout';
        record.message = `> ${settings.timeoutMs} ms`;
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

  function nextRequest(): [RequestKind, string] {
    const terms = settings.terms.length > 0 ? settings.terms : ['Gent'];
    const uris = settings.uris.length > 0 ? settings.uris : ['http://www.wikidata.org/entity/Q1296'];
    const kind: RequestKind = settings.workload === 'mixed'
      ? (Math.random() * 100 < settings.mixRatio ? 'search' : 'lookup')
      : settings.workload;
    if (kind === 'search') {
      return ['search', terms[searches++ % terms.length]];
    }
    return ['lookup', uris[lookups++ % uris.length]];
  }

  async function loop() {
    capabilities = await probeCapabilities(url, signal);
    while (!signal.aborted && !allStarted() && !timeIsUp()) {
      if (inFlight >= settings.tempo.concurrency) {
        await sleep(50, signal);
        continue;
      }
      const [kind, term] = nextRequest();
      started++;
      inFlight++;
      fire(kind, term).finally(() => {
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
    /** Which optional arguments and fields the API accepted (known after the probe). */
    get capabilities() {
      return capabilities;
    },
  };
}

export type Runner = ReturnType<typeof createRunner>;
