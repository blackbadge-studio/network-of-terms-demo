<template>
  <div
    class="seg"
    role="group"
    :aria-label="label"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="seg__btn"
      :aria-pressed="option.value === modelValue"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script lang="ts" setup generic="T extends string">
defineProps<{
  modelValue: T;
  label: string;
  options: readonly {value: T; label: string}[];
}>();
const emit = defineEmits<{'update:modelValue': [value: T]}>();
</script>

<style scoped>
.seg { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 2px; border: 1.5px solid var(--vtn-border-strong); border-radius: var(--r-input); background: var(--vtn-surface); max-width: 100%; }
.seg__btn { flex: 1 1 auto; min-height: 2.1rem; padding: 0.25rem 0.8rem; border: 0; border-radius: calc(var(--r-input) - 3px); background: transparent; color: var(--vtn-text-2); font-size: var(--fs-sm); font-weight: 600; white-space: nowrap; }
.seg__btn:hover { color: var(--vtn-text); background: var(--vtn-surface-2); }
.seg__btn[aria-pressed="true"] { background: var(--vtn-text); color: #fff; }
</style>
