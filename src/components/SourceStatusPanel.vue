<template>
  <aside
    class="status-panel"
    :aria-label="t('search.sourceStatus')"
  >
    <div class="status-panel__head">
      <h2>{{ t('search.sourceStatus') }}</h2>
      <span
        v-if="sources.length > 0"
        class="status-panel__summary"
      >{{ t('search.sourcesAvailable', {n: availableCount, total: sources.length}) }}</span>
    </div>
    <div class="status-panel__legend">
      <span><i class="dot" /> {{ t('termSources.statusAvailable') }}</span>
      <span><i class="dot dot--off" /> {{ t('termSources.statusUnavailable') }}</span>
      <span><i class="dot dot--unknown" /> {{ t('search.statusUnknown') }}</span>
    </div>
    <ul
      v-if="sources.length > 0"
      class="status-panel__list"
    >
      <li
        v-for="source in ordered"
        :key="source.uri"
        class="status-panel__row"
        :class="{'is-searched': source.uri in state.responseTimes}"
      >
        <i
          class="dot"
          :class="dotClass(source)"
          :title="statusLabel(source)"
        /><span class="sr-only">{{ statusLabel(source) }}:</span>
        <span
          class="status-panel__name"
          :title="source.name"
        >{{ source.alternateName || source.name }}<small v-if="holderName(source)">{{ holderName(source) }}</small></span>
        <span
          v-if="source.uri in state.responseTimes"
          class="status-panel__time"
          :aria-label="t('search.responseTime_')"
        >{{ state.responseTimes[source.uri] }} ms</span>
      </li>
    </ul>
    <p
      v-else
      class="status-panel__empty"
    >
      {{ t('search.stateSearching') }}
    </p>
    <p
      v-if="sources.length > 0 && Object.keys(state.responseTimes).length === 0"
      class="status-panel__empty"
    >
      {{ t('search.noSearchYet') }}
    </p>
  </aside>
</template>

<script lang="ts" setup>
import {computed, reactive, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import state from '../store';
import {SOURCES_QUERY, Source, holderName} from '../query';

const {t, locale} = useI18n();

// Same query as the picker: villus dedupes and caches it per locale.
const {data} = useQuery<{sources: Source[]}>({
  query: SOURCES_QUERY,
  variables: reactive({locale}),
  context: {headers: reactive({'Accept-Language': locale})},
});
watch(data, (newData) => {
  if (newData?.sources) {
    state.sources = newData.sources;
  }
}, {immediate: true});

const sources = computed(() => state.sources);
const availableCount = computed(() => sources.value.filter(source => source.status?.isAvailable).length);
const ordered = computed(() => {
  const searched = (source: Source) => source.uri in state.responseTimes ? 0 : 1;
  return [...sources.value].sort((a, b) =>
    searched(a) - searched(b) || a.name.localeCompare(b.name, locale.value),
  );
});

const dotClass = (source: Source) => {
  if (!source.status) {
    return 'dot--unknown';
  }
  return source.status.isAvailable ? '' : 'dot--off';
};
const statusLabel = (source: Source) => {
  if (!source.status) {
    return t('search.statusUnknown');
  }
  return source.status.isAvailable ? t('termSources.statusAvailable') : t('termSources.statusUnavailable');
};
</script>
