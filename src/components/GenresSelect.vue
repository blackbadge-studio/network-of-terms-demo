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

const {t, locale} = useI18n();

const availableGenres = computed(() => {
  const selectedSources = state.sources.filter(source =>
    state.selectedDatasets.includes(source.uri),
  );
  const genreSourcesWithFeature = selectedSources.filter(source =>
    source.features.some(f => f.type === 'GENRE_FILTER'),
  );
  const genreMap = new Map<string, Genre>();
  for (const source of genreSourcesWithFeature) {
    for (const genre of source.genres) {
      if (!genreMap.has(genre.uri)) {
        genreMap.set(genre.uri, genre);
      }
    }
  }
  return [...genreMap.values()].sort((a, b) => a.name.localeCompare(b.name, locale.value));
});

// Prune selections that are no longer available.
watch(availableGenres, (genres) => {
  const availableUris = new Set(genres.map(g => g.uri));
  state.selectedGenres = state.selectedGenres.filter(uri => availableUris.has(uri));
});
</script>
