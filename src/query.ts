import {i18n} from './main';

export interface TermsQueryResult {
  terms: TermsEntry[];
}

export interface Terms {
  terms: Term[];
}

export interface Error {
  __typename: string;
  message: string;
}

export interface LookupQuery {
  lookup: [
    {
      source: Source,
      result: Term,
      responseTimeMs: number,
    },
  ]
}

export interface LanguageString {
  language: string;
  value: string;
}

export interface Term {
  __typename: string;
  uri: string;
  /** CONCEPT | PERSON | ORGANIZATION | PLACE | EVENT. */
  resultType?: string;
  /** What the source states about the person this term denotes; null for other terms and for sources that give no details. */
  person?: Person | null;
  prefLabel: LanguageString[];
  altLabel: LanguageString[];
  hiddenLabel: LanguageString[];
  scopeNote: LanguageString[];
  seeAlso: string[];
  broader: RelatedTerm[];
  narrower: RelatedTerm[];
  related: RelatedTerm[];
  exactMatch: RelatedTerm[];
}

export interface Entity {
  uri: string | null;
  name: LanguageString[];
}

export interface Person {
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: Entity[];
  deathPlace: Entity[];
  hasOccupation: Array<{roleName: LanguageString[]; occupation: Entity | null}>;
  nationality: Entity[];
}

export interface RelatedTerm {
  uri: string;
  prefLabel: LanguageString[];
}

export interface Source {
  __typename: string;
  uri: string;
  name: string;
  alternateName: string;
  description: string;
  mainEntityOfPage?: string;
  inLanguage?: string[];
  creators?: Creator[];
  features: Feature[];
  genres: Genre[];
  status?: SourceStatus;
}

export interface TermsEntry {
  source: Source;
  result: Terms | Error;
  responseTimeMs: number;
}

/** The four per-source states after a search, plus a pending state while fetching. */
export type SourceState = 'ok' | 'none' | 'error' | 'timeout' | 'loading';

export const sourceState = (result: Terms | Error | Term | null | undefined): SourceState => {
  if (!result) {
    return 'loading';
  }
  if ('terms' in result) {
    return result.terms.length > 0 ? 'ok' : 'none';
  }
  switch (result.__typename) {
    case 'TimeoutError':
      return 'timeout';
    case 'ServerError':
      return 'error';
    case 'NotFoundError':
      return 'none';
    default:
      return 'uri' in result ? 'ok' : 'error';
  }
};

/** Holder display name; sources may come without creators. */
export const holderName = (source: Source): string | undefined => {
  const creator = source.creators?.[0];
  return creator?.alternateName || creator?.name || undefined;
};

export const TERM_FIELDS = `
  uri
  resultType
  prefLabel { language value }
  altLabel { language value }
  hiddenLabel { language value }
  scopeNote { language value }
  seeAlso
  broader { uri prefLabel { language value } }
  narrower { uri prefLabel { language value } }
  related { uri prefLabel { language value } }
  exactMatch { uri prefLabel { language value } }
  person {
    birthDate
    deathDate
    birthPlace { uri name { language value } }
    deathPlace { uri name { language value } }
    hasOccupation { roleName { language value } occupation { uri name { language value } } }
    nationality { uri name { language value } }
  }
`;

export const TERMS_QUERY = `query Terms ($sources: [ID]!, $query: String!, $languages: [Language!], $genres: [ID], $types: [ResultType!]) {
  terms (sources: $sources query: $query languages: $languages genres: $genres types: $types) {
    source {
      name
      uri
      alternateName
      description
      creators { name alternateName }
    }
    result {
      ... on TranslatedTerms {
        terms { ${TERM_FIELDS} }
      }
      ... on Error {
        __typename
        message
      }
    }
    responseTimeMs
  }
}`;

export const SOURCES_QUERY = `query Sources {
  sources {
    name alternateName uri mainEntityOfPage description inLanguage
    creators { name alternateName }
    status { isAvailable lastChecked }
    features { type url }
    genres { uri name }
  }
}`;

export interface Creator {
  name: string;
  alternateName: string;
}

export interface Feature {
  type: string;
  url: string;
}

export interface Genre {
  uri: string;
  name: string;
}

export interface SourceStatus {
  isAvailable: boolean;
  lastChecked: string;
}

export const filterLanguageStrings = (languageStrings: LanguageString[]) => {
  const preferredValues = languageStrings.filter(languageString => languageString.language === i18n.global.locale);
  if (preferredValues.length > 0) {
    return preferredValues.map(languageString => languageString.value);
  }

  return languageStrings.map(languageString => languageString.value);
}
