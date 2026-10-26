<template>
  <div class="sim-history">
    <p class="field__hint">
      {{ t('simulator.historyHint', {n: MAX_RUNS}) }} {{ t('simulator.compareHint') }}
    </p>
    <p
      v-if="runs.length === 0"
      class="empty"
    >
      {{ t('simulator.historyEmpty') }}
    </p>
    <div
      v-else
      class="table-wrap"
    >
      <table class="data-table">
        <caption class="sr-only">
          {{ t('simulator.tabHistory') }}
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span class="sr-only">{{ t('simulator.compare') }}</span>
            </th>
            <th scope="col">
              {{ t('simulator.tabHistory') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.kpi.requests') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.kpi.results') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.kpi.timeouts') }}
            </th>
            <th
              scope="col"
              class="num"
            >
              {{ t('simulator.kpi.errors') }}
            </th>
            <th scope="col">
              <span class="sr-only">{{ t('simulator.view') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="run in runs"
            :key="run.id"
            :class="{'is-active': run.id === activeId}"
          >
            <td>
              <input
                type="checkbox"
                class="sim-history__check"
                :checked="selected.includes(run.id)"
                :aria-label="`${t('simulator.compare')}: ${run.name}`"
                @change="toggleSelect(run.id)"
              >
            </td>
            <th scope="row">
              <b>{{ run.name }}</b>
              <small class="sim-history__meta">
                {{ new Date(run.startedAt).toLocaleString(locale) }} ·
                {{ t(`simulator.workloads.${run.settings.workload ?? 'search'}`) }} ·
                {{ run.settings.sources.length }} {{ t('simulator.sources').toLowerCase() }} ·
                {{ run.settings.lang.toUpperCase() }}
                <template v-if="run.settings.types.length">· {{ run.settings.types.join(', ') }}</template>
                <template v-if="run.stoppedBy">· {{ t(`simulator.stoppedBy.${run.stoppedBy}`) }}</template>
              </small>
            </th>
            <td class="num">
              {{ run.summary.requests }}
            </td>
            <td class="num">
              {{ run.summary.results }}
            </td>
            <td class="num">
              {{ run.summary.timeouts }}
            </td>
            <td class="num">
              {{ run.summary.errors }}
            </td>
            <td class="sim-history__actions">
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                @click="$emit('select', run.id)"
              >
                {{ t('simulator.view') }}
              </button>
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                :aria-label="`${t('simulator.deleteRun')}: ${run.name}`"
                @click="$emit('delete', run.id)"
              >
                <TrashIcon class="icon" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-if="runs.length > 0"
      class="sim-history__foot"
    >
      <button
        type="button"
        class="btn btn--secondary btn--sm"
        :disabled="selected.length !== 2"
        @click="showCompare = true"
      >
        <ArrowsRightLeftIcon class="icon" />
        {{ t('simulator.compare') }}
      </button>
      <button
        type="button"
        class="btn btn--secondary btn--sm"
        @click="$emit('deleteAll')"
      >
        <TrashIcon class="icon" />
        {{ t('simulator.deleteAll') }}
      </button>
    </div>

    <section
      v-if="showCompare && comparison"
      class="sim-compare"
      :aria-label="t('simulator.compareTitle')"
    >
      <div class="sim-results__head">
        <h2 class="sim-results__title">
          {{ t('simulator.compareTitle') }}
        </h2>
        <button
          type="button"
          class="btn btn--ghost btn--sm"
          @click="showCompare = false"
        >
          <XMarkIcon class="icon" />
          {{ t('simulator.clearCompare') }}
        </button>
      </div>
      <p class="field__hint">
        <b>A</b> {{ comparison.a.name }} · <b>B</b> {{ comparison.b.name }}
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th
                scope="col"
                rowspan="2"
              >
                {{ t('simulator.colSource') }}
              </th>
              <th
                scope="col"
                colspan="2"
                class="num"
              >
                {{ t('simulator.colP50') }}
              </th>
              <th
                scope="col"
                colspan="2"
                class="num"
              >
                {{ t('simulator.colP95') }}
              </th>
              <th
                scope="col"
                colspan="2"
                class="num"
              >
                {{ t('simulator.colSuccess') }}
              </th>
            </tr>
            <tr>
              <th
                v-for="(label, index) in ['A', 'B', 'A', 'B', 'A', 'B']"
                :key="index"
                scope="col"
                class="num"
              >
                {{ label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in comparison.rows"
              :key="row.source"
            >
              <th scope="row">
                {{ row.name }}
              </th>
              <td class="num">
                {{ row.a?.p50 ?? '–' }}
              </td>
              <td
                class="num"
                :class="delta(row.a?.p50, row.b?.p50, true)"
              >
                {{ row.b?.p50 ?? '–' }}
              </td>
              <td class="num">
                {{ row.a?.p95 ?? '–' }}
              </td>
              <td
                class="num"
                :class="delta(row.a?.p95, row.b?.p95, true)"
              >
                {{ row.b?.p95 ?? '–' }}
              </td>
              <td class="num">
                {{ row.a ? Math.round(row.a.successRate * 100) + '%' : '–' }}
              </td>
              <td
                class="num"
                :class="delta(row.a?.successRate, row.b?.successRate, false)"
              >
                {{ row.b ? Math.round(row.b.successRate * 100) + '%' : '–' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import {computed, PropType, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowsRightLeftIcon, TrashIcon, XMarkIcon} from '@heroicons/vue/16/solid';
import type {SimRun} from '../../simulator/types';
import {MAX_RUNS} from '../../simulator/storage';
import {compareRuns} from '../../simulator/stats';

const props = defineProps({
  runs: {type: Array as PropType<SimRun[]>, required: true},
  activeId: {type: String, default: null},
});
defineEmits<{select: [id: string], delete: [id: string], deleteAll: []}>();

const {t, locale} = useI18n();
const selected = ref<string[]>([]);
const showCompare = ref(false);

function toggleSelect(id: string) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(item => item !== id);
  } else {
    selected.value = [...selected.value.slice(-1), id];
  }
  if (selected.value.length < 2) {
    showCompare.value = false;
  }
}

const comparison = computed(() => {
  const [idA, idB] = selected.value;
  const a = props.runs.find(run => run.id === idA);
  const b = props.runs.find(run => run.id === idB);
  if (!a || !b) {
    return null;
  }
  return {a, b, rows: compareRuns(a, b)};
});

/** Colours B against A: lower is better for times, higher is better for success. */
const delta = (a: number | null | undefined, b: number | null | undefined, lowerIsBetter: boolean) => {
  if (a === null || a === undefined || b === null || b === undefined || a === b) {
    return '';
  }
  const better = lowerIsBetter ? b < a : b > a;
  return better ? 'is-better' : 'is-worse';
};
</script>
