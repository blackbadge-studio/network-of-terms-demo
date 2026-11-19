<template>
  <details class="sim-fold">
    <summary class="sim-fold__head">
      <ChevronDownIcon class="icon picker__chev" />
      <span class="sim-fold__label">{{ label }}</span>
      <span
        v-if="value"
        class="sim-fold__value"
      >{{ value }}</span>
    </summary>
    <div class="sim-fold__body">
      <slot />
    </div>
  </details>
</template>

<script lang="ts" setup>
import {ChevronDownIcon} from '@heroicons/vue/16/solid';

// One group of simulator settings: closed until asked for, with the current choice beside its name.
defineProps({
  label: {type: String, required: true},
  value: {type: String, default: ''},
});
</script>
