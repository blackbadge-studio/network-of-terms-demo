/**
 * A result type is asked for as a genre. The Flemish genre list holds the five result types of the
 * tender next to the subject genres; these are their URIs in that list (the API’s
 * `catalog-vlaams/genres.jsonld`).
 */
const GENRE_BASE = 'https://termennetwerk.meemoo.be/genres/';

export const TYPE_GENRES: Record<string, string> = {
  CONCEPT: `${GENRE_BASE}concept`,
  PERSON: `${GENRE_BASE}persoon`,
  ORGANIZATION: `${GENRE_BASE}organisatie`,
  PLACE: `${GENRE_BASE}plaats`,
  EVENT: `${GENRE_BASE}gebeurtenis`,
};

/** CONCEPT, PERSON, ORGANIZATION, PLACE, EVENT: the values of `resultType`. */
export const RESULT_TYPES = Object.keys(TYPE_GENRES);

const typeGenreUris = new Set(Object.values(TYPE_GENRES));

export const isTypeGenre = (uri: string): boolean => typeGenreUris.has(uri);

/** The genres of the chosen result types, to pass as `genres`. */
export const genresOfTypes = (types: string[]): string[] =>
  types.map(type => TYPE_GENRES[type]).filter(Boolean);

/** The sources the API lists for these genres, as `sources(genres:)` does. */
export const SOURCES_BY_GENRE_QUERY = `query SourcesByGenre ($genres: [ID]) {
  sources (genres: $genres) { uri }
}`;
