import {reactive} from 'vue';
import {Source} from './query';

export default reactive({
  selectedDatasets: [] as string[],
  /** Genre URIs sent to the API as `genres`: the chosen result types (a type is a genre) and subjects. */
  selectedGenres: [] as string[],
  sources: [] as Source[],
  loading: false as boolean,
  /** Response time per source URI from the last search, for the netwerk source-status panel. */
  responseTimes: {} as Record<string, number>,
  /** When the visitor last pressed search (ms); the results that then appear scroll into view. */
  searchedAt: 0,
});
