<template>
  <div class="sim-history">
    <p class="field__hint">
      {{ t('simulator.historyHint', {n: MAX_RUNS}) }}
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
            <th scope="row">
              <b>{{ run.name }}</b>
              <small class="sim-history__meta">
                {{ new Date(run.startedAt).toLocaleString(locale) }} ·
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
        @click="$emit('deleteAll')"
      >
        <TrashIcon class="icon" />
        {{ t('simulator.deleteAll') }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {TrashIcon} from '@heroicons/vue/16/solid';
import type {SimRun} from '../../simulator/types';
import {MAX_RUNS} from '../../simulator/storage';

defineProps({
  runs: {type: Array as PropType<SimRun[]>, required: true},
  activeId: {type: String, default: null},
});
defineEmits<{select: [id: string], delete: [id: string], deleteAll: []}>();

const {t, locale} = useI18n();
</script>
