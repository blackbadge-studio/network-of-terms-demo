<template>
  <div class="sim-acc">
    <p
      v-if="loading"
      class="empty"
    >
      {{ t('simulator.acceptance.loading') }}
    </p>
    <div
      v-else-if="loadError"
      class="source__notice source__notice--error"
      role="alert"
    >
      <ExclamationTriangleIcon class="icon" />
      <span>{{ t('simulator.acceptance.loadError', {url: scenariosUrl}) }} ({{ loadError }})</span>
      <button
        type="button"
        class="btn btn--secondary btn--sm"
        @click="load"
      >
        <ArrowPathIcon class="icon" />
        {{ t('simulator.retry') }}
      </button>
    </div>

    <template v-else-if="manifest">
      <div class="sim__bar">
        <button
          v-if="!running"
          type="button"
          class="btn btn--primary"
          @click="run(manifest.scenarios, 'all')"
        >
          <PlayIcon class="icon" />
          {{ t('simulator.acceptance.runAll') }}
          <b class="sim__tab-count">{{ manifest.scenarios.length }}</b>
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
      </div>

      <p class="field__hint sim-acc__legend">
        {{ t('simulator.acceptance.legend') }}
      </p>

      <div
        v-if="currentRun"
        class="sim-acc__summary"
        aria-live="polite"
      >
        <div class="progress">
          <div class="progress__track">
            <div
              class="progress__bar"
              :style="{width: progressPercent + '%'}"
            />
          </div>
        </div>
        <div class="sim-acc__counts">
          <span class="status status--ok">{{ currentRun.summary.pass }} {{ t('simulator.acceptance.status.pass') }}</span>
          <span class="status status--error">{{ currentRun.summary.fail }} {{ t('simulator.acceptance.status.fail') }}</span>
          <span class="status status--timeout">{{ currentRun.summary.error }} {{ t('simulator.acceptance.status.error') }}</span>
          <span class="status status--none">{{ currentRun.summary.skipped }} {{ t('simulator.acceptance.status.skipped') }}</span>
          <span class="field__hint">{{ t('simulator.acceptance.total') }}: {{ (currentRun.summary.durationMs / 1000).toFixed(1) }} s</span>
          <span class="spacer" />
          <button
            type="button"
            class="btn btn--secondary btn--sm"
            :disabled="currentRun.results.length === 0"
            @click="exportJson(currentRun)"
          >
            <ArrowDownTrayIcon class="icon" />
            {{ t('simulator.acceptance.exportJson') }}
          </button>
          <button
            type="button"
            class="btn btn--secondary btn--sm"
            :disabled="currentRun.results.length === 0"
            @click="exportMarkdown(currentRun)"
          >
            <ArrowDownTrayIcon class="icon" />
            {{ t('simulator.acceptance.exportMd') }}
          </button>
        </div>
      </div>

      <section
        v-for="area in areas"
        :key="area.id"
        class="sim-acc__area"
      >
        <header class="sim-acc__area-head">
          <h3>
            {{ area.title }}
            <span class="field__count">({{ area.scenarios.length }})</span>
          </h3>
          <span
            v-if="area.counts.done > 0"
            class="sim-acc__area-counts"
          >
            <span class="status status--ok">{{ area.counts.pass }}</span>
            <span
              v-if="area.counts.fail"
              class="status status--error"
            >{{ area.counts.fail }}</span>
            <span
              v-if="area.counts.error"
              class="status status--timeout"
            >{{ area.counts.error }}</span>
          </span>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            :disabled="running"
            @click="run(area.scenarios, `area:${area.id}`)"
          >
            <PlayIcon class="icon" />
            {{ t('simulator.acceptance.runArea') }}
          </button>
        </header>
        <ul class="sim-acc__list">
          <li
            v-for="scenario in area.scenarios"
            :key="scenario.id"
            class="sim-acc__row"
            :class="{'is-open': expanded.has(scenario.id)}"
          >
            <button
              type="button"
              class="sim-acc__toggle"
              :aria-expanded="expanded.has(scenario.id)"
              :aria-controls="`acc-${scenario.id}`"
              @click="toggle(scenario.id)"
            >
              <ChevronDownIcon class="icon picker__chev" />
              <code class="sim-acc__id">{{ scenario.id }}</code>
              <span class="sim-acc__title">{{ scenario.title }}</span>
              <span class="sim-acc__reqs">
                <span
                  v-for="req in scenario.requirement"
                  :key="req"
                  class="chip chip--tag"
                  :title="refTitle(req)"
                >{{ req }}</span>
              </span>
              <span
                class="status"
                :class="statusClass(statusOf(scenario.id))"
              >{{ t(`simulator.acceptance.status.${statusOf(scenario.id)}`) }}</span>
              <span class="sim-log__ms">{{ resultOf(scenario.id)?.ms !== undefined ? `${resultOf(scenario.id)!.ms} ms` : '' }}</span>
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--sm sim-acc__run-one"
              :disabled="running"
              :aria-label="`${t('simulator.acceptance.runOne')}: ${scenario.id}`"
              @click="run([scenario], `scenario:${scenario.id}`)"
            >
              <PlayIcon class="icon" />
            </button>
            <div
              v-show="expanded.has(scenario.id)"
              :id="`acc-${scenario.id}`"
              class="sim-acc__details"
            >
              <p
                v-if="scenario.what"
                class="sim-acc__what"
              >
                {{ scenario.what }}
              </p>
              <p
                v-if="resultOf(scenario.id)?.error"
                class="sim-log__message"
              >
                {{ resultOf(scenario.id)!.error }}
              </p>

              <div
                v-if="checksOf(scenario).length"
                class="sim-acc__block"
              >
                <h4>{{ t('simulator.acceptance.checksTitle') }}</h4>
                <ul class="sim-acc__checks">
                  <li
                    v-for="(check, index) in checksOf(scenario)"
                    :key="index"
                  >
                    <span
                      class="sim-acc__mark"
                      :class="check.ok === undefined ? 'is-pending' : check.ok ? 'is-ok' : 'is-fail'"
                      aria-hidden="true"
                    >{{ check.ok === undefined ? '○' : check.ok ? '✓' : '✗' }}</span>
                    <span>
                      {{ check.label }}
                      <small
                        v-if="check.ok === false"
                        class="sim-acc__got"
                      >{{ t('simulator.acceptance.expectedGot', {expected: fmt(check.expected), actual: fmt(check.actual)}) }}</small>
                    </span>
                  </li>
                </ul>
                <p
                  v-if="!resultOf(scenario.id)"
                  class="field__hint"
                >
                  {{ t('simulator.acceptance.notRun') }}
                </p>
              </div>

              <div
                v-if="refsOf(scenario).length"
                class="sim-acc__block"
              >
                <h4>{{ t('simulator.acceptance.why') }}</h4>
                <ul class="sim-acc__refs">
                  <li
                    v-for="item in refsOf(scenario)"
                    :key="item.id"
                  >
                    <template v-if="item.kind === 'requirement'">
                      <b>{{ t('simulator.acceptance.requirement') }} {{ item.id }} · {{ item.title }}</b>
                      <span>
                        {{ item.text }}
                        <small v-if="item.story">({{ item.story }})</small>
                      </span>
                    </template>
                    <template v-else-if="item.kind === 'bestek'">
                      <b>{{ t('simulator.acceptance.bestek') }} {{ item.number }} · {{ item.title }}</b>
                      <a
                        :href="item.href"
                        target="_blank"
                        rel="noopener"
                      >{{ t('simulator.acceptance.openBestek') }} ({{ t('simulator.acceptance.page') }} {{ item.page }}) <ArrowTopRightOnSquareIcon class="icon" /></a>
                    </template>
                    <b v-else>{{ item.id }}</b>
                  </li>
                </ul>
              </div>

              <details class="sim-acc__tech">
                <summary>
                  <ChevronDownIcon class="icon picker__chev" />
                  {{ t('simulator.acceptance.tech') }}
                </summary>
                <div class="sim-acc__block">
                  <h4>{{ t('simulator.acceptance.request') }}</h4>
                  <pre class="sim-acc__request"><code>{{ requestOf(scenario) }}</code></pre>
                </div>
                <table
                  v-if="checksOf(scenario).length"
                  class="data-table"
                >
                  <thead>
                    <tr>
                      <th scope="col">
                        {{ t('simulator.acceptance.expression') }}
                      </th>
                      <th scope="col">
                        {{ t('simulator.acceptance.expected') }}
                      </th>
                      <th scope="col">
                        {{ t('simulator.acceptance.actual') }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(check, index) in checksOf(scenario)"
                      :key="index"
                    >
                      <th scope="row">
                        <code>{{ check.detail }}</code>
                      </th>
                      <td><code>{{ fmt(check.expected) }}</code></td>
                      <td><code>{{ fmt(check.actual) }}</code></td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </div>
          </li>
        </ul>
      </section>

      <section class="sim-acc__history">
        <h3>{{ t('simulator.acceptance.history') }}</h3>
        <p class="field__hint">
          {{ t('simulator.acceptance.historyHint', {n: MAX_ACCEPTANCE_RUNS}) }}
        </p>
        <p
          v-if="history.length === 0"
          class="empty"
        >
          {{ t('simulator.acceptance.noResults') }}
        </p>
        <div
          v-else
          class="table-wrap"
        >
          <table class="data-table">
            <thead>
              <tr>
                <th scope="col">
                  {{ t('simulator.date') }}
                </th>
                <th scope="col">
                  {{ t('simulator.acceptance.scope') }}
                </th>
                <th
                  scope="col"
                  class="num"
                >
                  {{ t('simulator.acceptance.status.pass') }}
                </th>
                <th
                  scope="col"
                  class="num"
                >
                  {{ t('simulator.acceptance.status.fail') }}
                </th>
                <th
                  scope="col"
                  class="num"
                >
                  {{ t('simulator.acceptance.status.error') }}
                </th>
                <th scope="col">
                  <span class="sr-only">{{ t('simulator.view') }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in history"
                :key="item.id"
                :class="{'is-active': item.id === currentRun?.id}"
              >
                <th scope="row">
                  {{ new Date(item.startedAt).toLocaleString(locale) }}
                  <small class="sim-history__meta">{{ item.apiVersion ? `API ${item.apiVersion}` : '' }} {{ item.stoppedBy === 'user' ? `· ${t('simulator.stoppedBy.user')}` : '' }}</small>
                </th>
                <td>{{ item.scope }}</td>
                <td class="num">
                  {{ item.summary.pass }}
                </td>
                <td class="num">
                  {{ item.summary.fail }}
                </td>
                <td class="num">
                  {{ item.summary.error }}
                </td>
                <td class="sim-history__actions">
                  <button
                    type="button"
                    class="btn btn--ghost btn--sm"
                    @click="view(item)"
                  >
                    {{ t('simulator.view') }}
                  </button>
                  <button
                    type="button"
                    class="btn btn--ghost btn--sm"
                    :aria-label="`${t('simulator.acceptance.exportMd')}: ${item.startedAt}`"
                    @click="exportMarkdown(item)"
                  >
                    <ArrowDownTrayIcon class="icon" />
                  </button>
                  <button
                    type="button"
                    class="btn btn--ghost btn--sm"
                    :aria-label="`${t('simulator.deleteRun')}: ${item.startedAt}`"
                    @click="remove(item.id)"
                  >
                    <TrashIcon class="icon" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-if="history.length > 0"
          class="sim-history__foot"
        >
          <button
            type="button"
            class="btn btn--secondary btn--sm"
            @click="removeAll"
          >
            <TrashIcon class="icon" />
            {{ t('simulator.deleteAll') }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowDownTrayIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon, ChevronDownIcon, ExclamationTriangleIcon, PlayIcon, StopIcon, TrashIcon} from '@heroicons/vue/16/solid';
import {
  AcceptanceRun, MAX_ACCEPTANCE_RUNS, Manifest, Result, Scenario, formatQuery,
  apiBaseUrl, fetchApiVersion, loadAcceptanceRuns, loadManifest, loadRunner, saveAcceptanceRuns, summarizeResults, testsBaseUrl, toMarkdownReport,
} from '../../simulator/acceptance';
import {downloadText} from '../../simulator/stats';

const {t, locale} = useI18n();

const manifest = ref<Manifest | null>(null);
const loading = ref(false);
const loadError = ref('');
const apiVersion = ref<string | null>(null);
const scenariosUrl = `${testsBaseUrl()}/tests/scenarios.json`;

const history = ref<AcceptanceRun[]>(loadAcceptanceRuns());
const currentRun = ref<AcceptanceRun | null>(null);
const running = ref(false);
const runningIds = reactive(new Set<string>());
const expanded = reactive(new Set<string>());
let controller: AbortController | null = null;
let startedAt = 0;

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    manifest.value = await loadManifest();
    apiVersion.value = await fetchApiVersion();
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : String(error);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
onBeforeUnmount(() => controller?.abort());

const areas = computed(() => {
  if (!manifest.value) {
    return [];
  }
  const known = manifest.value.areas.map(area => area.id);
  const ids = [...new Set([...known, ...manifest.value.scenarios.map(scenario => scenario.area)])];
  return ids.map(id => {
    const scenarios = manifest.value!.scenarios.filter(scenario => scenario.area === id);
    const results = scenarios.map(scenario => resultOf(scenario.id)).filter(Boolean) as Result[];
    return {
      id,
      title: manifest.value!.areas.find(area => area.id === id)?.title ?? id,
      scenarios,
      counts: {
        done: results.length,
        pass: results.filter(result => result.status === 'pass').length,
        fail: results.filter(result => result.status === 'fail').length,
        error: results.filter(result => result.status === 'error').length,
      },
    };
  }).filter(area => area.scenarios.length > 0);
});

const resultOf = (id: string) => currentRun.value?.results.find(result => result.id === id);
const statusOf = (id: string) => runningIds.has(id) ? 'running' : (resultOf(id)?.status ?? 'pending');
const statusClass = (status: string) => ({
  pending: 'status--none', running: 'status--loading', pass: 'status--ok', fail: 'status--error', error: 'status--timeout', skipped: 'status--none',
}[status] ?? 'status--none');
const progressPercent = computed(() => {
  const run = currentRun.value;
  if (!run) {
    return 0;
  }
  const planned = Number(run.scope.startsWith('scenario:') ? 1 : run.scope.startsWith('area:') ? areas.value.find(area => `area:${area.id}` === run.scope)?.scenarios.length : manifest.value?.scenarios.length) || 1;
  return Math.min(100, Math.round((run.results.length / planned) * 100));
});
const fmt = (value: unknown) => value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value);

/**
 * The checks of a scenario for display: judged ones once it ran, otherwise what it is going to check.
 * `label` is plain language, `detail` the exact expression (older stored runs only have the latter).
 */
function checksOf(scenario: Scenario) {
  const judged = resultOf(scenario.id)?.checks ?? [];
  if (judged.length > 0) {
    return judged.map(check => ({...check, detail: check.detail ?? check.label, ok: check.ok as boolean | undefined}));
  }
  const planned = scenario.checks?.length ? scenario.checks : scenario.expectError ? [{label: 'De API antwoordt met een duidelijke foutmelding'}] : [];
  return planned.map(check => ({label: check.label ?? '', detail: detailOf(check), ok: undefined as boolean | undefined, expected: undefined as unknown, actual: undefined as unknown}));
}
const detailOf = (check: Record<string, unknown>) => Object.entries(check)
  .filter(([key]) => key !== 'label')
  .map(([key, value]) => `${key} ${typeof value === 'string' ? value : JSON.stringify(value)}`)
  .join(', ');

/** What a scenario answers to: the requirement in meemoo's list, or the section of the tender. */
function refsOf(scenario: Scenario) {
  return scenario.requirement.map(id => {
    const requirement = manifest.value?.requirements?.[id];
    if (requirement) {
      return {kind: 'requirement' as const, id, ...requirement};
    }
    const section = manifest.value?.bestek?.sections[id];
    if (section) {
      return {kind: 'bestek' as const, id, number: id.split(' ')[0], title: section.title, page: section.page, href: `${manifest.value!.bestek!.url}#page=${section.pdfPage}`};
    }
    return {kind: 'other' as const, id};
  });
}
const refTitle = (id: string) => manifest.value?.requirements?.[id]?.title ?? manifest.value?.bestek?.sections[id]?.title;

function requestOf(scenario: Scenario): string {
  if (scenario.kind === 'graphql') {
    return `POST ${apiBaseUrl()}${scenario.path ?? '/graphql'}\n\n${formatQuery(scenario.query ?? '')}`;
  }
  return `${scenario.method ?? 'GET'} ${scenario.base === 'ui' ? window.location.origin : apiBaseUrl()}${scenario.path ?? ''}`;
}

function toggle(id: string) {
  if (expanded.has(id)) {
    expanded.delete(id);
  } else {
    expanded.add(id);
  }
}

async function run(scenarios: Scenario[], scope: string) {
  if (running.value || scenarios.length === 0) {
    return;
  }
  running.value = true;
  runningIds.clear();
  controller = new AbortController();
  startedAt = performance.now();
  const run: AcceptanceRun = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    api: apiBaseUrl(),
    ui: window.location.origin,
    apiVersion: apiVersion.value,
    manifestGenerated: manifest.value?.generated ?? null,
    scope,
    results: [],
    summary: summarizeResults([], 0),
    stoppedBy: null,
  };
  currentRun.value = run;
  const live = currentRun.value as AcceptanceRun;
  try {
    const runner = await loadRunner();
    await runner.runScenarios(scenarios, {
      api: apiBaseUrl(),
      ui: window.location.origin,
      signal: controller.signal,
      onStart: (scenario) => { runningIds.add(scenario.id); },
      onResult: (result) => {
        runningIds.delete(result.id);
        const index = live.results.findIndex(item => item.id === result.id);
        if (index === -1) {
          live.results.push(result);
        } else {
          live.results[index] = result;
        }
        live.summary = summarizeResults(live.results, performance.now() - startedAt);
      },
    });
  } catch (error) {
    if (!controller.signal.aborted) {
      live.results.push({id: 'runner', title: 'runner', area: '', requirement: [], status: 'error', ms: 0, checks: [], error: error instanceof Error ? error.message : String(error)});
    }
  } finally {
    runningIds.clear();
    live.finishedAt = new Date().toISOString();
    live.stoppedBy = controller.signal.aborted ? 'user' : 'finished';
    live.summary = summarizeResults(live.results, performance.now() - startedAt);
    running.value = false;
    history.value = saveAcceptanceRuns([JSON.parse(JSON.stringify(live)), ...history.value]);
  }
}

