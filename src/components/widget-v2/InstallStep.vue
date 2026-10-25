<template>
  <div class="step">
    <p class="step__title">
      <span class="step__num">{{ number }}</span>
      {{ title }}
    </p>
    <p class="step__body">
      {{ body }}
    </p>
    <div class="code">
      <CopyButton
        :text="code"
        label="search.copyUri"
        class="code__copy"
      />
      <pre><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import CopyButton from '../CopyButton.vue';

defineProps({
  number: {type: Number, required: true},
  title: {type: String, required: true},
  body: {type: String, default: ''},
  code: {type: String, required: true},
});
</script>

<style scoped>
.step { display: grid; gap: var(--s-2); }
.step__title { display: flex; align-items: center; gap: var(--s-2); font-weight: 600; font-size: var(--fs-md); }
.step__num { display: inline-grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 50%; background: var(--vtn-mint-light); color: var(--vtn-primary-strong); font-size: var(--fs-xs); font-weight: 800; }
.step__body { font-size: var(--fs-sm); color: var(--vtn-text-2); max-width: var(--prose); }
.code { position: relative; background: var(--vtn-black); border-radius: var(--r-md); }
.code pre { margin: 0; padding: var(--s-4); padding-right: 9rem; overflow: auto; max-height: 24rem; color: #f3f4f6; font-size: var(--fs-sm); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }
.code code { font-size: inherit; }
.code__copy { position: absolute; top: var(--s-2); right: var(--s-2); }
@media (max-width: 40em) { .code pre { padding-right: var(--s-4); padding-top: 3.25rem; } }
</style>
