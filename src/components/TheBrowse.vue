<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('browse.title') }}
    </h1>
    <p class="page__lead">
      {{ t('browse.lead') }}
    </p>

    <div class="browse__controls">
      <div class="field">
        <label
          for="browse-source"
          class="field__label"
        >{{ t('browse.source') }}</label>
        <select
          id="browse-source"
          class="input browse__select"
          :value="sourceUri ?? ''"
          @change="chooseSource(($event.target as HTMLSelectElement).value)"
        >
          <option value="">
            {{ t('browse.choose') }}
          </option>
          <option
            v-for="source in hierarchySources"
            :key="source.uri"
            :value="source.uri"
          >
            {{ source.name }}<template v-if="source.alternateName">
              ({{ source.alternateName }})
            </template>
          </option>
        </select>
        <p
          v-if="sourcesLoaded && hierarchySources.length === 0"
          class="field__hint"
        >
          {{ t('browse.noSources') }}
        </p>
      </div>
    </div>

    <p
      v-if="apiAvailable === false"
      class="notice notice--warn"
      role="status"
    >
      <ExclamationTriangleIcon class="icon" />
      <span>{{ t('browse.notAvailable') }}</span>
    </p>

    <p
      v-if="polyNote"
      class="notice notice--info"
      role="status"
    >
      <span>{{ t('browse.pathNote') }}</span>
    </p>

    <div
      v-if="sourceUri && apiAvailable"
      class="browse"
    >
      <section
        class="browse__tree"
        :aria-label="t('browse.tree', {source: sourceName})"
      >
        <h2 class="browse__heading">
          {{ t('browse.top') }} · {{ sourceName }}
        </h2>
        <BrowseTree
          ref="treeRef"
          :source="sourceUri"
          :source-name="sourceName"
          :expanded-set="expanded"
          :children-map="children"
          :selected-uri="selectedUri ?? undefined"
          @toggle="toggle"
          @select="select"
          @retry="load"
        />
      </section>
      <BrowseDetail
        :uri="selectedUri ?? undefined"
        :source-uri="sourceUri"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useQuery} from 'villus';
import {ExclamationTriangleIcon} from '@heroicons/vue/16/solid';
import state from '../store';
import {SOURCES_QUERY, Source} from '../query';
import {browseNodes, hasBrowseApi, resolvePath, supportsHierarchy} from '../browse';
import BrowseTree from './browse/BrowseTree.vue';
import BrowseDetail from './browse/BrowseDetail.vue';
import {ChildrenState, ROOT} from './browse/tree';

const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();

// Sources (shared store; the picker may already have loaded them).
const {data: sourcesData} = useQuery<{sources: Source[]}>({
  query: SOURCES_QUERY,
  variables: reactive({locale}),
  context: {headers: reactive({'Accept-Language': locale})},
});
const sourcesLoaded = ref(state.sources.length > 0);
watch(sourcesData, (value) => {
  if (value?.sources) {
    state.sources = value.sources;
    sourcesLoaded.value = true;
  }
}, {immediate: true});
const hierarchySources = computed(() => state.sources.filter(supportsHierarchy));

const apiAvailable = ref<boolean | null>(null);
onMounted(async () => { apiAvailable.value = await hasBrowseApi(); });

// Tree state, keyed by the source; switching sources resets it.
const sourceUri = ref<string | null>((route.query.bron as string) || null);
const sourceName = computed(() => state.sources.find(source => source.uri === sourceUri.value)?.name ?? sourceUri.value ?? '');
const expanded = reactive(new Set<string>());
const children = reactive(new Map<string, ChildrenState>());
const selectedUri = ref<string | null>((route.query.term as string) || null);
const polyNote = ref(false);
const treeRef = ref<InstanceType<typeof BrowseTree> | null>(null);

async function load(uri: string) {
  if (!sourceUri.value) {
    return;
  }
  const source = sourceUri.value;
  children.set(uri, {status: 'loading', nodes: children.get(uri)?.nodes ?? []});
  const outcome = await browseNodes(source, uri === ROOT ? null : uri, locale.value);
  if (sourceUri.value !== source) {
    return;
  }
  if (outcome.status === 'ok') {
    children.set(uri, {status: 'ok', nodes: outcome.nodes});
  } else {
    children.set(uri, {status: outcome.status, nodes: [], message: outcome.message});
  }
}

function expand(uri: string) {
  expanded.add(uri);
  const current = children.get(uri);
  if (!current || current.status === 'error' || current.status === 'timeout') {
    load(uri);
  }
}

function toggle(uri: string) {
  if (expanded.has(uri)) {
    expanded.delete(uri);
  } else {
    expand(uri);
  }
  syncUrl();
}

function select(uri: string) {
  selectedUri.value = uri;
  polyNote.value = false;
  syncUrl();
}

function reset() {
  expanded.clear();
  children.clear();
  selectedUri.value = null;
  polyNote.value = false;
}

function chooseSource(uri: string) {
  reset();
  sourceUri.value = uri || null;
  if (sourceUri.value) {
    load(ROOT);
  }
  syncUrl();
}

/** Opens the path to `uri` (walking up via lookup) and selects it. */
async function openAt(uri: string) {
  if (!sourceUri.value) {
    return;
  }
  const path = await resolvePath(sourceUri.value, uri, locale.value);
  polyNote.value = path.polyhierarchy;
  if (!children.has(ROOT)) {
    await load(ROOT);
  }
  for (const ancestor of path.ancestors) {
    expanded.add(ancestor);
    if (!children.get(ancestor) || children.get(ancestor)?.status !== 'ok') {
      await load(ancestor);
    }
  }
  selectedUri.value = uri;
  syncUrl();
  treeRef.value?.focusUri(uri);
}

let syncing = false;
function syncUrl() {
  const query: Record<string, string> = {};
  if (sourceUri.value) {
    query.bron = sourceUri.value;
  }
  if (expanded.size > 0) {
    query.open = [...expanded].join(',');
  }
  if (selectedUri.value) {
    query.term = selectedUri.value;
  }
  syncing = true;
  router.replace({name: 'browse', query}).finally(() => { syncing = false; });
}

/** Restores the tree from the URL (initial load, back/forward, "Toon in boom" links). */
async function applyRoute() {
  const bron = (route.query.bron as string) || null;
  const open = ((route.query.open as string) || '').split(',').filter(Boolean);
  const term = (route.query.term as string) || null;
  if (bron !== sourceUri.value) {
    reset();
    sourceUri.value = bron;
  }
  if (!sourceUri.value) {
    return;
  }
  if (!children.has(ROOT)) {
    await load(ROOT);
  }
  for (const uri of open) {
    if (!expanded.has(uri)) {
      expanded.add(uri);
    }
    if (children.get(uri)?.status !== 'ok') {
      await load(uri);
    }
  }
  // A term that is not visible in the open tree (e.g. from "Toon in boom") gets its path walked up and expanded.
  if (term) {
    if (!isVisible(term)) {
      await openAt(term);
    } else {
      selectedUri.value = term;
    }
  }
}

const isVisible = (uri: string) => [...children.entries()].some(([parent, state_]) =>
  (parent === ROOT || expanded.has(parent)) && state_.nodes.some(node => node.uri === uri));

onMounted(applyRoute);
watch(() => route.query, () => {
  if (!syncing) {
    applyRoute();
  }
});
</script>
