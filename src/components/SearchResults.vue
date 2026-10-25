<template>
  <section
    v-if="q && datasets.length > 0"
    class="results"
    aria-live="polite"
    :aria-busy="isFetching && !data"
  >
    <div class="results__bar">
      <h2 class="results__summary">
        <template v-if="data">
          {{ t('search.resultsSummary', totalTerms) }} {{ t('search.inSources', sourcesWithTerms) }}
        </template>
        <template v-else>
          {{ t('search.stateSearching') }}
        </template>
      </h2>
      <span class="results__meta">{{ t('search.resultsFor', {q}) }}</span>
    </div>

    <template v-if="data">
      <SourceResults
        v-for="entry in data.terms"
        :key="entry.source.uri"
        :entry="entry"
        :q="q"
        :languages="languages"
        :genres="genres"
      />
    </template>

    <template v-else-if="isFetching">
      <article
        v-for="uri in datasets"
        :key="uri"
        class="source"
      >
        <SourceHeader
          :source="pendingSource(uri)"
          state="loading"
        />
        <div class="term-list">
          <div class="skeleton skeleton--block" />
          <div class="skeleton skeleton--block" />
        </div>
      </article>
    </template>

    <p
      v-else-if="error"
      class="source__notice source__notice--error"
      role="alert"
    >
      <ExclamationCircleIcon class="icon" />
      {{ t('api.Error') }}
    </p>
  </section>
</template>

<script lang="ts" setup>
import {computed, PropType, reactive, watch} from 'vue';
import {useQuery} from 'villus';
import {useI18n} from 'vue-i18n';
import {ExclamationCircleIcon} from '@heroicons/vue/16/solid';
import {Source, TERMS_QUERY, TermsQueryResult} from '../query';
import SourceResults from './SourceResults.vue';
import SourceHeader from './SourceHeader.vue';
import state from '../store';

const props = defineProps({
  q: {type: String, default: ''},
  datasets: {type: Array as PropType<string[]>, default: () => []},
  genres: {type: Array as PropType<string[]>, default: () => []},
});

const {t, locale} = useI18n();
const languages = [...new Set([locale.value, 'nl', 'en'])];

const {data, isFetching, error} = useQuery<TermsQueryResult>({
  query: TERMS_QUERY,
  variables: {
    sources: props.datasets,
    query: props.q,
    languages,
    ...(props.genres.length > 0 ? {genres: props.genres} : {}),
  },
  context: {
    headers: reactive({'Accept-Language': locale}),
  },
  skip: () => !props.q || props.datasets.length === 0,
});

watch(isFetching, (fetching) => {
  state.loading = fetching;
}, {immediate: true});

const totalTerms = computed(() =>
  data.value?.terms.reduce((sum, entry) => sum + ('terms' in entry.result ? entry.result.terms.length : 0), 0) ?? 0,
);
const sourcesWithTerms = computed(() =>
  data.value?.terms.filter(entry => 'terms' in entry.result && entry.result.terms.length > 0).length ?? 0,
);

const pendingSource = (uri: string): Source =>
  state.sources.find(source => source.uri === uri)
  ?? {__typename: 'Source', uri, name: uri.replace(/^https?:\/\//, ''), alternateName: '', description: '', features: [], genres: []};
</script>
