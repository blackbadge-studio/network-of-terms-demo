<template>
  <TheHome active="search">
    <!-- minimaal: one large search field, quiet type row, sources on demand -->
    <form
      v-if="isMinimal"
      id="search"
      class="stage__form"
      novalidate
      @submit.prevent="onSubmit"
    >
      <label
        for="q"
        class="sr-only"
      >{{ t('search.labelQuery') }}</label>
      <div class="stage__search">
        <input
          id="q"
          ref="qInput"
          v-model="q"
          type="search"
          class="input"
          name="q"
          autocomplete="off"
          enterkeyhint="search"
          :placeholder="t('search.placeholderQuery')"
          :aria-invalid="qError || undefined"
          required
        >
        <button
          class="btn btn--primary stage__submit"
          type="submit"
          :aria-label="t('search.buttonSearch')"
        >
          <MagnifyingGlassIcon class="icon" />
        </button>
      </div>
      <div class="stage__row">
        <TypeToggles />
      </div>
      <div class="stage__links">
        <button
          type="button"
          class="link-btn"
          :aria-expanded="pickerOpen"
          aria-controls="stage-picker"
          @click="pickerOpen = !pickerOpen"
        >
          {{ pickerOpen ? t('search.hideSources') : t('search.chooseSources', {n: state.selectedDatasets.length}) }}
        </button>
        <router-link :to="{name: 'lookup'}">
          {{ t('search.tabLookup') }}
        </router-link>
      </div>
      <div
        v-if="pickerOpen || sourcesError"
        id="stage-picker"
        class="stage__picker"
      >
        <label
          for="datasets"
          class="sr-only"
        >{{ t('search.labelTermSources') }}</label>
        <SourcePicker
          :invalid="sourcesError"
          :auto-open="pickerOpen && !sourcesError"
        />
      </div>
      <p
        v-if="sourcesError"
        class="stage__error"
        role="alert"
      >
        {{ t('search.selectSourcesError') }}
      </p>
      <div
        v-if="showGenresFilter"
        class="stage__row"
      >
        <GenresSelect />
      </div>
    </form>

    <!-- helder, mint, netwerk: the search panel -->
    <form
      v-else
      id="search"
      role="tabpanel"
      aria-labelledby="tab-search"
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="panel__body-grid">
        <div class="search-row">
          <div class="field">
            <label
              for="q"
              class="field__label"
            >{{ t('search.labelQuery') }}</label>
            <input
              id="q"
              ref="qInput"
              v-model="q"
              type="search"
              class="input"
              name="q"
              autocomplete="off"
              enterkeyhint="search"
              :placeholder="t('search.placeholderQuery')"
              :aria-invalid="qError || undefined"
              required
            >
          </div>
          <button
            class="btn btn--primary btn--lg"
            type="submit"
          >
            <MagnifyingGlassIcon class="icon" />
            {{ t('search.buttonSearch') }}
            <span
              v-if="state.loading"
              class="dots"
              role="status"
              :aria-label="t('search.stateSearching')"
            ><i /><i /><i /></span>
          </button>
        </div>

        <div class="field">
          <label
            for="datasets"
            class="field__label"
          >{{ t('search.labelTermSources') }}</label>
          <SourcePicker
            :invalid="sourcesError"
            described-by="datasets-hint"
          />
          <p
            v-if="sourcesError"
            class="field__error"
            role="alert"
          >
            {{ t('search.selectSourcesError') }}
          </p>
          <p
            id="datasets-hint"
            class="field__hint"
          >
            {{ t('search.helpTermSources') }}
            <router-link :to="{name: 'sources'}">
              {{ t('search.termSourcesLink') }}
            </router-link>
          </p>
        </div>

        <div
          v-if="showGenresFilter"
          class="field"
        >
          <span
            id="genres-label"
            class="field__label"
          >{{ t('search.labelGenres') }}</span>
          <GenresSelect />
          <p class="field__hint">
            {{ t('search.placeholderGenres') }}
          </p>
        </div>
      </div>
    </form>
  </TheHome>

  <div class="container">
    <SearchResults
      :q="submitted.q"
      :datasets="submitted.datasets"
      :genres="submitted.genres"
      :compact="isMinimal"
    />
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import {computed, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {MagnifyingGlassIcon} from '@heroicons/vue/16/solid';
import state from '../store';
import {useTheme} from '../theme';
import TheHome from './TheHome.vue';
import SourcePicker from './SourcePicker.vue';
import GenresSelect from './GenresSelect.vue';
import TypeToggles from './TypeToggles.vue';
import SearchResults from './SearchResults.vue';

const {t} = useI18n();
const router = useRouter();
const route = useRoute();
const {isMinimal} = useTheme();

const q = ref((route.query.q as string) ?? '');
const qInput = ref<HTMLInputElement | null>(null);
const qError = ref(false);
const sourcesError = ref(false);
const pickerOpen = ref(false);

const fromUrl = route.query.datasets as string;
state.selectedDatasets = fromUrl ? fromUrl.split(',') : [];
const genresFromUrl = route.query.genres as string;
state.selectedGenres = genresFromUrl ? genresFromUrl.split(',') : [];
const typesFromUrl = route.query.types as string;
state.selectedTypes = typesFromUrl ? typesFromUrl.split(',') : [];

// What is searched for is what the URL says; the form only edits the next search.
const submitted = {
  q: (route.query.q as string) ?? '',
  datasets: [...state.selectedDatasets],
  genres: [...state.selectedGenres],
};

const showGenresFilter = computed(() =>
  state.sources.some(source =>
    state.selectedDatasets.includes(source.uri)
    && source.features.some(f => f.type === 'GENRE_FILTER'),
  ),
);

watch(showGenresFilter, (show) => {
  if (!show) {
    state.selectedGenres = [];
  }
});

watch(() => state.selectedDatasets.length, (length) => {
  if (length > 0) {
    sourcesError.value = false;
  }
});

function onSubmit() {
  qError.value = !q.value.trim();
  sourcesError.value = state.selectedDatasets.length === 0;
  if (qError.value) {
    qInput.value?.focus();
    return;
  }
  if (sourcesError.value) {
    pickerOpen.value = true;
    requestAnimationFrame(() => document.getElementById('datasets')?.focus());
    return;
  }
  state.loading = true;
  const query: Record<string, string> = {
    q: q.value.trim(),
    datasets: state.selectedDatasets.join(','),
  };
  if (state.selectedGenres.length > 0) {
    query.genres = state.selectedGenres.join(',');
  }
  if (state.selectedTypes.length > 0) {
    // Kept in the URL so the choice survives; not sent to the API until `types` is live.
    query.types = state.selectedTypes.join(',');
  }
  router.replace({name: 'home', query});
}
</script>

<style scoped>
.panel__body-grid {
  display: grid;
  gap: var(--s-5);
}
</style>
