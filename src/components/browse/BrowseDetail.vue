<template>
  <aside
    class="browse__detail"
    :aria-label="t('search.detailTitle')"
    :aria-busy="isFetching"
  >
    <p
      v-if="!uri"
      class="empty"
    >
      {{ t('browse.detailEmpty') }}
    </p>
    <template v-else>
      <div
        v-if="isFetching && !term"
        class="term-list"
      >
        <div class="skeleton skeleton--line" />
        <div class="skeleton skeleton--block" />
      </div>
      <TermResult
        v-else-if="term"
        :term="term"
        :source-uri="sourceUri"
      />
      <p
        v-else
        class="source__notice"
        role="status"
      >
        {{ t('api.' + (errorType ?? 'Error'), t('api.Error')) }}
      </p>
    </template>
  </aside>
</template>

<script lang="ts" setup>
import {computed, reactive, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {LookupQuery, TERM_FIELDS} from '../../query';
import TermResult from '../TermResult.vue';

const props = defineProps({
  uri: {type: String, default: null},
  sourceUri: {type: String, default: null},
});

const {t, locale} = useI18n();
const variables = reactive({uris: [props.uri ?? ''], languages: [...new Set([locale.value, 'nl', 'en'])]});
watch(() => props.uri, (uri) => { variables.uris = [uri ?? '']; });

const {data, isFetching} = useQuery<LookupQuery>({
  query: `query BrowseDetail ($uris: [ID]!, $languages: [Language]!) {
    lookup (uris: $uris, languages: $languages) {
      source { __typename ... on Source { uri name } }
      result { __typename ... on TranslatedTerm { ${TERM_FIELDS} } }
      responseTimeMs
    }
  }`,
  variables,
  context: {headers: reactive({'Accept-Language': locale})},
  skip: () => !props.uri,
});

const entry = computed(() => data.value?.lookup?.[0] ?? null);
const term = computed(() => entry.value && entry.value.result.__typename === 'TranslatedTerm' && entry.value.result.uri === props.uri ? entry.value.result : null);
const errorType = computed(() => entry.value?.result.__typename);
</script>
