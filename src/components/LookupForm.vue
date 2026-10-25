<template>
  <TheHome active="lookup">
    <form
      id="lookup"
      role="tabpanel"
      aria-labelledby="tab-lookup"
      novalidate
      @submit.prevent="onSubmit"
    >
      <div class="lookup-grid">
        <div class="search-row">
          <div class="field">
            <label
              for="uri"
              class="field__label"
            >{{ t('search.labelUri') }}</label>
            <input
              id="uri"
              ref="uriInput"
              v-model="uri"
              type="url"
              class="input"
              name="uri"
              autocomplete="off"
              spellcheck="false"
              inputmode="url"
              :placeholder="t('search.placeholderUri')"
              :aria-invalid="uriError || undefined"
              aria-describedby="uriHelp"
              required
            >
          </div>
          <button
            class="btn btn--primary btn--lg"
            type="submit"
          >
            <MagnifyingGlassIcon class="icon" />
            {{ t('search.buttonLookup') }}
            <span
              v-if="state.loading"
              class="dots"
              role="status"
              :aria-label="t('search.stateSearching')"
            ><i /><i /><i /></span>
          </button>
        </div>
        <div
          id="uriHelp"
          class="examples"
        >
          <span>{{ t('search.helpUri') }}:</span>
          <button
            v-for="example in examples"
            :key="example.uri"
            type="button"
            class="chip"
            @click="uri = example.uri"
          >
            {{ example.label }}
          </button>
        </div>
      </div>
    </form>
  </TheHome>

  <div class="container">
    <LookupResult :uri="submittedUri" />
  </div>
</template>

<script lang="ts" setup>
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {MagnifyingGlassIcon} from '@heroicons/vue/16/solid';
import state from '../store';
import LookupResult from './LookupResult.vue';
import TheHome from './TheHome.vue';

const {t, tm} = useI18n();
const router = useRouter();
const route = useRoute();

const submittedUri = (route.query.uri as string) ?? '';
const uri = ref(submittedUri);
const uriInput = ref<HTMLInputElement | null>(null);
const uriError = ref(false);
const examples = computed(() => tm('search.examplesUri') as {uri: string, label: string}[]);

function onSubmit() {
  uriError.value = !uri.value.trim();
  if (uriError.value) {
    uriInput.value?.focus();
    return;
  }
  state.loading = true;
  router.replace({name: 'lookup', query: {uri: uri.value.trim()}});
}
</script>

<style scoped>
.lookup-grid {
  display: grid;
  gap: var(--s-4);
}
</style>
