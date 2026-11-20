<template>
  <section
    v-if="q && datasets.length > 0"
    ref="sectionEl"
    class="results"
    :class="{'results--compact': compact, 'has-detail': compact && selected}"
    aria-live="polite"
    :aria-busy="isFetching && !data"
  >
    <div class="results__bar">
      <h2 class="results__summary">
        <template v-if="entries || noSourceOfType">
          {{ t('search.resultsSummary', totalTerms) }} {{ t('search.inSources', sourcesWithTerms) }}
        </template>
        <template v-else>
          {{ t('search.stateSearching') }}
        </template>
      </h2>
      <span class="results__meta">{{ t('search.resultsFor', {q}) }}</span>
    </div>

    <!-- minimaal: sticky per-source strip -->
    <nav
      v-if="compact && entries"
      class="results__tabs"
      :aria-label="t('search.jumpToSource')"
    >
      <a
        v-for="(entry, index) in entries"
        :key="entry.source.uri"
        :href="`#source-${index}`"
        @click.prevent="jumpTo(index)"
      >
        {{ entry.source.alternateName || entry.source.name }}
        <b v-if="'terms' in entry.result">{{ entry.result.terms.length }}</b>
        <span
          v-else
          class="status"
          :class="`status--${sourceState(entry.result)}`"
        >!</span>
      </a>
    </nav>

    <template v-if="entries">
      <SourceResults
        v-for="(entry, index) in entries"
        :id="`source-${index}`"
        :key="entry.source.uri"
        :entry="entry"
        :q="q"
        :languages="languages"
        :genres="genres"
        :compact="compact"
        :selected-uri="selected?.term.uri"
        @select="onSelect"
      />
    </template>

    <p
      v-else-if="noSourceOfType"
      class="source__notice"
      role="status"
    >
      {{ t('search.noSourceOfType') }}
    </p>
    <template v-else-if="isFetching">
      <article
        v-for="uri in searched ?? datasets"
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
      v-else-if="error || data"
      class="source__notice source__notice--error"
      role="alert"
    >
      <ExclamationCircleIcon class="icon" />
      {{ t('api.Error') }}
    </p>

    <!-- minimaal: term detail, a side panel on desktop and inline below on phones -->
    <aside
      v-if="compact && selected"
      ref="detailEl"
      class="detail"
      role="dialog"
      aria-modal="false"
      :aria-label="t('search.detailTitle')"
      tabindex="-1"
      @keydown.esc.prevent="closeDetail"
    >
      <div class="detail__head">
        <h2>{{ t('search.detailTitle') }} · {{ t('search.inSource', {source: selected.source.alternateName || selected.source.name}) }}</h2>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          @click="closeDetail"
        >
          <XMarkIcon class="icon" />
          {{ t('search.closeDetail') }}
        </button>
      </div>
      <TermResult
        :term="selected.term"
        :source-uri="selected.source.uri"
      />
    </aside>
  </section>
</template>

<script lang="ts" setup>
import {computed, nextTick, onMounted, PropType, reactive, ref, watch} from 'vue';
import {useQuery} from 'villus';
import {useI18n} from 'vue-i18n';
import {ExclamationCircleIcon, XMarkIcon} from '@heroicons/vue/16/solid';
import {Source, TERMS_QUERY, Term, TermsQueryResult, sourceState} from '../query';
import {SOURCES_BY_GENRE_QUERY, isTypeGenre} from '../genres';
import SourceResults from './SourceResults.vue';
import SourceHeader from './SourceHeader.vue';
import TermResult from './TermResult.vue';
import state from '../store';
import {glideToTop} from '../scroll';

const props = defineProps({
  q: {type: String, default: ''},
  datasets: {type: Array as PropType<string[]>, default: () => []},
  /** Genre URIs: the chosen result types (a type is a genre) and subjects. */
  genres: {type: Array as PropType<string[]>, default: () => []},
  compact: {type: Boolean, default: false},
});

const {t, locale} = useI18n();
const languages = [...new Set([locale.value, 'nl', 'en'])];

