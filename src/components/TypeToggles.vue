<template>
  <div
    class="chip-row"
    role="group"
    :aria-label="t('search.typesLabel')"
  >
    <label class="chip chip-toggle">
      <input
        type="checkbox"
        :checked="selectedTypes.length === 0"
        @change="selectedTypes = []"
      >
      {{ t('search.typeAll') }}
    </label>
    <label
      v-for="type in RESULT_TYPES"
      :key="type"
      class="chip chip-toggle"
    >
      <input
        v-model="selectedTypes"
        type="checkbox"
        :value="type"
      >
      {{ t(`types.${type}_pl`) }}
    </label>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import state from '../store';
import {RESULT_TYPES, TYPE_GENRES, genresOfTypes, isTypeGenre} from '../genres';

const {t} = useI18n();

// A type is a genre: the choice lives among the selected genres and is sent to the API as `genres`.
const selectedTypes = computed<string[]>({
  get: () => RESULT_TYPES.filter(type => state.selectedGenres.includes(TYPE_GENRES[type])),
  set: (types) => {
    state.selectedGenres = [
      ...genresOfTypes(types),
      ...state.selectedGenres.filter(uri => !isTypeGenre(uri)),
    ];
  },
});
</script>
