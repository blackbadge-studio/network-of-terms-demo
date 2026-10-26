<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('simulator.title') }}
    </h1>
    <p class="page__lead">
      {{ t('simulator.lead') }}
    </p>

    <!-- gate: only when a key is configured at build time -->
    <form
      v-if="!unlocked"
      class="gate"
      @submit.prevent="tryUnlock"
    >
      <h2>{{ t('simulator.gateTitle') }}</h2>
      <p>{{ t('simulator.gateText') }}</p>
      <div class="field">
        <label
          for="sim-key"
          class="field__label"
        >{{ t('simulator.gateLabel') }}</label>
        <input
          id="sim-key"
          v-model="keyInput"
          type="password"
          class="input"
          autocomplete="off"
          :aria-invalid="keyError || undefined"
        >
        <p
          v-if="keyError"
          class="field__error"
          role="alert"
        >
          {{ t('simulator.gateError') }}
        </p>
      </div>
      <button
        type="submit"
        class="btn btn--primary"
      >
        {{ t('simulator.gateButton') }}
      </button>
    </form>

    <template v-else>
      <p
        class="notice notice--warn"
        role="note"
      >
        <span class="status status--timeout">{{ t('general.poc') }}</span>
        <span>{{ t('simulator.banner') }}</span>
      </p>

      <div class="sim">
        <aside class="sim__side">
          <div class="sim__side-head">
            <h2>{{ t('simulator.settings') }}</h2>
          </div>
          <SimSettings
            v-model="settings"
            :disabled="running"
          />
        </aside>

        <section class="sim__main">
          <div class="sim__bar">
            <button
              v-if="!running"
              type="button"
              class="btn btn--primary"
              @click="start"
            >
              <PlayIcon class="icon" />
              {{ t('simulator.start') }}
            </button>
            <button
              v-else
              type="button"
              class="btn btn--primary sim__stop"
              @click="stop"
            >
              <StopIcon class="icon" />
              {{ t('simulator.stop') }}
            </button>
            <span
              v-if="running"
              class="status status--loading"
            >{{ t('simulator.running') }}</span>
            <p
              v-if="validationError"
              class="field__error"
              role="alert"
            >
              {{ validationError }}
            </p>
          </div>

          <div
            class="sim__tabs"
            role="tablist"
          >
            <button
              v-for="item in tabs"
              :id="`sim-tab-${item.id}`"
              :key="item.id"
              type="button"
              role="tab"
              class="panel__tab"
              :class="{'is-active': tab === item.id}"
              :aria-selected="tab === item.id"
              :aria-controls="`sim-panel-${item.id}`"
              @click="tab = item.id"
            >
              {{ t(item.label) }}
              <b
                v-if="item.count !== undefined"
                class="sim__tab-count"
              >{{ item.count }}</b>
            </button>
          </div>

          <div
            v-show="tab === 'log'"
            id="sim-panel-log"
            role="tabpanel"
            aria-labelledby="sim-tab-log"
          >
            <SimLog
              :records="currentRun?.records ?? []"
              :progress="progress"
              :running="running"
            />
          </div>
          <div
            v-show="tab === 'results'"
            id="sim-panel-results"
            role="tabpanel"
            aria-labelledby="sim-tab-results"
          >
            <SimResults :run="viewRun" />
          </div>
          <div
            v-show="tab === 'acceptance'"
            id="sim-panel-acceptance"
            role="tabpanel"
            aria-labelledby="sim-tab-acceptance"
          >
            <SimAcceptance v-if="acceptanceOpened" />
          </div>
          <div
            v-show="tab === 'history'"
            id="sim-panel-history"
            role="tabpanel"
            aria-labelledby="sim-tab-history"
          >
            <SimHistory
              :runs="runs"
              :active-id="viewRunId ?? undefined"
              @select="viewHistory"
              @delete="deleteRun"
              @delete-all="deleteAll"
            />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {PlayIcon, StopIcon} from '@heroicons/vue/16/solid';
import state from '../store';
import SimSettings from './simulator/SimSettings.vue';
import SimLog from './simulator/SimLog.vue';
import SimResults from './simulator/SimResults.vue';
import SimHistory from './simulator/SimHistory.vue';
import SimAcceptance from './simulator/SimAcceptance.vue';
import {createRunner, Runner} from '../simulator/runner';
import {summarize} from '../simulator/stats';
import {isUnlocked, loadRuns, loadSettings, saveRuns, saveSettings, unlock} from '../simulator/storage';
import type {RequestRecord, SimRun, SimSettings as Settings} from '../simulator/types';

const {t, locale} = useI18n();
const apiUrl = import.meta.env.VITE_GRAPHQL_URL as string;

