<template>
  <article
    class="source"
    :aria-busy="isFetching"
  >
    <SourceHeader
      :source="entry.source"
      :state="state"
      :count="terms.length"
      :response-time-ms="current.responseTimeMs"
      :retrying="isFetching"
      @retry="retry"
    />

    <div
      v-if="state === 'ok'"
      class="term-list"
    >
      <TermResult
        v-for="term in terms"
        :key="term.uri"
        :term="term"
      />
    </div>

    <p
      v-else-if="state === 'none'"
      class="source__notice"
    >
      {{ t('search.termsFound', 0) }}
    </p>

    <div
      v-else-if="state === 'loading'"
      class="term-list"
    >
      <div class="skeleton skeleton--block" />
    </div>

    <p
      v-else
      class="source__notice"
      :class="state === 'timeout' ? 'source__notice--timeout' : 'source__notice--error'"
      role="status"
    >
      <ExclamationTriangleIcon class="icon" />
      <span>{{ t('api.' + errorType, t('api.Error')) }}</span>
      <router-link :to="{name: 'faq1', hash: `#${errorType}`}">
        {{ t('search.whyError') }}
      </router-link>
    </p>
  </article>
</template>

<script lang="ts" setup>
import {computed, PropType, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {ExclamationTriangleIcon} from '@heroicons/vue/16/solid';
import {TERMS_QUERY, TermsEntry, TermsQueryResult, sourceState} from '../query';
import SourceHeader from './SourceHeader.vue';
import TermResult from './TermResult.vue';

const props = defineProps({
  entry: {type: Object as PropType<TermsEntry>, required: true},
  q: {type: String, required: true},
  languages: {type: Array as PropType<string[]>, required: true},
  genres: {type: Array as PropType<string[]>, default: () => []},
});

const {t, locale} = useI18n();

// A retry re-queries this one source and replaces the entry that came with the full search.
const override = ref<TermsEntry | null>(null);
const {execute, isFetching} = useQuery<TermsQueryResult>({
  query: TERMS_QUERY,
  variables: {
    sources: [props.entry.source.uri],
    query: props.q,
    languages: props.languages,
    ...(props.genres.length > 0 ? {genres: props.genres} : {}),
  },
  context: {headers: reactive({'Accept-Language': locale})},
  cachePolicy: 'network-only',
  fetchOnMount: false,
});

async function retry() {
  const {data} = await execute();
  if (data?.terms?.[0]) {
    override.value = data.terms[0];
  }
}

const current = computed(() => override.value ?? props.entry);
const state = computed(() => isFetching.value ? 'loading' : sourceState(current.value.result));
const terms = computed(() => 'terms' in current.value.result ? current.value.result.terms : []);
const errorType = computed(() => 'terms' in current.value.result ? 'Error' : current.value.result.__typename);
</script>
