<template>
  <section
    v-if="uri"
    class="results"
    aria-live="polite"
    :aria-busy="isFetching"
  >
    <template v-if="entry && entry.source.__typename === 'Source'">
      <article class="source">
        <SourceHeader
          :source="entry.source"
          :state="state"
          :count="1"
          :response-time-ms="entry.responseTimeMs"
          :retrying="isFetching"
          @retry="retry"
        />
        <div
          v-if="state === 'ok'"
          class="term-list"
        >
          <TermResult :term="entry.result" />
        </div>
        <p
          v-else
          class="source__notice"
          :class="{'source__notice--timeout': state === 'timeout', 'source__notice--error': state === 'error'}"
          role="status"
        >
          <ExclamationTriangleIcon
            v-if="state !== 'none'"
            class="icon"
          />
          {{ t('api.' + entry.result.__typename, t('api.Error')) }}
        </p>
      </article>
    </template>

    <template v-else-if="isFetching">
      <article class="source">
        <div class="skeleton skeleton--line" />
        <div class="skeleton skeleton--block" />
      </article>
    </template>

    <p
      v-else-if="data"
      class="empty"
    >
      {{ t('search.sourceNotFound') }}
    </p>
  </section>
</template>

<script lang="ts" setup>
import {computed, reactive} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {ExclamationTriangleIcon} from '@heroicons/vue/16/solid';
import {LookupQuery, TERM_FIELDS, sourceState} from '../query';
import TermResult from './TermResult.vue';
import SourceHeader from './SourceHeader.vue';
import state_ from '../store';
import {watch} from 'vue';

const props = defineProps({
  uri: {type: String, default: ''},
});

const {t, locale} = useI18n();

const {data, isFetching, execute} = useQuery<LookupQuery>({
  query: `query ($uris: [ID]!, $languages: [Language]!) {
    lookup (uris: $uris, languages: $languages) {
      source {
        __typename
        ... on Source {
          name
          uri
          alternateName
          creators { name alternateName }
        }
      }
      result {
        __typename
        ... on TranslatedTerm { ${TERM_FIELDS} }
      }
      responseTimeMs
    }
  }`,
  variables: {
    uris: [props.uri],
    languages: [...new Set([locale.value, 'nl', 'en'])],
  },
  context: {
    headers: reactive({'Accept-Language': locale}),
  },
  skip: () => !props.uri,
});

watch(isFetching, (fetching) => {
  state_.loading = fetching;
}, {immediate: true});

const entry = computed(() => data.value?.lookup?.[0] ?? null);
const state = computed(() => {
  if (isFetching.value) {
    return 'loading';
  }
  const result = entry.value?.result;
  if (!result) {
    return 'loading';
  }
  return result.__typename === 'TranslatedTerm' ? 'ok' : sourceState(result as never);
});

const retry = () => execute({cachePolicy: 'network-only'});
</script>