// A type is asked for as a genre, in the two steps the API offers: `sources(genres:)` says which
// sources carry the chosen types, and only those of the chosen sources are searched; `terms(genres:)`
// then filters inside the sources that mix types.
const typeGenres = props.genres.filter(isTypeGenre);
const {data: typed, isFetching: isChoosing, error: choosingError} = useQuery<{sources: {uri: string}[]}>({
  query: SOURCES_BY_GENRE_QUERY,
  variables: {genres: typeGenres},
  skip: () => !props.q || props.datasets.length === 0 || typeGenres.length === 0,
});
/** The sources that are searched; null while the API still has to say which carry the chosen types. */
const searched = computed<string[] | null>(() => {
  if (typeGenres.length === 0) {
    return props.datasets;
  }
  const carrying = typed.value?.sources;
  return carrying ? props.datasets.filter(uri => carrying.some(source => source.uri === uri)) : null;
});

const {data, isFetching: isSearching, error: searchError} = useQuery<TermsQueryResult>({
  query: TERMS_QUERY,
  variables: computed(() => ({
    sources: searched.value ?? [],
    query: props.q,
    languages,
    ...(props.genres.length > 0 ? {genres: props.genres} : {}),
  })),
  context: {
    headers: reactive({'Accept-Language': locale}),
  },
  skip: () => !props.q || !searched.value || searched.value.length === 0,
});
const isFetching = computed(() => isChoosing.value || isSearching.value);
const error = computed(() => choosingError.value ?? searchError.value);
/** None of the chosen sources carries a chosen type, so there is nothing to search. */
const noSourceOfType = computed(() => searched.value?.length === 0);

watch(isFetching, (fetching) => {
  state.loading = fetching;
}, {immediate: true});

// After the visitor pressed search, the page glides to the results as soon as the section appears, and once more
// when the answer is in if the page was too short to get there. A search that was opened from a link stays at
// the top of the page: nobody asked to be moved.
const sectionEl = ref<HTMLElement | null>(null);
if (Date.now() - state.searchedAt < 3000) {
  state.searchedAt = 0;
  const glide = glideToTop(() => sectionEl.value);
  let arrived = false;
  onMounted(() => { arrived = glide(); });
  watch(isFetching, (fetching) => {
    if (!fetching && !arrived) {
      nextTick(glide);
    }
  });
}

// Response times feed the netwerk theme's source-status panel.
state.responseTimes = {};
watch(data, (newData) => {
  if (newData?.terms) {
    state.responseTimes = Object.fromEntries(newData.terms.map(entry => [entry.source.uri, entry.responseTimeMs]));
  }
});

// `terms` is null when the API rejects the request as a whole (e.g. an unknown source URI).
const entries = computed(() => data.value?.terms ?? null);
const totalTerms = computed(() =>
  entries.value?.reduce((sum, entry) => sum + ('terms' in entry.result ? entry.result.terms.length : 0), 0) ?? 0,
);
const sourcesWithTerms = computed(() =>
  entries.value?.filter(entry => 'terms' in entry.result && entry.result.terms.length > 0).length ?? 0,
);

const pendingSource = (uri: string): Source =>
  state.sources.find(source => source.uri === uri)
  ?? {__typename: 'Source', uri, name: uri.replace(/^https?:\/\//, ''), alternateName: '', description: '', features: [], genres: []};

function jumpTo(index: number) {
  document.getElementById(`source-${index}`)?.scrollIntoView({block: 'start'});
}

// Detail panel (minimaal)
const selected = ref<{term: Term, source: Source} | null>(null);
const detailEl = ref<HTMLElement | null>(null);
let opener: HTMLElement | null = null;

function onSelect(payload: {term: Term, source: Source}) {
  opener = document.activeElement as HTMLElement | null;
  selected.value = payload;
  nextTick(() => {
    const el = detailEl.value;
    if (!el) {
      return;
    }
    if (window.matchMedia('(min-width: 64em)').matches) {
      el.focus({preventScroll: true});
    } else {
      el.scrollIntoView({block: 'start'});
      el.focus({preventScroll: true});
    }
  });
}

function closeDetail() {
  selected.value = null;
  opener?.focus();
  opener = null;
}
</script>
