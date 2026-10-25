import {reactive} from 'vue';
import {Source} from './query';

export default reactive({
  selectedDatasets: [] as string[],
  selectedGenres: [] as string[],
  sources: [] as Source[],
  loading: false as boolean,
  /** Result-type filter (CONCEPT, PERSON, ...); not sent to the API until `terms(types:)` is live. */
  selectedTypes: [] as string[],
  /** Response time per source URI from the last search, for the netwerk source-status panel. */
  responseTimes: {} as Record<string, number>,
});
