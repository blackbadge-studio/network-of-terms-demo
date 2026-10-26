import {RelatedTerm, Source} from './query';

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
      ... on TranslatedTerm { uri broader { uri prefLabel { language value } } }
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

export interface ResolvedPath {
  /** Ancestor URIs from the top concept down to the direct parent (empty for a top concept). */
  ancestors: string[];
  /** True when some level had more than one broader concept (the first was taken). */
  polyhierarchy: boolean;
  found: boolean;
}

/** Walks up via `lookup` broader (first broader when there are several), at most 10 levels. */
export async function resolvePath(source: string, uri: string, locale: string, signal?: AbortSignal): Promise<ResolvedPath> {
  if (STUB) {
    return stubResolvePath(uri);
  }
  const ancestors: string[] = [];
  let polyhierarchy = false;
  let current = uri;
  for (let level = 0; level < 10; level++) {
    const json = await graphql<{lookup: {result: {__typename: string, broader?: RelatedTerm[]}}[]}>(
      LOOKUP_BROADER_QUERY, {uris: [current], languages: [...new Set([locale, 'nl', 'en'])]}, locale, signal,
    );
    const result = json.data?.lookup?.[0]?.result;
    if (!result || result.__typename !== 'TranslatedTerm') {
      return {ancestors, polyhierarchy, found: level > 0};
    }
    const broader = result.broader ?? [];
    if (broader.length === 0) {
      break;
    }
    if (broader.length > 1) {
      polyhierarchy = true;
    }
    current = broader[0].uri;
    if (ancestors.includes(current) || current === uri) {
      break;
    }
    ancestors.unshift(current);
  }
  return {ancestors, polyhierarchy, found: true};
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

function stubResolvePath(uri: string): Promise<ResolvedPath> {
  const path = stubPath(uri);
  const source = uri.split('#stub-')[0];
  const ancestors = path.slice(0, -1).map((_, index) => stubUri(source, path.slice(0, index + 1)));
  return Promise.resolve({ancestors, polyhierarchy: path[path.length - 1] === 2, found: path.length > 0});
}
