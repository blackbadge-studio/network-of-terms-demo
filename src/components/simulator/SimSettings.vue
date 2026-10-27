<template>
  <form
    class="sim-settings"
    @submit.prevent
  >
    <fieldset :disabled="disabled">
      <div class="field">
        <span class="field__label">{{ t('simulator.workload') }}</span>
        <div
          class="chip-row"
          role="radiogroup"
          :aria-label="t('simulator.workload')"
        >
          <label
            v-for="workload in workloads"
            :key="workload"
            class="chip chip-toggle"
          >
            <input
              type="radio"
              name="sim-workload"
              :value="workload"
              :checked="model.workload === workload"
              @change="update('workload', workload)"
            >
            {{ t(`simulator.workloads.${workload}`) }}
          </label>
        </div>
        <label
          v-if="model.workload === 'mixed'"
          class="field sim-settings__range"
        >
          <span class="field__hint">{{ t('simulator.mixRatio') }}: <b>{{ model.mixRatio }}%</b></span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            :value="model.mixRatio"
            @input="update('mixRatio', Number(($event.target as HTMLInputElement).value))"
          >
        </label>
      </div>

      <template v-if="model.workload !== 'lookup'">
        <div class="field">
          <span class="field__label">{{ t('simulator.presets') }}</span>
          <div class="chip-row">
            <button
              v-for="preset in presetIds"
              :key="preset"
              type="button"
              class="chip"
              @click="applyPreset(preset)"
            >
              {{ t(`simulator.preset.${preset}`) }}
            </button>
          </div>
        </div>

        <div class="field">
          <label
            for="sim-terms"
            class="field__label"
          >{{ t('simulator.terms') }} <small class="field__count">({{ model.terms.length }})</small></label>
          <textarea
            id="sim-terms"
            class="input sim-settings__terms"
            rows="6"
            spellcheck="false"
            :value="model.terms.join('\n')"
            @input="update('terms', splitLines(($event.target as HTMLTextAreaElement).value))"
          />
          <p class="field__hint">
            {{ t('simulator.termsHint') }}
          </p>
        </div>
      </template>

      <template v-if="model.workload !== 'search'">
        <div class="field">
          <span class="field__label">{{ t('simulator.uriPresets') }}</span>
          <div class="chip-row">
            <button
              v-for="preset in uriPresetIds"
              :key="preset"
              type="button"
              class="chip"
              @click="update('uris', [...URI_PRESETS[preset]])"
            >
              {{ t(`simulator.uriPreset.${preset}`) }}
            </button>
          </div>
        </div>
        <div class="field">
          <label
            for="sim-uris"
            class="field__label"
          >{{ t('simulator.uris') }} <small class="field__count">({{ model.uris.length }})</small></label>
          <textarea
            id="sim-uris"
            class="input sim-settings__terms"
            rows="6"
            spellcheck="false"
            :value="model.uris.join('\n')"
            @input="update('uris', splitLines(($event.target as HTMLTextAreaElement).value))"
          />
          <p class="field__hint">
            {{ t('simulator.urisHint') }}
          </p>
        </div>
      </template>

      <div
        v-if="model.workload !== 'lookup'"
        class="field"
      >
        <label
          for="datasets"
          class="field__label"
        >{{ t('simulator.sources') }}</label>
        <SourcePicker
          :model-value="model.sources"
          @update:model-value="update('sources', $event)"
        />
      </div>

      <div
        v-if="model.workload !== 'lookup'"
        class="field"
      >
        <span class="field__label">{{ t('simulator.types') }}</span>
        <div
          class="chip-row"
          role="group"
          :aria-label="t('simulator.types')"
        >
          <label
            v-for="type in RESULT_TYPES"
            :key="type"
            class="chip chip-toggle"
          >
            <input
              type="checkbox"
              :checked="model.types.includes(type)"
              @change="toggleType(type)"
            >
            {{ t(`types.${type}_pl`) }}
          </label>
        </div>
        <p class="field__hint">
          {{ t('simulator.typesHint') }}
        </p>
      </div>

      <div class="field">
        <span class="field__label">{{ t('simulator.lang') }}</span>
        <div
          class="chip-row"
          role="radiogroup"
          :aria-label="t('simulator.lang')"
        >
          <label
            v-for="lang in ['nl', 'en']"
            :key="lang"
            class="chip chip-toggle"
          >
            <input
              type="radio"
              name="sim-lang"
              :value="lang"
              :checked="model.lang === lang"
              @change="update('lang', lang as 'nl' | 'en')"
            >
            {{ lang.toUpperCase() }}
          </label>
        </div>
      </div>

      <div class="field">
        <span class="field__label">{{ t('simulator.tempo') }}</span>
        <div
          class="sim-settings__tempo"
          role="radiogroup"
          :aria-label="t('simulator.tempo')"
        >
          <label
            v-for="id in tempoIds"
            :key="id"
            class="sim-settings__tempo-option"
            :class="{'is-active': model.tempoId === id}"
          >
            <input
              type="radio"
              name="sim-tempo"
              :value="id"
              :checked="model.tempoId === id"
              @change="setTempo(id)"
            >
            <b>{{ t(`simulator.tempoPreset.${id}`) }}</b>
            <small>{{ t(`simulator.tempoDesc.${id}`) }}</small>
          </label>
        </div>
        <div
          v-if="model.tempoId === 'custom'"
          class="sim-settings__grid"
        >
          <label class="field">
            <span class="field__hint">{{ t('simulator.intervalMs') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="0"
              max="60000"
              step="100"
              :value="model.tempo.intervalMs"
              @change="updateTempo('intervalMs', num($event, 0, 60000))"
            >
          </label>
          <label class="field">
            <span class="field__hint">{{ t('simulator.concurrency') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="1"
              max="16"
              :value="model.tempo.concurrency"
              @change="updateTempo('concurrency', num($event, 1, 16))"
            >
          </label>
          <label class="field">
            <span class="field__hint">{{ t('simulator.jitterMs') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="0"
              max="10000"
              step="100"
              :value="model.tempo.jitterMs"
              @change="updateTempo('jitterMs', num($event, 0, 10000))"
            >
          </label>
        </div>
      </div>

      <div class="field">
        <span class="field__label">{{ t('simulator.size') }}</span>
        <div
          class="chip-row"
          role="radiogroup"
          :aria-label="t('simulator.size')"
        >
          <label class="chip chip-toggle">
            <input
              type="radio"
              name="sim-size"
              value="count"
              :checked="model.sizeMode === 'count'"
              @change="update('sizeMode', 'count')"
            >
            {{ t('simulator.sizeCount') }}
          </label>
          <label class="chip chip-toggle">
            <input
              type="radio"
              name="sim-size"
              value="duration"
              :checked="model.sizeMode === 'duration'"
              @change="update('sizeMode', 'duration')"
            >
            {{ t('simulator.sizeDuration') }}
          </label>
        </div>
        <div class="sim-settings__grid">
          <label
            v-if="model.sizeMode === 'count'"
            class="field"
          >
            <span class="field__hint">{{ t('simulator.sizeCount') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="10"
              max="500"
              step="10"
              :value="model.count"
              @change="update('count', num($event, 10, 500))"
            >
          </label>
          <label
            v-else
            class="field"
          >
            <span class="field__hint">{{ t('simulator.sizeDuration') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="1"
              max="60"
              :value="model.minutes"
              @change="update('minutes', num($event, 1, 60))"
            >
          </label>
          <label class="field">
            <span class="field__hint">{{ t('simulator.limit') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="1"
              max="100"
              :value="model.limit"
              @change="update('limit', num($event, 1, 100))"
            >
          </label>
          <label class="field">
            <span class="field__hint">{{ t('simulator.timeoutMs') }}</span>
            <input
              type="number"
              class="input input--sm"
              min="500"
              max="60000"
              step="500"
              :value="model.timeoutMs"
              @change="update('timeoutMs', num($event, 500, 60000))"
            >
          </label>
        </div>
        <label class="sim-settings__switch">
          <input
            type="checkbox"
            :checked="model.stopOnError"
            @change="update('stopOnError', ($event.target as HTMLInputElement).checked)"
          >
          {{ t('simulator.stopOnError') }}
        </label>
      </div>

      <div class="sim-settings__actions">
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          @click="surprise"
        >
          <SparklesIcon class="icon" />
          {{ t('simulator.surprise') }}
        </button>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          @click="$emit('update:modelValue', {...DEFAULT_SETTINGS, sources: allSourceUris, tempo: {...DEFAULT_SETTINGS.tempo}})"
        >
          <ArrowUturnLeftIcon class="icon" />
          {{ t('simulator.reset') }}
        </button>
      </div>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowUturnLeftIcon, SparklesIcon} from '@heroicons/vue/16/solid';
import SourcePicker from '../SourcePicker.vue';
import state from '../../store';
import {DEFAULT_SETTINGS, RESULT_TYPES, SimSettings, TEMPO_PRESETS, TERM_PRESETS, Tempo, TempoId, TermPresetId, URI_PRESETS, UriPresetId, Workload} from '../../simulator/types';

const props = defineProps({
  modelValue: {type: Object as PropType<SimSettings>, required: true},
  disabled: {type: Boolean, default: false},
});
const emit = defineEmits<{'update:modelValue': [value: SimSettings]}>();

const {t} = useI18n();
const model = computed(() => props.modelValue);
const presetIds: TermPresetId[] = ['vlaams', 'personen', 'plaatsen', 'materialen', 'catalogus'];
const uriPresetIds: UriPresetId[] = ['gemengd', 'wikidata', 'vlaams'];
const tempoIds: TempoId[] = ['rustig', 'normaal', 'snel', 'stress', 'custom'];
const workloads: Workload[] = ['search', 'lookup', 'mixed'];
const allSourceUris = computed(() => state.sources.map(source => source.uri));

function update<K extends keyof SimSettings>(key: K, value: SimSettings[K]) {
  emit('update:modelValue', {...props.modelValue, [key]: value});
}
function updateTempo(key: keyof Tempo, value: number) {
  emit('update:modelValue', {...props.modelValue, tempoId: 'custom', tempo: {...props.modelValue.tempo, [key]: value}});
}
function setTempo(id: TempoId) {
  const tempo = id === 'custom' ? {...props.modelValue.tempo} : {...TEMPO_PRESETS[id]};
  emit('update:modelValue', {...props.modelValue, tempoId: id, tempo});
}
const splitLines = (text: string) => text.split('\n').map(line => line.trim()).filter(Boolean);
const num = (event: Event, min: number, max: number) => {
  const value = Number((event.target as HTMLInputElement).value);
  return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
};
function toggleType(type: string) {
  const types = props.modelValue.types.includes(type)
    ? props.modelValue.types.filter(item => item !== type)
    : [...props.modelValue.types, type];
  update('types', types);
}

const sample = <T, >(items: T[], n: number): T[] => {
  const pool = [...items];
  const picked: T[] = [];
  while (pool.length > 0 && picked.length < n) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
};

/** "Random from catalogue": a draw from every preset plus the subject names of the loaded sources. */
function catalogueTerms(): string[] {
  const genres = state.sources.flatMap(source => source.genres.map(genre => genre.name));
  const pool = [...new Set([...Object.values(TERM_PRESETS).flat(), ...genres])];
  return sample(pool, 15);
}

function applyPreset(preset: TermPresetId) {
  update('terms', preset === 'catalogus' ? catalogueTerms() : [...TERM_PRESETS[preset]]);
}

function surprise() {
  const preset = presetIds[Math.floor(Math.random() * presetIds.length)];
  const tempoId = (['rustig', 'normaal', 'snel'] as TempoId[])[Math.floor(Math.random() * 3)];
  const types = Math.random() < 0.5 ? [] : sample([...RESULT_TYPES], 1 + Math.floor(Math.random() * 2));
  const sources = allSourceUris.value.length > 0 ? sample(allSourceUris.value, 1 + Math.floor(Math.random() * Math.min(5, allSourceUris.value.length))) : props.modelValue.sources;
  const workload = workloads[Math.floor(Math.random() * workloads.length)];
  emit('update:modelValue', {
    ...props.modelValue,
    workload,
    terms: preset === 'catalogus' ? catalogueTerms() : [...TERM_PRESETS[preset]],
    uris: [...URI_PRESETS[uriPresetIds[Math.floor(Math.random() * uriPresetIds.length)]]],
    mixRatio: [30, 50, 70][Math.floor(Math.random() * 3)],
    tempoId,
    tempo: {...TEMPO_PRESETS[tempoId as Exclude<TempoId, 'custom'>]},
    types,
    sources,
    lang: Math.random() < 0.8 ? 'nl' : 'en',
    sizeMode: 'count',
    count: [10, 20, 30, 50][Math.floor(Math.random() * 4)],
  });
}
</script>
