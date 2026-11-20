import {reactive} from 'vue';
import {Source} from './query';

export default reactive({
  selectedDatasets: [] as string[],
  selectedGenres: [] as string[],
  sources: [] as Source[],
  loading: false as boolean,
  /** Result-type filter (CONCEPT, PERSON, ...), sent to the API as `terms(types:)`. */
  selectedTypes: [] as string[],
  /** Response time per source URI from the last search, for the netwerk source-status panel. */
  responseTimes: {} as Record<string, number>,
  /** When the visitor last pressed search (ms); the results that then appear scroll into view. */
  searchedAt: 0,
});
