import {LanguageString, RelatedTerm, Source} from './query';

/**
 * Hierarchical browsing (bestek F5.1, F2.23, F4.16) on top of the API's
 * `browse` query. Only sources whose features include HIERARCHY support it.
 */

export interface BrowseNode {
  uri: string;
  prefLabel: string[];
  hasNarrower: boolean;
  /** All broader concepts of the node (polyhierarchy: a node can sit under several parents). */
  broader: RelatedTerm[];
}

export type BrowseOutcome =
  | {status: 'ok', nodes: BrowseNode[], responseTimeMs: number, cached: boolean}
  | {status: 'timeout' | 'error', message: string};

const apiUrl = () => import.meta.env.VITE_GRAPHQL_URL as string;
const STUB = import.meta.env.DEV && import.meta.env.VITE_BROWSE_STUB === '1';

export const supportsHierarchy = (source: Source | undefined | null) =>
  Boolean(source?.features?.some(feature => feature.type === 'HIERARCHY'));

const BROWSE_QUERY = `query Browse ($source: ID!, $uri: ID, $languages: [Language], $limit: Int, $timeoutMs: Int) {
  browse (source: $source, uri: $uri, languages: $languages, limit: $limit, timeoutMs: $timeoutMs) {
    uri
    result {
      __typename
      ... on BrowseNodes {
        nodes { uri prefLabel hasNarrower broader { uri prefLabel } }
      }
      ... on Error { message }
    }
    responseTimeMs
    cached
  }
}`;

const LOOKUP_BROADER_QUERY = `query BrowseLookup ($uris: [ID]!, $languages: [Language]!) {
  lookup (uris: $uris, languages: $languages) {
    result {
      __typename
      ... on TranslatedTerm { uri prefLabel { language value } broader { uri prefLabel { language value } } }
    }
  }
}`;

async function graphql<T>(query: string, variables: Record<string, unknown>, locale: string, signal?: AbortSignal): Promise<{data?: T, errors?: {message: string}[]}> {
  const response = await fetch(apiUrl(), {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Accept-Language': locale},
    body: JSON.stringify({query, variables}),
    signal,
  });
  return response.json();
}

let browseProbe: Promise<boolean> | null = null;
/** Whether the API exposes `browse` (the production API may lag behind the contract). */
export function hasBrowseApi(): Promise<boolean> {
  if (STUB) {
    return Promise.resolve(true);
  }
  if (!browseProbe) {
    browseProbe = graphql<{q: {fields: {name: string}[]}}>('{ q: __type(name: "Query") { fields { name } } }', {}, 'nl')
      .then(json => Boolean(json.data?.q?.fields.some(field => field.name === 'browse')))
      .catch(() => false);
  }
  return browseProbe;
}

/** Top concepts of a source (no uri) or the direct narrower concepts of `uri`. */
export async function browseNodes(source: string, uri: string | null, locale: string, signal?: AbortSignal): Promise<BrowseOutcome> {
  if (STUB) {
    return stubBrowse(source, uri);
  }
  try {
    const json = await graphql<{browse: {result: {__typename: string, nodes?: BrowseNode[], message?: string}, responseTimeMs: number, cached: boolean}}>(
      BROWSE_QUERY,
      {source, uri, languages: [locale], limit: 500, timeoutMs: 10000},
      locale,
      signal,
    );
    if (json.errors?.length || !json.data?.browse) {
      return {status: 'error', message: json.errors?.[0]?.message ?? 'No data'};
    }
    const {result, responseTimeMs, cached} = json.data.browse;
    if (result.__typename === 'BrowseNodes') {
      // The API gives broader labels as plain strings in the requested language; the tree uses
      // the LanguageString shape of the rest of the app.
      const nodes = (result.nodes ?? []).map(node => ({
        ...node,
        broader: (node.broader as unknown as {uri: string, prefLabel: string[]}[]).map(parent => ({
          uri: parent.uri,
          prefLabel: parent.prefLabel.map(value => ({language: locale, value})),
        })),
      }));
      return {status: 'ok', nodes, responseTimeMs, cached};
    }
    return {status: result.__typename === 'TimeoutError' ? 'timeout' : 'error', message: result.message ?? result.__typename};
  } catch (error) {
    return {status: 'error', message: error instanceof Error ? error.message : String(error)};
  }
}

export interface PathStep {
  uri: string;
  label: string;
}

export interface ResolvedPaths {
  /** The concept's own label, when the lookup gave one. */
  label: string | null;
  /**
   * Every path to the concept: its broader concepts from a top concept down to a direct parent.
   * A concept with several broader concepts has several paths (bestek 3.4.9: never reduce them to one);
   * a top concept has one, empty, path.
   */
  paths: PathStep[][];
  /** True when the source has more paths or levels than we follow. */
  truncated: boolean;
  found: boolean;
}

const MAX_PATHS = 8;
const MAX_DEPTH = 12;

