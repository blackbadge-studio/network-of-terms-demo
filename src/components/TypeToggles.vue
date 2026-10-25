<template>
  <div
    class="chip-row"
    role="group"
    :aria-label="t('search.typesLabel')"
    :title="t('search.typesNotLive')"
  >
    <label class="chip chip-toggle">
      <input
        type="checkbox"
        :checked="state.selectedTypes.length === 0"
        @change="state.selectedTypes = []"
      >
      {{ t('search.typeAll') }}
    </label>
    <label
      v-for="type in TYPES"
      :key="type"
      class="chip chip-toggle"
    >
      <input
        v-model="state.selectedTypes"
        type="checkbox"
        :value="type"
      >
      {{ t(`types.${type}_pl`) }}
    </label>
    <span class="sr-only">{{ t('search.typesNotLive') }}</span>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import state from '../store';

// Mirrors the API's upcoming Term.resultType values; the filter is kept in the
// store so it can be sent as `terms(types:)` once that argument is live.
const TYPES = ['CONCEPT', 'PERSON', 'ORGANIZATION', 'PLACE', 'EVENT'];
const {t} = useI18n();
</script>
