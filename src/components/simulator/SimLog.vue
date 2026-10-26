<template>
  <div class="sim-log">
    <div
      class="progress"
      role="progressbar"
      :aria-valuemin="0"
      :aria-valuemax="progress.total ?? undefined"
      :aria-valuenow="progress.done"
      :aria-valuetext="progressText"
    >
      <div class="progress__track">
        <div
          class="progress__bar"
          :class="{'progress__bar--indeterminate': running && progress.total === null}"
          :style="{width: percent + '%'}"
        />
      </div>
      <span class="progress__text">{{ progressText }}</span>
    </div>

    <p
      v-if="records.length === 0"
      class="empty"
    >
      {{ t('simulator.emptyLog') }}
    </p>
    <ol
      v-else
      class="sim-log__list"
      aria-live="polite"
      aria-relevant="additions"
    >
      <li
        v-for="record in visible"
        :key="record.id"
        class="sim-log__row"
      >
        <span class="sim-log__id">#{{ record.id }}</span>
        <span
          class="sim-log__term"
          :title="record.term"
        >
          <span class="chip chip--tag sim-log__kind">{{ t(`simulator.kind.${record.kind ?? 'search'}`) }}</span>
          {{ record.term }}
        </span>
        <span
          class="status"
          :class="statusClass(record.status)"
        >{{ t(`simulator.status.${record.status}`) }}</span>
        <span class="sim-log__ms">
          {{ record.ms !== null ? `${record.ms} ms` : '' }}
          <span
            v-if="record.cached === true"
            class="chip chip--tag"
            :title="t('simulator.cached')"
          >{{ t('simulator.cached') }}</span>
        </span>
        <span class="sim-log__sources">
          <span
            v-for="(entry, index) in record.perSource"
            :key="entry.source + index"
            class="status"
            :class="`status--${entry.status}`"
            :title="`${entry.name}: ${entry.apiMs ?? '–'} ms`"
          >{{ shortName(entry.name) }} {{ entry.status === 'ok' ? entry.results : '' }}</span>
          <span
            v-if="record.message"
            class="sim-log__message"
          >{{ record.message }}</span>
        </span>
      </li>
    </ol>
    <p
      v-if="records.length > visible.length"
      class="field__hint"
    >
      +{{ records.length - visible.length }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import type {RequestRecord, RequestStatus} from '../../simulator/types';

const props = defineProps({
  records: {type: Array as PropType<RequestRecord[]>, required: true},
  progress: {type: Object as PropType<{done: number, total: number | null, elapsedMs: number}>, required: true},
  running: {type: Boolean, default: false},
});

const {t} = useI18n();
const visible = computed(() => [...props.records].reverse().slice(0, 200));
const percent = computed(() => {
  if (props.progress.total === null) {
    return props.running ? 100 : 0;
  }
  return Math.min(100, Math.round((props.progress.done / Math.max(1, props.progress.total)) * 100));
});
const elapsed = computed(() => {
  const seconds = Math.round(props.progress.elapsedMs / 1000);
  return seconds >= 60 ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : `${seconds} s`;
});
const progressText = computed(() =>
  props.progress.total === null
    ? t('simulator.progressTime', {done: props.progress.done, elapsed: elapsed.value})
    : t('simulator.progress', {done: props.progress.done, total: props.progress.total}),
);
const statusClass = (status: RequestStatus) => ({
  pending: 'status--none',
  running: 'status--loading',
  done: 'status--ok',
  timeout: 'status--timeout',
  error: 'status--error',
  aborted: 'status--none',
}[status]);
const shortName = (name: string) => name.length > 18 ? name.slice(0, 17) + '…' : name;
</script>
