/**
 * The slice of the Vlaams Termennetwerk GraphQL API the widget uses: the sources and a federated
 * `terms` search. Plain fetch, no client library, so the embed stays small.
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

export interface WidgetSource {
  uri: string;
  name: string;
  alternateName: string | null;
  mainEntityOfPage?: string | null;
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

export const RESULT_TYPES = ['CONCEPT', 'PERSON', 'ORGANIZATION', 'PLACE', 'EVENT'] as const;

export const sourceState = (result: TermsEntry['result']): SourceState => {
  if ('terms' in result) {
    return result.terms.length > 0 ? 'ok' : 'none';
  }

  return result.__typename === 'TimeoutError' ? 'timeout' : 'error';
};

const SOURCES_QUERY = `query WidgetSources {
  sources { uri name alternateName mainEntityOfPage }
}`;

const TERMS_QUERY = `query WidgetTerms ($sources: [ID]!, $query: String!, $languages: [Language!], $types: [ResultType!], $limit: Int) {
  terms (sources: $sources query: $query languages: $languages types: $types limit: $limit) {
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

// The source list hardly changes: one request per endpoint per page, shared by every widget on it.
const sourcesCache = new Map<string, Promise<WidgetSource[]>>();

export function fetchSources(api: string, lang: string): Promise<WidgetSource[]> {
  let pending = sourcesCache.get(api);
  if (!pending) {
    pending = graphql<{sources: WidgetSource[]}>(api, SOURCES_QUERY, {}, lang)
      .then(data => data.sources)
      .catch((error: unknown) => {
        sourcesCache.delete(api);
        throw error;
      });
    sourcesCache.set(api, pending);
  }

  return pending;
}

export interface TermsRequest {
  api: string;
  sources: string[];
  query: string;
  lang: string;
  types: string[];
  limit: number;
  signal?: AbortSignal;
}

export async function fetchTerms(request: TermsRequest): Promise<TermsEntry[]> {
  const data = await graphql<{terms: TermsEntry[]}>(request.api, TERMS_QUERY, {
    sources: request.sources,
    query: request.query,
    languages: [request.lang],
    ...(request.types.length > 0 ? {types: request.types} : {}),
    limit: request.limit,
  }, request.lang, request.signal);

  return data.terms;
}

/** Labels in the widget's language first; every label when the source has none in it. */
export const pickLabels = (strings: LanguageString[], lang: string): string[] => {
  const preferred = strings.filter(item => item.language === lang).map(item => item.value);

  return preferred.length > 0 ? preferred : strings.map(item => item.value);
};
