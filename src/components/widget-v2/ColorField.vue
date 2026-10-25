<template>
  <div class="field">
    <label
      class="field__label"
      :for="`${id}-hex`"
    >{{ label }}</label>
    <div class="color">
      <input
        :id="`${id}-pick`"
        type="color"
        class="color__swatch"
        :aria-label="label"
        :value="valid ? modelValue : '#000000'"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
      <input
        :id="`${id}-hex`"
        v-model="text"
        type="text"
        class="input color__hex"
        spellcheck="false"
        autocomplete="off"
        :aria-invalid="!HEX.test(text.trim())"
        @input="onText"
      >
    </div>
    <p
      v-if="hint"
      class="field__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import {computed, ref, useId, watch} from 'vue';

const HEX = /^#[0-9a-f]{6}$/i;

const props = defineProps({
  modelValue: {type: String, required: true},
  label: {type: String, required: true},
  hint: {type: String, default: ''},
});
const emit = defineEmits<{'update:modelValue': [value: string]}>();

const id = useId();
const text = ref(props.modelValue);
const valid = computed(() => HEX.test(props.modelValue));

watch(() => props.modelValue, (value) => {
  if (value.toLowerCase() !== text.value.trim().toLowerCase()) {
    text.value = value;
  }
});

/** A typed colour counts once it is six hex digits; '#' is optional. */
function onText() {
  const typed = text.value.trim();
  const hex = typed.startsWith('#') ? typed : `#${typed}`;
  if (HEX.test(hex)) {
    emit('update:modelValue', hex.toLowerCase());
  }
}
</script>

<style scoped>
.color { display: flex; align-items: center; gap: var(--s-2); }
.color__swatch { width: 2.75rem; height: 2.75rem; padding: 0.2rem; border: 1.5px solid var(--vtn-border-strong); border-radius: var(--r-input); background: var(--vtn-surface); cursor: pointer; flex: none; }
.color__swatch::-webkit-color-swatch-wrapper { padding: 0; }
.color__swatch::-webkit-color-swatch { border: 0; border-radius: calc(var(--r-input) - 3px); }
.color__hex { min-height: 2.75rem; font-family: var(--vtn-mono); font-size: var(--fs-sm); text-transform: uppercase; padding-block: 0.5rem; }
</style>