/** Walks up via `lookup` broader along every broader concept, so all paths to the concept are kept. */
export async function resolvePaths(source: string, uri: string, locale: string, signal?: AbortSignal): Promise<ResolvedPaths> {
  if (STUB) {
    return stubResolvePaths(uri);
  }
  const languages = [...new Set([locale, 'nl', 'en'])];
  const pick = (labels: LanguageString[] = []) => (labels.find(label => label.language === locale) ?? labels[0])?.value ?? null;
  // One lookup per concept, however many paths pass through it.
  const lookups = new Map<string, Promise<{label: string | null, broader: PathStep[]} | null>>();
  const lookup = (current: string) => {
    if (!lookups.has(current)) {
      lookups.set(current, graphql<{lookup: {result: {__typename: string, prefLabel?: LanguageString[], broader?: RelatedTerm[]}}[]}>(
        LOOKUP_BROADER_QUERY, {uris: [current], languages}, locale, signal,
      ).then((json) => {
        const result = json.data?.lookup?.[0]?.result;
        if (!result || result.__typename !== 'TranslatedTerm') {
          return null;
        }
        return {
          label: pick(result.prefLabel),
          broader: (result.broader ?? []).map(parent => ({uri: parent.uri, label: pick(parent.prefLabel) ?? parent.uri})),
        };
      }));
    }
    return lookups.get(current)!;
  };

  const own = await lookup(uri);
  if (!own) {
    return {label: null, paths: [], truncated: false, found: false};
  }
  const paths: PathStep[][] = [];
  let truncated = false;
  // `trail` runs from the concept's direct parent upwards; a finished trail is turned around.
  const walk = async (current: string, trail: PathStep[]): Promise<void> => {
    if (paths.length >= MAX_PATHS) {
      truncated = true;
      return;
    }
    const entry = await lookup(current);
    const parents = (entry?.broader ?? []).filter(parent => parent.uri !== uri && !trail.some(step => step.uri === parent.uri));
    if (parents.length === 0 || trail.length >= MAX_DEPTH) {
      truncated = truncated || parents.length > 0;
      paths.push([...trail].reverse());
      return;
    }
    for (const parent of parents) {
      await walk(parent.uri, [...trail, parent]);
    }
  };
  await walk(uri, []);
  return {label: own.label, paths, truncated, found: true};
}

/* ---------- dev stub (VITE_BROWSE_STUB=1): a deterministic fake tree ---------- */

const stubLabel = (path: number[]) => `Begrip ${path.join('.')}`;
const stubUri = (source: string, path: number[]) => `${source}#stub-${path.join('-')}`;
const stubPath = (uri: string): number[] => (uri.split('#stub-')[1] ?? '').split('-').filter(Boolean).map(Number);

function stubBrowse(source: string, uri: string | null): Promise<BrowseOutcome> {
  const parent = uri ? stubPath(uri) : [];
  const depth = parent.length;
  // Simulate failures on one branch so the inline error states can be seen.
  if (parent[0] === 7 && depth === 1) {
    return new Promise(resolve => setTimeout(() => resolve({status: 'timeout', message: 'De terminologiebron reageerde niet op tijd'}), 400));
  }
  const count = depth === 0 ? 8 : Math.max(0, 5 - depth - (parent[parent.length - 1] % 3));
  const nodes: BrowseNode[] = Array.from({length: count}, (_, index) => {
    const path = [...parent, index + 1];
    const broader: RelatedTerm[] = parent.length > 0
      ? [{uri: stubUri(source, parent), prefLabel: [{language: 'nl', value: stubLabel(parent)}]}]
      : [];
    if (parent.length > 0 && index === 1) {
      const other = [...parent.slice(0, -1), (parent[parent.length - 1] % 8) + 1];
      broader.push({uri: stubUri(source, other), prefLabel: [{language: 'nl', value: stubLabel(other)}]});
    }
    return {uri: stubUri(source, path), prefLabel: [stubLabel(path)], hasNarrower: depth < 3 && (index + depth) % 4 !== 3, broader};
  });
  return new Promise(resolve => setTimeout(() => resolve({status: 'ok', nodes, responseTimeMs: 120, cached: false}), 300));
}

function stubResolvePaths(uri: string): Promise<ResolvedPaths> {
  const path = stubPath(uri);
  const source = uri.split('#stub-')[0];
  const steps = (numbers: number[]): PathStep[] => numbers.slice(0, -1).map((_, index) => {
    const prefix = numbers.slice(0, index + 1);
    return {uri: stubUri(source, prefix), label: stubLabel(prefix)};
  });
  const paths = [steps(path)];
  // The stub tree puts every second child under a neighbouring parent too: that concept has two paths.
  if (path.length > 1 && path[path.length - 1] === 2) {
    const parent = path.slice(0, -1);
    const other = [...parent.slice(0, -1), (parent[parent.length - 1] % 8) + 1];
    paths.push(steps([...other, 2]));
  }
  return Promise.resolve({label: stubLabel(path), paths, truncated: false, found: path.length > 0});
}
