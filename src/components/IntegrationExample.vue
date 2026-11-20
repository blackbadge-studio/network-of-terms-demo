<template>
  <div class="example">
    <pre class="example__code"><code>{{ code }}</code></pre>
    <div class="example__bar">
      <button
        v-if="runnable"
        type="button"
        class="btn btn--primary btn--sm"
        :disabled="running"
        @click="run"
      >
        <PlayIcon class="icon" />
        {{ running ? t('integration.running') : t('integration.run') }}
      </button>
      <CopyButton
        :text="code"
        label="integration.copy"
      />
      <span
        v-if="ms !== null"
        class="field__hint"
      >{{ t('integration.response', {ms}) }}</span>
    </div>
    <p
      v-if="error"
      class="field__error"
      role="alert"
    >
      {{ t('integration.failed') }} ({{ error }})
    </p>
    <pre
      v-if="response"
      class="example__response"
      tabindex="0"
      :aria-label="t('integration.responseLabel')"
    ><code>{{ response }}</code></pre>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {PlayIcon} from '@heroicons/vue/16/solid';
import CopyButton from './CopyButton.vue';

// An example from the integration guide: the query as text, and a button that sends it to this site's API and
// shows the answer as it came back.
const props = defineProps({
  code: {type: String, required: true},
  runnable: {type: Boolean, default: false},
});

const {t} = useI18n();
const running = ref(false);
const response = ref('');
const error = ref('');
const ms = ref<number | null>(null);

async function run() {
  running.value = true;
  error.value = '';
  const started = performance.now();
  try {
    const answer = await fetch(import.meta.env.VITE_GRAPHQL_URL as string, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify({query: props.code}),
    });
    response.value = JSON.stringify(await answer.json(), null, 2);
    ms.value = Math.round(performance.now() - started);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : String(reason);
  } finally {
    running.value = false;
  }
}
</script>
