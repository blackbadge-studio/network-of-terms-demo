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
              :class="slotClass(source, slot)"
              :title="slotTitle(source, slot)"
            />
          </ol>
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
.uptime__bar li { flex: 1 1 0; min-width: 0; border-radius: 2px; }
.uptime__bar li.is-up, .uptime__swatch.is-up { background: var(--vtn-ok); }
.uptime__bar li.is-degraded, .uptime__swatch.is-degraded { background: #e0a100; }
.uptime__bar li.is-down, .uptime__swatch.is-down { background: var(--vtn-danger); }
.uptime__bar li.is-none, .uptime__swatch.is-none { background: var(--vtn-neutral-bg); }
.uptime__bar li:hover { opacity: 0.7; }

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
