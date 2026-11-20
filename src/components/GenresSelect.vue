<template>
  <div
    class="chip-row"
    role="group"
    :aria-label="t('search.labelGenres')"
  >
    <label
      v-for="genre in availableGenres"
      :key="genre.uri"
      class="chip chip-toggle"
    >
      <input
        v-model="state.selectedGenres"
        type="checkbox"
        :value="genre.uri"
        name="genres"
      >
      {{ genre.name }}
    </label>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import state from '../store';
import {computed, watch} from 'vue';
import {Genre} from '../query';
import {isTypeGenre} from '../genres';

const {t, locale} = useI18n();

const availableGenres = computed(() => {
  const selectedSources = state.sources.filter(source =>
    state.selectedDatasets.includes(source.uri),
  );
  const genreSourcesWithFeature = selectedSources.filter(source =>
    source.features.some(f => f.type === 'GENRE_FILTER'),
  );
  // The subjects only: the genres that are result types have their own row (TypeToggles).
  const genreMap = new Map<string, Genre>();
  for (const source of genreSourcesWithFeature) {
    for (const genre of source.genres) {
      if (!isTypeGenre(genre.uri) && !genreMap.has(genre.uri)) {
        genreMap.set(genre.uri, genre);
      }
    }
  }
  return [...genreMap.values()].sort((a, b) => a.name.localeCompare(b.name, locale.value));
});

// Prune subject selections that are no longer available; the chosen types stay.
watch(availableGenres, (genres) => {
  const availableUris = new Set(genres.map(g => g.uri));
  state.selectedGenres = state.selectedGenres.filter(uri => isTypeGenre(uri) || availableUris.has(uri));
});
</script>
