<template>
  <div
    v-if="run"
    class="sim-results"
  >
    <div class="sim-results__head">
      <h2 class="sim-results__title">
        {{ run.name }}
        <span
          v-if="run.stoppedBy"
          class="status"
          :class="run.stoppedBy === 'finished' ? 'status--ok' : run.stoppedBy === 'error' ? 'status--error' : 'status--none'"
        >{{ t(`simulator.stoppedBy.${run.stoppedBy}`) }}</span>
        <span
          v-else
          class="status status--loading"
        >{{ t('simulator.running') }}</span>
      </h2>
      <div class="sim-results__actions">
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          :disabled="run.records.length === 0"
          @click="exportFile('ndjson')"
        >
          <ArrowDownTrayIcon class="icon" />
          {{ t('simulator.exportNdjson') }}
        </button>
        <button
          type="button"
          class="btn btn--secondary btn--sm"
          :disabled="run.records.length === 0"
          @click="exportFile('csv')"
        >
          <ArrowDownTrayIcon class="icon" />
          {{ t('simulator.exportCsv') }}
        </button>
      </div>
    </div>

    <dl class="kpis">
      <div
        v-for="kpi in kpis"
        :key="kpi.key"
        class="kpi"
        :class="kpi.cls"
      >
        <dt>{{ t(`simulator.kpi.${kpi.key}`) }}</dt>
        <dd>{{ kpi.value }}</dd>
      </div>
    </dl>

    <figure
      v-if="spark.values.length > 1"
      class="sparkline"
    >
      <figcaption>{{ t('simulator.sparkline') }} · {{ t('simulator.sparklineMax', {ms: spark.max}) }}</figcaption>
      <svg
        viewBox="0 0 600 80"
        preserveAspectRatio="none"
        role="img"
        :aria-label="t('simulator.sparkline')"
      >
        <line
          x1="0"
          y1="79"
          x2="600"
          y2="79"
          class="sparkline__axis"
        />
        <path
          :d="spark.path"
          class="sparkline__line"
        />
      </svg>
    </figure>

    <div class="table-wrap">
      <table class="data-table">
        <caption class="sr-only">
          {{ t('simulator.perSource') }}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              {{ t('simulator.colSource') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colRequests') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colSuccess') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colAvgResults') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colP50') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colP95') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.colMax') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in stats"
            :key="row.source"
          >
            <th scope="row">
              {{ row.name }}
              <span
                v-if="row.timeouts > 0"
                class="status status--timeout"
              >{{ row.timeouts }} {{ t('simulator.status.timeout') }}</span>
              <span
                v-if="row.errors > 0"
                class="status status--error"
              >{{ row.errors }} {{ t('simulator.status.error') }}</span>
            </th>
            <td class="num">
              {{ row.requests }}
            </td>
            <td class="num">
              {{ Math.round(row.successRate * 100) }}%
            </td>
            <td class="num">
              {{ row.avgResults.toFixed(1) }}
            </td>
            <td class="num">
              {{ row.p50 ?? '–' }}
            </td>
            <td class="num">
              {{ row.p95 ?? '–' }}
            </td>
            <td class="num">
              {{ row.max ?? '–' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="field__hint">
      {{ t('simulator.capabilities') }}
      <template v-if="run.capabilities.types || run.capabilities.limit">
        {{ [run.capabilities.types ? t('simulator.capTypes') : null, run.capabilities.limit ? t('simulator.capLimit') : null].filter(Boolean).join(', ') }}
      </template>
      <template v-else>
        {{ t('simulator.capNone') }}
      </template>
    </p>
  </div>
  <p
    v-else
    class="empty"
  >
    {{ t('simulator.noRun') }}
  </p>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowDownTrayIcon} from '@heroicons/vue/16/solid';
import type {SimRun} from '../../simulator/types';
import {downloadText, perSourceStats, sparklinePath, toCsv, toNdjson} from '../../simulator/stats';

const props = defineProps({
  run: {type: Object as PropType<SimRun | null>, default: null},
});

const {t} = useI18n();
const stats = computed(() => props.run ? perSourceStats(props.run.records) : []);
const spark = computed(() => sparklinePath(props.run?.records ?? [], 600, 80));
const formatDuration = (ms: number) => {
  const seconds = Math.round(ms / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds} s`;
};
const kpis = computed(() => {
  const summary = props.run?.summary;
  if (!summary) {
    return [];
  }
  return [
    {key: 'requests', value: String(summary.requests), cls: ''},
    {key: 'results', value: String(summary.results), cls: ''},
    {key: 'timeouts', value: String(summary.timeouts), cls: summary.timeouts > 0 ? 'kpi--warn' : ''},
    {key: 'errors', value: String(summary.errors), cls: summary.errors > 0 ? 'kpi--danger' : ''},
    {key: 'duration', value: formatDuration(summary.durationMs), cls: ''},
  ];
});

function exportFile(format: 'ndjson' | 'csv') {
  if (!props.run) {
    return;
  }
  const stamp = props.run.startedAt.replace(/[:.]/g, '-').slice(0, 19);
  if (format === 'ndjson') {
    downloadText(`vtn-simulator-${stamp}.ndjson`, toNdjson(props.run), 'application/x-ndjson');
  } else {
    downloadText(`vtn-simulator-${stamp}.csv`, toCsv(props.run), 'text/csv');
  }
}
</script>
