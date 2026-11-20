<template>
  <div class="container page uptime">
    <h1 class="page__title">
      {{ t('status.title') }}
    </h1>
    <p class="page__lead">
      {{ t('status.lead') }}
    </p>

    <p
      v-if="failed"
      class="notice notice--warn"
      role="status"
    >
      <span>{{ t('status.failed') }}</span>
    </p>

    <template v-if="summary">
      <div
        class="uptime__banner"
        :class="downCount === 0 ? 'is-ok' : 'is-down'"
        role="status"
      >
        <i class="uptime__bullet" />
        <div>
          <strong>{{ downCount === 0 ? t('status.allUp') : t('status.someDown', {n: downCount, total: summary.sources.length}, downCount) }}</strong>
          <span>{{ t('status.updated', {time: clock(summary.generatedAt)}) }}</span>
        </div>
      </div>

      <dl class="uptime__totals">
        <div>
          <dt>{{ t('status.last24h') }}</dt>
          <dd>{{ percent(summary.uptime.last24h) }}</dd>
        </div>
        <div>
          <dt>{{ t('status.last7d') }}</dt>
          <dd>{{ percent(summary.uptime.last7d) }}</dd>
        </div>
        <div>
          <dt>{{ t('status.period', {n: slots.length}) }}</dt>
          <dd>{{ percent(summary.uptime.period) }}</dd>
        </div>
      </dl>

      <h2 class="uptime__heading">
        {{ t('status.perSource', {n: slots.length}) }}
      </h2>
      <ul class="uptime__list">
        <li
          v-for="source in summary.sources"
          :key="source.uri"
          class="uptime__source"
        >
          <div class="uptime__row">
            <div class="uptime__name">
              <strong>{{ source.name[locale] ?? source.name.nl ?? source.uri }}</strong>
              <span class="uptime__uptime">{{ percent(source.uptime.period) }}</span>
            </div>
            <span
              class="uptime__state"
              :class="stateClass(source)"
            >
              <i
                class="dot"
                :class="{'dot--off': source.latest && !source.latest.success, 'dot--unknown': !source.latest}"
              />
              {{ stateLabel(source) }}
            </span>
          </div>
          <ol
            class="uptime__bar"
            :aria-label="t('status.barLabel', {source: source.name[locale] ?? source.name.nl, n: slots.length})"
          >
            <li
              v-for="slot in slots"
              :key="slot"
            >
              <button
                type="button"
                class="uptime__slot"
                :class="[slotClass(source, slot), {'is-selected': isSelected(source, slot)}]"
                :title="slotTitle(source, slot)"
                :aria-label="slotTitle(source, slot)"
                :aria-expanded="dayOf(source, slot) ? isSelected(source, slot) : undefined"
                :disabled="!dayOf(source, slot)"
                @click="toggleDay(source, slot)"
              />
            </li>
          </ol>
          <section
            v-if="selected && selected.uri === source.uri && selectedDay"
            class="uptime__day"
            :aria-label="t('status.dayTitle', {date: day(selected.date)})"
          >
            <header class="uptime__day-head">
              <h3>{{ day(selected.date) }}</h3>
              <span
                class="uptime__badge"
                :class="slotClass(source, selected.date)"
              >{{ t(`status.dayState.${slotClass(source, selected.date)}`) }}</span>
              <button
                type="button"
                class="btn btn--ghost btn--sm uptime__day-close"
                :aria-label="t('general.close')"
                @click="selected = null"
              >
                <XMarkIcon class="icon" />
              </button>
            </header>
            <p class="uptime__day-text">
              {{ t('status.daySummary', {ok: selectedDay.ok, checks: selectedDay.checks, percent: percent(selectedDay.uptime)}) }}
              {{ t(`status.dayWhy.${slotClass(source, selected.date)}`) }}
            </p>
            <dl class="uptime__day-stats">
              <div>
                <dt>{{ t('status.statChecks') }}</dt>
                <dd>{{ selectedDay.checks }}</dd>
              </div>
              <div>
                <dt>{{ t('status.statFailed') }}</dt>
                <dd>{{ selectedDay.checks - selectedDay.ok }}</dd>
              </div>
              <div>
                <dt>{{ t('status.statAvg') }}</dt>
                <dd>{{ selectedDay.avgResponseTimeMs === null ? '–' : `${selectedDay.avgResponseTimeMs} ms` }}</dd>
              </div>
              <div v-if="slowest">
                <dt>{{ t('status.statSlowest') }}</dt>
                <dd>{{ slowest.responseTimeMs }} ms <small>{{ clock(slowest.observedAt) }}</small></dd>
              </div>
            </dl>

            <template v-if="checks">
              <h4>{{ t('status.allChecks') }}</h4>
              <ol class="uptime__ticks">
                <li
                  v-for="check in checks"
                  :key="check.observedAt"
                  :class="check.success ? 'is-up' : 'is-down'"
                  :title="`${clock(check.observedAt)} · ${check.success ? `${check.responseTimeMs} ms` : t('status.checkFailed')}`"
                />
              </ol>
              <p
                v-if="checks.length > 0"
                class="uptime__ticks-axis"
              >
                <span>{{ clock(checks[0].observedAt) }}</span>
                <span>{{ clock(checks[checks.length - 1].observedAt) }}</span>
              </p>

              <template v-if="failedChecks.length > 0">
                <h4>{{ t('status.failedChecks') }}</h4>
                <div class="table-wrap">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th scope="col">
                          {{ t('status.colTime') }}
                        </th>
                        <th
                          scope="col"
                          class="num"
                        >
                          {{ t('status.colDuration') }}
                        </th>
                        <th scope="col">
                          {{ t('status.colReason') }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="check in failedChecks"
                        :key="check.observedAt"
                      >
                        <th scope="row">
                          {{ clock(check.observedAt) }}
                        </th>
                        <td class="num">
                          {{ check.responseTimeMs }} ms
                        </td>
                        <td>
                          <code v-if="check.errorMessage">{{ check.errorMessage }}</code>
                          <template v-else>
                            {{ t('status.noReason') }}
                          </template>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </template>
            <p
              v-else
              class="uptime__day-note"
            >
              {{ checksFailed ? t('status.checksUnavailable') : t('status.checksLoading') }}
            </p>
          </section>
          <p class="uptime__meta">
            <span v-if="source.latest">{{ t('status.lastCheck', {time: clock(source.latest.observedAt)}) }}<template v-if="source.latest.success"> · {{ source.latest.responseTimeMs }} ms</template></span>
            <span>{{ source.endpoint }}</span>
          </p>
        </li>
      </ul>

      <div class="uptime__legend">
        <span><i class="uptime__swatch is-up" /> {{ t('status.legendUp') }}</span>
        <span><i class="uptime__swatch is-degraded" /> {{ t('status.legendDegraded') }}</span>
        <span><i class="uptime__swatch is-down" /> {{ t('status.legendDown') }}</span>
        <span><i class="uptime__swatch is-none" /> {{ t('status.legendNone') }}</span>
      </div>

      <p class="uptime__hint">
        {{ t('status.clickHint') }}
      </p>

      <p class="uptime__how">
        {{ t('status.how', {minutes: Math.round(summary.pollingIntervalSeconds / 60), since: summary.measuredSince ? day(summary.measuredSince) : '–'}) }}
        <a :href="feedUrl">{{ t('status.feed') }}</a>
      </p>
    </template>

    <p
      v-else-if="!failed"
      class="uptime__loading"
    >
      {{ slow ? t('status.waking') : t('status.loading') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {XMarkIcon} from '@heroicons/vue/16/solid';

interface UptimeDay {
  date: string;
  checks: number;
  ok: number;
  uptime: number;
  avgResponseTimeMs: number | null;
}
interface SourceUptime {
  uri: string;
  name: Record<string, string>;
  endpoint: string;
  latest: {observedAt: string; success: boolean; responseTimeMs: number} | null;
  uptime: {last24h: number | null; last7d: number | null; period: number | null};
  days: UptimeDay[];
}
/** One check of one source: what a day of the bar is made of. */
interface DayCheck {
  observedAt: string;
  success: boolean;
  responseTimeMs: number;
  errorMessage: string | null;
}
interface UptimeSummary {
  generatedAt: string;
  pollingIntervalSeconds: number;
  measuredSince: string | null;
  uptime: {last24h: number | null; last7d: number | null; period: number | null};
  sources: SourceUptime[];
}

const {t, locale} = useI18n();
const apiBase = (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql$/, '');
const feedUrl = `${apiBase}/status/observations/latest`;

const summary = ref<UptimeSummary | null>(null);
const failed = ref(false);
// The test environment sleeps when nobody uses it; its first answer can then take half a minute.
const slow = ref(false);
let timer: number | undefined;
let stopped = false;

async function load() {
  const patience = window.setTimeout(() => {
    slow.value = true;
  }, 4_000);
  const abort = new AbortController();
  const giveUp = window.setTimeout(() => abort.abort(), 45_000);
  try {
    const response = await fetch(`${apiBase}/status/uptime?days=90`, {headers: {Accept: 'application/json'}, signal: abort.signal});
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    summary.value = await response.json() as UptimeSummary;
    failed.value = false;
  } catch {
    failed.value = true;
  } finally {
    window.clearTimeout(patience);
    window.clearTimeout(giveUp);
    slow.value = false;
  }
  // Every minute once it works; every few seconds while it does not answer yet.
  if (!stopped) {
    timer = window.setTimeout(load, failed.value ? 5_000 : 60_000);
  }
}

onMounted(load);
onBeforeUnmount(() => {
  stopped = true;
  window.clearTimeout(timer);
  checksAbort?.abort();
});

const downCount = computed(() => summary.value?.sources.filter(source => source.latest && !source.latest.success).length ?? 0);

// One slot per day, from the first measured day up to today: at least 30, at most 90.
const slots = computed(() => {
  const today = new Date();
  const first = summary.value?.measuredSince ? new Date(`${summary.value.measuredSince}T12:00:00`) : today;
  const measured = Math.round((today.getTime() - first.getTime()) / 86_400_000) + 1;
  const count = Math.min(90, Math.max(30, measured));
  const days: string[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back, 12);
    days.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  }
  return days;
});

const dayOf = (source: SourceUptime, date: string) => source.days.find(entry => entry.date === date);

function slotClass(source: SourceUptime, date: string): string {
  const entry = dayOf(source, date);
  if (!entry) {
    return 'is-none';
  }
  if (entry.uptime >= 0.99) {
    return 'is-up';
  }
  return entry.uptime >= 0.5 ? 'is-degraded' : 'is-down';
}

// A click on a day opens what is behind it: the day's counts (already here) and every check of that day,
// fetched when asked. If the checks cannot be fetched the counts are still shown.
const selected = ref<{uri: string; date: string} | null>(null);
const checks = ref<DayCheck[] | null>(null);
const checksFailed = ref(false);
let checksAbort: AbortController | null = null;

const isSelected = (source: SourceUptime, date: string) => selected.value?.uri === source.uri && selected.value.date === date;
const selectedDay = computed(() => {
  const source = summary.value?.sources.find(item => item.uri === selected.value?.uri);
  return source && selected.value ? dayOf(source, selected.value.date) : undefined;
});
const failedChecks = computed(() => checks.value?.filter(check => !check.success) ?? []);
const slowest = computed(() => {
  const answered = checks.value?.filter(check => check.success) ?? [];
  return answered.length > 0 ? answered.reduce((worst, check) => check.responseTimeMs > worst.responseTimeMs ? check : worst) : null;
});

async function toggleDay(source: SourceUptime, date: string) {
  checksAbort?.abort();
  if (isSelected(source, date)) {
    selected.value = null;
    return;
  }
  selected.value = {uri: source.uri, date};
  checks.value = null;
  checksFailed.value = false;
  const abort = checksAbort = new AbortController();
  try {
    const response = await fetch(`${apiBase}/status/uptime/checks?source=${encodeURIComponent(source.uri)}&date=${date}`, {headers: {Accept: 'application/json'}, signal: abort.signal});
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    checks.value = (await response.json() as {checks: DayCheck[]}).checks;
  } catch {
    if (!abort.signal.aborted) {
      checksFailed.value = true;
    }
  }
}

function slotTitle(source: SourceUptime, date: string): string {
  const entry = dayOf(source, date);
  if (!entry) {
    return `${day(date)}: ${t('status.legendNone')}`;
  }
  const time = entry.avgResponseTimeMs === null ? '' : ` · ${entry.avgResponseTimeMs} ms`;
  return `${day(date)}: ${percent(entry.uptime)} (${entry.ok}/${entry.checks})${time}`;
}

function stateClass(source: SourceUptime): string {
  if (!source.latest) {
    return 'is-unknown';
  }
  return source.latest.success ? 'is-ok' : 'is-down';
}

function stateLabel(source: SourceUptime): string {
  if (!source.latest) {
    return t('search.statusUnknown');
  }
  return source.latest.success ? t('termSources.statusAvailable') : t('termSources.statusUnavailable');
}

const percent = (value: number | null) => value === null
  ? '–'
  : new Intl.NumberFormat(locale.value, {style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
const clock = (iso: string) => new Intl.DateTimeFormat(locale.value, {hour: '2-digit', minute: '2-digit'}).format(new Date(iso));
const day = (date: string) => new Intl.DateTimeFormat(locale.value, {day: 'numeric', month: 'long', year: 'numeric'}).format(new Date(`${date}T12:00:00`));
</script>

<style scoped>
.uptime { padding-bottom: var(--s-7); }
.uptime__banner { display: flex; align-items: center; gap: var(--s-4); padding: var(--s-5); border: 1px solid var(--vtn-border); border-radius: 0.75rem; background: var(--vtn-surface); box-shadow: var(--shadow-sm); margin-top: var(--s-5); }
.uptime__banner strong { display: block; font-size: var(--fs-xl); }
.uptime__banner span { font-size: var(--fs-sm); color: var(--vtn-muted); }
.uptime__bullet { flex: none; width: 1.75rem; height: 1.75rem; border-radius: 50%; background: var(--vtn-ok); }
.uptime__banner.is-down .uptime__bullet { background: var(--vtn-danger); }
.uptime__banner.is-ok strong { color: var(--vtn-ok); }

.uptime__totals { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-4); margin: var(--s-5) 0 0; }
.uptime__totals div { padding: var(--s-4); border: 1px solid var(--vtn-border); border-radius: 0.75rem; background: var(--vtn-surface); }
.uptime__totals dt { font-size: var(--fs-sm); color: var(--vtn-muted); }
.uptime__totals dd { margin: var(--s-1) 0 0; font-size: var(--fs-2xl); font-weight: 600; font-variant-numeric: tabular-nums; }

.uptime__heading { font-size: var(--fs-xl); margin: var(--s-6) 0 var(--s-3); }
.uptime__list { list-style: none; margin: 0; padding: 0; border: 1px solid var(--vtn-border); border-radius: 0.75rem; background: var(--vtn-surface); }
.uptime__source { padding: var(--s-4) var(--s-5); }
.uptime__source + .uptime__source { border-top: 1px solid var(--vtn-border); }
.uptime__row { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--s-2) var(--s-4); }
.uptime__name { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--s-3); }
.uptime__uptime { font-size: var(--fs-sm); color: var(--vtn-muted); font-variant-numeric: tabular-nums; }
.uptime__state { display: inline-flex; align-items: center; gap: var(--s-2); font-size: var(--fs-sm); font-weight: 500; }
.uptime__state.is-ok { color: var(--vtn-ok); }
.uptime__state.is-down { color: var(--vtn-danger); }
.uptime__state.is-unknown { color: var(--vtn-muted); }

.uptime__bar { list-style: none; display: flex; gap: 2px; height: 1.75rem; margin: var(--s-3) 0 0; padding: 0; }
.uptime__bar li { flex: 1 1 0; min-width: 0; display: flex; }
.uptime__slot { flex: 1 1 auto; min-width: 0; padding: 0; border: 0; border-radius: 2px; cursor: pointer; }
.uptime__slot:disabled { cursor: default; }
.uptime__slot.is-up, .uptime__swatch.is-up, .uptime__ticks .is-up { background: var(--vtn-ok); }
.uptime__slot.is-degraded, .uptime__swatch.is-degraded { background: #e0a100; }
.uptime__slot.is-down, .uptime__swatch.is-down, .uptime__ticks .is-down { background: var(--vtn-danger); }
.uptime__slot.is-none, .uptime__swatch.is-none { background: var(--vtn-neutral-bg); }
.uptime__slot:not(:disabled):hover { opacity: 0.7; }
.uptime__slot.is-selected { outline: 2px solid var(--vtn-text); outline-offset: 2px; }

/* What is behind one day, opened under the bar. */
.uptime__day { margin-top: var(--s-4); padding: var(--s-4); border: 1px solid var(--vtn-border); border-radius: 0.5rem; background: var(--vtn-surface-2); display: grid; gap: var(--s-3); }
.uptime__day-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2) var(--s-3); }
.uptime__day-head h3 { font-size: var(--fs-lg); }
.uptime__day-close { margin-left: auto; }
.uptime__badge { padding: 0.1rem 0.6rem; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600; }
.uptime__badge.is-up { background: var(--vtn-ok-bg); color: var(--vtn-ok); }
.uptime__badge.is-degraded { background: var(--vtn-warn-bg); color: var(--vtn-warn); }
.uptime__badge.is-down { background: var(--vtn-danger-bg); color: var(--vtn-danger); }
.uptime__day-text { max-width: 46rem; font-size: var(--fs-sm); color: var(--vtn-text-2); }
.uptime__day-stats { display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-6); margin: 0; }
.uptime__day-stats dt { font-size: var(--fs-xs); color: var(--vtn-muted); }
.uptime__day-stats dd { margin: 0; font-size: var(--fs-lg); font-weight: 600; font-variant-numeric: tabular-nums; }
.uptime__day-stats small { font-size: var(--fs-xs); font-weight: 400; color: var(--vtn-muted); }
.uptime__day h4 { font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.08em; color: var(--vtn-muted); }
.uptime__ticks { list-style: none; display: flex; gap: 1px; height: 1.25rem; margin: 0; padding: 0; }
.uptime__ticks li { flex: 1 1 0; min-width: 0; border-radius: 1px; }
.uptime__ticks-axis { display: flex; justify-content: space-between; margin-top: calc(var(--s-2) * -1); font-size: var(--fs-xs); color: var(--vtn-muted); font-variant-numeric: tabular-nums; }
.uptime__day-note { font-size: var(--fs-sm); color: var(--vtn-muted); }
.uptime__day code { font-size: var(--fs-xs); overflow-wrap: anywhere; }
.uptime__hint { margin-top: var(--s-3); font-size: var(--fs-sm); color: var(--vtn-muted); }

.uptime__meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--s-1) var(--s-4); margin: var(--s-2) 0 0; font-size: var(--fs-xs); color: var(--vtn-muted); }
.uptime__meta span:last-child { font-family: var(--vtn-mono); overflow-wrap: anywhere; }

.uptime__legend { display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-5); margin-top: var(--s-4); font-size: var(--fs-sm); color: var(--vtn-text-2); }
.uptime__legend span { display: inline-flex; align-items: center; gap: var(--s-2); }
.uptime__swatch { width: 0.75rem; height: 0.75rem; border-radius: 2px; }
.uptime__how { margin-top: var(--s-4); max-width: 46rem; font-size: var(--fs-sm); color: var(--vtn-muted); }
.uptime__loading { margin-top: var(--s-5); color: var(--vtn-muted); }

@media (max-width: 40rem) {
  .uptime__totals { grid-template-columns: 1fr; }
  .uptime__bar { height: 1.25rem; gap: 1px; }
}
</style>
