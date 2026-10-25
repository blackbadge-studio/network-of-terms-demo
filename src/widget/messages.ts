/**
 * The widget's own texts, in the two languages of the Vlaams Termennetwerk. Kept apart from the
 * site's vue-i18n locales: the embed build (vite.widget.config.ts) must not pull in Vue.
 */
export type WidgetLang = 'nl' | 'en';

export const WIDGET_LANGS: readonly WidgetLang[] = ['nl', 'en'];

export const isWidgetLang = (value: unknown): value is WidgetLang =>
  typeof value === 'string' && (WIDGET_LANGS as readonly string[]).includes(value);

const nl = {
  searchLabel: 'Zoekwoorden',
  placeholder: 'Zoek een term, persoon of plaats…',
  search: 'Zoeken',
  searching: 'Zoeken…',
  emptyQuery: 'Typ eerst een zoekwoord.',
  sourcesLoading: 'Bronnen laden…',
  sourcesCount: 'geen bronnen | 1 bron | {n} bronnen',
  summary: 'geen termen | 1 term | {n} termen',
  summaryIn: 'in {n} bron | in {n} bron | in {n} bronnen',
  resultsFor: 'Resultaten voor “{q}”',
  stateResults: 'geen resultaten | 1 resultaat | {n} resultaten',
  stateNone: 'Geen resultaten',
  stateUnreachable: 'Niet bereikbaar',
  stateTimeout: 'Time-out',
  stateSearching: 'Zoeken…',
  select: 'Kies',
  selected: 'Gekozen',
  selectTerm: 'Kies “{label}”',
  details: 'Details',
  hideDetails: 'Verberg details',
  viewAtSource: 'Bekijk bij bron',
  copyUri: 'Kopieer URI',
  copied: 'Gekopieerd',
  altLabels: 'Ook bekend als',
  broader: 'Bredere termen',
  narrower: 'Nauwere termen',
  related: 'Gerelateerde termen',
  exactMatch: 'Overeenkomstige termen',
  apiError: 'Het Vlaams Termennetwerk is momenteel niet bereikbaar.',
  retry: 'Opnieuw proberen',
  poweredBy: 'Zoeken via het Vlaams Termennetwerk',
  externalLink: 'opent in een nieuw venster',
  types: {
    CONCEPT: 'Concept',
    PERSON: 'Persoon',
    ORGANIZATION: 'Organisatie',
    PLACE: 'Plaats',
    EVENT: 'Gebeurtenis',
  } as Record<string, string>,
};

export type WidgetMessages = typeof nl;

const en: WidgetMessages = {
  searchLabel: 'Search terms',
  placeholder: 'Search a term, person or place…',
  search: 'Search',
  searching: 'Searching…',
  emptyQuery: 'Type a search term first.',
  sourcesLoading: 'Loading sources…',
  sourcesCount: 'no sources | 1 source | {n} sources',
  summary: 'no terms | 1 term | {n} terms',
  summaryIn: 'in {n} source | in {n} source | in {n} sources',
  resultsFor: 'Results for “{q}”',
  stateResults: 'no results | 1 result | {n} results',
  stateNone: 'No results',
  stateUnreachable: 'Unreachable',
  stateTimeout: 'Timed out',
  stateSearching: 'Searching…',
  select: 'Select',
  selected: 'Selected',
  selectTerm: 'Select “{label}”',
  details: 'Details',
  hideDetails: 'Hide details',
  viewAtSource: 'View at source',
  copyUri: 'Copy URI',
  copied: 'Copied',
  altLabels: 'Also known as',
  broader: 'Broader terms',
  narrower: 'Narrower terms',
  related: 'Related terms',
  exactMatch: 'Matching terms',
  apiError: 'The Flemish Network of Terms is currently unreachable.',
  retry: 'Try again',
  poweredBy: 'Search powered by the Flemish Network of Terms',
  externalLink: 'opens in a new window',
  types: {
    CONCEPT: 'Concept',
    PERSON: 'Person',
    ORGANIZATION: 'Organisation',
    PLACE: 'Place',
    EVENT: 'Event',
  },
};

export const MESSAGES: Record<WidgetLang, WidgetMessages> = {nl, en};

/** "none | one | many" strings pick on the count; `{n}` and other placeholders are filled in. */
export const format = (message: string, params: Record<string, string | number> = {}): string => {
  let text = message;
  if (message.includes(' | ') && typeof params.n === 'number') {
    const [none, one, many] = message.split(' | ');
    text = params.n === 0 ? none : params.n === 1 ? one : (many ?? one);
  }

  return text.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
};