function stop() {
  controller?.abort();
}

function view(item: AcceptanceRun) {
  currentRun.value = JSON.parse(JSON.stringify(item));
}

function remove(id: string) {
  history.value = saveAcceptanceRuns(history.value.filter(item => item.id !== id));
}

function removeAll() {
  history.value = saveAcceptanceRuns([]);
}

const stamp = (run: AcceptanceRun) => run.startedAt.replace(/[:.]/g, '-').slice(0, 19);

function exportJson(run: AcceptanceRun) {
  downloadText(`vtn-acceptatietest-${stamp(run)}.json`, JSON.stringify(run, null, 2), 'application/json');
}

function exportMarkdown(run: AcceptanceRun) {
  const labels = {
    title: t('simulator.acceptance.reportTitle'),
    date: t('simulator.date'),
    api: t('simulator.acceptance.apiUrl'),
    ui: t('simulator.acceptance.uiUrl'),
    apiVersion: t('simulator.acceptance.apiVersion'),
    scope: t('simulator.acceptance.scope'),
    area: t('simulator.acceptance.area'),
    pass: t('simulator.acceptance.status.pass'),
    fail: t('simulator.acceptance.status.fail'),
    error: t('simulator.acceptance.status.error'),
    skipped: t('simulator.acceptance.status.skipped'),
    total: t('simulator.acceptance.totalLabel'),
    duration: t('simulator.acceptance.total'),
    failures: t('simulator.acceptance.failures'),
    none: t('simulator.acceptance.none'),
    check: t('simulator.acceptance.checks'),
    expected: t('simulator.acceptance.expected'),
    actual: t('simulator.acceptance.actual'),
  };
  downloadText(`vtn-testrapport-${stamp(run)}.md`, toMarkdownReport(run, manifest.value?.areas ?? [], labels), 'text/markdown');
}
</script>
