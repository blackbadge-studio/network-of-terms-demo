/**
 * The slice of the Vlaams Termennetwerk GraphQL API the widget uses: the sources and a federated
 * `terms` search, both with the optional `genres`. Plain fetch, no client library, so the embed
 * stays small.
 */

export interface LanguageString {
  language: string;
  value: string;
}

export interface RelatedTerm {
  uri: string;
  prefLabel: LanguageString[];
}

export interface WidgetTerm {
  uri: string;
  resultType: string;
  prefLabel: LanguageString[];
  altLabel: LanguageString[];
  scopeNote: LanguageString[];
  seeAlso: string[];
  broader: RelatedTerm[];
  narrower: RelatedTerm[];
  related: RelatedTerm[];
  exactMatch: RelatedTerm[];
}

export interface WidgetGenre {
  uri: string;
  name: string;
}

export interface WidgetSource {
  uri: string;
  name: string;
  alternateName: string | null;
  mainEntityOfPage?: string | null;
  /** Only on the sources list, where the widget reads the names of the genres it was given. */
  genres?: WidgetGenre[];
}

export interface TermsError {
  __typename: 'ServerError' | 'TimeoutError' | string;
  message: string;
}

export interface TermsEntry {
  source: WidgetSource;
  result: {terms: WidgetTerm[]} | TermsError;
  responseTimeMs: number;
}

export type SourceState = 'ok' | 'none' | 'error' | 'timeout';

export const sourceState = (result: TermsEntry['result']): SourceState => {
  if ('terms' in result) {
    return result.terms.length > 0 ? 'ok' : 'none';
  }

  return result.__typename === 'TimeoutError' ? 'timeout' : 'error';
};

const SOURCES_QUERY = `query WidgetSources ($genres: [ID]) {
  sources (genres: $genres) { uri name alternateName mainEntityOfPage genres { uri name } }
}`;

const TERMS_QUERY = `query WidgetTerms ($sources: [ID]!, $query: String!, $languages: [Language!], $genres: [ID], $limit: Int) {
  terms (sources: $sources query: $query languages: $languages genres: $genres limit: $limit) {
    source { uri name alternateName mainEntityOfPage }
    result {
      ... on TranslatedTerms {
        terms {
          uri resultType
          prefLabel { language value }
          altLabel { language value }
          scopeNote { language value }
          seeAlso
          broader { uri prefLabel { language value } }
          narrower { uri prefLabel { language value } }
          related { uri prefLabel { language value } }
          exactMatch { uri prefLabel { language value } }
        }
      }
      ... on Error { __typename message }
    }
    responseTimeMs
  }
}`;

async function graphql<T>(api: string, query: string, variables: Record<string, unknown>, lang: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(api, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'Accept-Language': lang},
    body: JSON.stringify({query, variables}),
    signal,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const body = await response.json() as {data?: T; errors?: {message: string}[]};
  if (body.errors?.length || !body.data) {
    throw new Error(body.errors?.[0]?.message ?? 'Empty response');
  }

  return body.data;
}

// The source list hardly changes: one request per endpoint and set of genres per page, shared by
// every widget on it.
const sourcesCache = new Map<string, Promise<WidgetSource[]>>();

/** The sources of the API; with genres, the sources that have one of them (`sources(genres:)`). */
export function fetchSources(api: string, lang: string, genres: string[] = []): Promise<WidgetSource[]> {
  const key = [api, lang, ...genres].join(' ');
  let pending = sourcesCache.get(key);
  if (!pending) {
    pending = graphql<{sources: WidgetSource[]}>(api, SOURCES_QUERY, genres.length > 0 ? {genres} : {}, lang)
      .then(data => data.sources)
      .catch((error: unknown) => {
        sourcesCache.delete(key);
        throw error;
      });
    sourcesCache.set(key, pending);
  }

  return pending;
}

export interface TermsRequest {
  api: string;
  sources: string[];
  query: string;
  lang: string;
  /** Genre URIs; a result type is a genre too. */
  genres: string[];
  limit: number;
  signal?: AbortSignal;
}

export async function fetchTerms(request: TermsRequest): Promise<TermsEntry[]> {
  const data = await graphql<{terms: TermsEntry[]}>(request.api, TERMS_QUERY, {
    sources: request.sources,
    query: request.query,
    languages: [request.lang],
    ...(request.genres.length > 0 ? {genres: request.genres} : {}),
    limit: request.limit,
  }, request.lang, request.signal);

  return data.terms;
}

/** Labels in the widget's language first; every label when the source has none in it. */
export const pickLabels = (strings: LanguageString[], lang: string): string[] => {
  const preferred = strings.filter(item => item.language === lang).map(item => item.value);

  return preferred.length > 0 ? preferred : strings.map(item => item.value);
};
