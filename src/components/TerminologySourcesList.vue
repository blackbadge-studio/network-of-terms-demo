<template>
  <div class="sources">
    <aside class="sources__filters">
      <h2>{{ t('termSources.filterTitle') }}</h2>
      <div
        class="chip-row"
        role="group"
        :aria-label="t('termSources.filterTitle')"
      >
        <label
          v-for="genre in genres"
          :key="genre.uri"
          class="chip chip-toggle"
        >
          <input
            v-model="selectedGenres"
            :value="genre.uri"
            type="checkbox"
            name="genres"
          >
          {{ genre.name }}
        </label>
      </div>
      <button
        v-if="selectedGenres.length > 0"
        type="button"
        class="link-btn"
        style="justify-self: start; font-size: var(--fs-sm)"
        @click="selectedGenres = []"
      >
        {{ t('termSources.clearFilter') }}
      </button>
    </aside>

    <div class="sources__main">
      <div class="sources__bar">
        <p
          class="sources__count"
          aria-live="polite"
        >
          {{ t('termSources.matchingSources', terminologySources.length) }}
        </p>
        <router-link
          :to="{name: 'home', query: {datasets: terminologySourceUris}}"
          class="btn btn--primary"
        >
          {{ t('termSources.search') }}
          <ArrowRightIcon class="icon" />
        </router-link>
      </div>

      <div class="sources__list">
        <article
          v-for="source in terminologySources"
          :id="anchorId(source)"
          :key="source.uri"
          class="source-card"
        >
          <header class="source-card__head">
            <h3 class="source-card__title">
              {{ source.name }}
              <small v-if="source.alternateName">({{ source.alternateName }})</small>
            </h3>
            <span
              v-if="holderName(source)"
              class="source-card__holder"
            >{{ holderName(source) }}</span>
            <span
              v-if="source.status"
              class="status source-card__status"
              :class="source.status.isAvailable ? 'status--ok' : 'status--error'"
              :title="t('termSources.lastChecked') + ': ' + formatDate(source.status.lastChecked)"
            >
              {{ source.status.isAvailable ? t('termSources.statusAvailable') : t('termSources.statusUnavailable') }}
            </span>
            <span
              v-else
              class="status status--none source-card__status"
            >
              {{ t('search.statusUnknown') }}
            </span>
          </header>

          <p
            v-if="source.description"
            class="source-card__desc"
          >
            {{ source.description }}
          </p>

          <dl class="meta">
            <dt>{{ t('termSources.availableInLanguages') }}</dt>
            <dd class="chip-row">
              <span
                v-for="language in source.inLanguage"
                :key="language"
                class="chip chip--tag chip--lang"
              >{{ language }}</span>
            </dd>

            <dt>{{ t('termSources.genres') }}</dt>
            <dd class="chip-row">
              <span
                v-for="genre in sortedGenres(source)"
                :key="genre.uri"
                class="chip chip--tag"
              >{{ genre.name }}</span>
            </dd>

            <dt>{{ t('termSources.uri') }}</dt>
            <dd class="meta__uri">
              <code :title="source.uri">{{ source.uri }}</code>
              <CopyButton :text="source.uri" />
            </dd>
          </dl>

          <div class="source-card__foot">
            <router-link
              :to="{name: 'home', query: {datasets: source.uri}}"
              class="btn btn--secondary btn--sm"
            >
              <MagnifyingGlassIcon class="icon" />
              {{ t('search.buttonSearch') }}
            </router-link>
            <router-link
              v-if="source.features?.some(feature => feature.type === 'HIERARCHY')"
              :to="{name: 'browse', query: {bron: source.uri}}"
              class="btn btn--secondary btn--sm"
            >
              {{ t('browse.navLabel') }}
            </router-link>
            <a
              v-if="source.mainEntityOfPage"
              :href="source.mainEntityOfPage"
              target="_blank"
              rel="noopener"
              class="btn btn--ghost btn--sm"
            >
              {{ t('search.viewAtSource') }}
              <ArrowTopRightOnSquareIcon class="icon" />
            </a>
          </div>
        </article>

        <p
          v-if="terminologySources.length === 0"
          class="empty"
        >
          {{ t('termSources.matchingSources', 0) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {SOURCES_QUERY, Source, holderName} from '../query';
import {ArrowRightIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon} from '@heroicons/vue/16/solid';
import CopyButton from './CopyButton.vue';

const {t, locale} = useI18n();
const variables = reactive({locale}); // Cache per locale and re-fetch when locale changes.
const headers = reactive({'Accept-Language': locale});
const {data} = await useQuery<{sources: Source[]}>({
  query: SOURCES_QUERY,
  context: {headers},
  variables,
});

const sources = computed<Source[]>(() =>
  [...(data.value?.sources ?? [])].sort((a, b) => a.name.localeCompare(b.name, locale.value)),
);

const selectedGenres = ref([] as string[]);
const genres = computed(() => {
  const map = new Map<string, string>();
  for (const source of sources.value) {
    source.genres.forEach(genre => map.set(genre.uri, genre.name));
  }
  return [...map].map(([uri, name]) => ({uri, name})).sort((a, b) => a.name.localeCompare(b.name, locale.value));
});

const terminologySources = computed(() => {
  if (selectedGenres.value.length === 0) {
    return sources.value;
  }
  return sources.value.filter(source => source.genres.some(genre => selectedGenres.value.includes(genre.uri)));
});
const terminologySourceUris = computed(() => terminologySources.value.map(source => source.uri).join(','));

const sortedGenres = (source: Source) => [...source.genres].sort((a, b) => a.name.localeCompare(b.name, locale.value));
const formatDate = (isoDate: string) => new Date(isoDate).toLocaleString(locale.value);
const anchorId = (source: Source) => 'source-' + source.uri.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
</script>