// Gate
const simulatorKey = (import.meta.env.VITE_SIMULATOR_KEY as string | undefined) ?? '';
const unlocked = ref(!simulatorKey || isUnlocked(simulatorKey));
const keyInput = ref('');
const keyError = ref(false);
function tryUnlock() {
  if (keyInput.value === simulatorKey) {
    unlock(simulatorKey);
    unlocked.value = true;
    keyError.value = false;
  } else {
    keyError.value = true;
  }
}

// Settings (persisted); default to all sources once they are known.
const settings = ref<Settings>(loadSettings());
watch(settings, (value) => saveSettings(value), {deep: true});
watch(() => state.sources, (sources) => {
  if (settings.value.sources.length === 0 && sources.length > 0) {
    settings.value = {...settings.value, sources: sources.map(source => source.uri)};
  }
}, {immediate: true});

// Runs
const runs = ref<SimRun[]>(loadRuns());
const currentRun = ref<SimRun | null>(null);
const running = ref(false);
const progress = ref({done: 0, total: null as number | null, elapsedMs: 0});
const validationError = ref('');
const tab = ref<'log' | 'results' | 'history' | 'acceptance'>('log');
// The acceptance tab fetches scenarios from the API; mount it on first open only.
const acceptanceOpened = ref(false);
watch(tab, (value) => { if (value === 'acceptance') acceptanceOpened.value = true; });
const viewRunId = ref<string | null>(null);
const viewRun = computed(() => runs.value.find(run => run.id === viewRunId.value) ?? currentRun.value);
let runner: Runner | null = null;
let startedAt = 0;

const tabs = computed(() => [
  {id: 'log' as const, label: 'simulator.tabLog', count: currentRun.value?.records.length},
  {id: 'results' as const, label: 'simulator.tabResults', count: undefined},
  {id: 'history' as const, label: 'simulator.tabHistory', count: runs.value.length},
  {id: 'acceptance' as const, label: 'simulator.acceptance.tab', count: undefined},
]);

function start() {
  validationError.value = '';
  if (settings.value.terms.length === 0) {
    validationError.value = t('simulator.validation.terms');
    return;
  }
  if (settings.value.sources.length === 0) {
    validationError.value = t('simulator.validation.sources');
    return;
  }
  const snapshot: Settings = JSON.parse(JSON.stringify(settings.value));
  const date = new Date();
  const run: SimRun = {
    id: `${date.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: t('simulator.runName', {
      date: date.toLocaleString(locale.value, {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}),
      tempo: t(`simulator.tempoPreset.${snapshot.tempoId}`),
      n: snapshot.sizeMode === 'count' ? snapshot.count : `${snapshot.minutes} min`,
    }),
    startedAt: date.toISOString(),
    finishedAt: null,
    settings: snapshot,
    capabilities: {types: false, limit: false, timeoutMs: false, resultType: false},
    records: [],
    summary: summarize([], 0),
    stoppedBy: null,
  };
  currentRun.value = run;
  // Mutate through the reactive proxy so the log and results re-render.
  const live = currentRun.value as SimRun;
  viewRunId.value = null;
  running.value = true;
  progress.value = {done: 0, total: snapshot.sizeMode === 'count' ? snapshot.count : null, elapsedMs: 0};
  startedAt = performance.now();
  tab.value = 'log';

  const names = new Map(state.sources.map(source => [source.uri, source.name]));
  runner = createRunner(apiUrl, snapshot, names, {
    onRecord: (record: RequestRecord) => {
      const index = live.records.findIndex(item => item.id === record.id);
      if (index === -1) {
        live.records.push(record);
      } else {
        live.records[index] = record;
      }
      live.summary = summarize(live.records, performance.now() - startedAt);
    },
    onProgress: (done, total, elapsedMs) => {
      progress.value = {done, total, elapsedMs};
    },
    onFinish: (stoppedBy) => {
      live.capabilities = runner?.capabilities ?? live.capabilities;
      live.finishedAt = new Date().toISOString();
      live.stoppedBy = stoppedBy;
      live.summary = summarize(live.records, performance.now() - startedAt);
      running.value = false;
      runs.value = saveRuns([JSON.parse(JSON.stringify(live)), ...runs.value]);
      viewRunId.value = live.id;
      tab.value = 'results';
      runner = null;
    },
  });
  runner.start();
}

function stop() {
  runner?.stop();
}

function viewHistory(id: string) {
  viewRunId.value = id;
  tab.value = 'results';
}

function deleteRun(id: string) {
  runs.value = saveRuns(runs.value.filter(run => run.id !== id));
  if (viewRunId.value === id) {
    viewRunId.value = null;
  }
}

function deleteAll() {
  runs.value = saveRuns([]);
  viewRunId.value = null;
}

onBeforeUnmount(() => runner?.stop());
</script>
