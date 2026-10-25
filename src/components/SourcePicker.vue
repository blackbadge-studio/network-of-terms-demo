<template>
  <div
    ref="root"
    class="picker"
    @keydown.esc.prevent="close(true)"
    @focusout="onFocusOut"
    @pointerdown="pointerInside = true"
    @pointerup="pointerInside = false"
    @pointercancel="pointerInside = false"
  >
    <div class="picker__control">
      <button
        id="datasets"
        ref="trigger"
        type="button"
        class="picker__trigger"
        aria-haspopup="dialog"
        :aria-expanded="open"
        aria-controls="datasets-panel"
        :aria-invalid="invalid || undefined"
        :aria-describedby="describedBy"
        @click="open ? close() : show()"
      >
        <span
          v-if="selected.length === 0"
          class="picker__placeholder"
        >{{ t('search.placeholderDatasets') }}</span>
        <span
          v-else
          class="picker__count"
        >{{ t('search.sourcesSelected', selected.length) }}</span>
        <ChevronDownIcon class="icon picker__chev" />
      </button>

      <div
        v-if="open"
        id="datasets-panel"
        class="picker__panel"
        role="dialog"
        :aria-label="t('search.pickerLabel')"
        :style="{'--picker-max-height': panelMaxHeight}"
      >
        <div class="picker__search">
          <label
            for="datasets-search"
            class="sr-only"
          >{{ t('search.searchSources') }}</label>
          <input
            id="datasets-search"
            ref="searchInput"
            v-model="query"
            type="search"
            class="input"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('search.searchSources')"
            @keydown.down.prevent="focusOption(0)"
          >
        </div>
        <div class="picker__actions">
          <button
            type="button"
            class="link-btn"
            @click="selectAll"
          >
            {{ t('search.pickerAll') }} ({{ sources.length }})
          </button>
          <button
            type="button"
            class="link-btn"
            :disabled="selected.length === 0"
            @click="selectNone"
          >
            {{ t('search.pickerNone') }}
          </button>
          <span class="spacer" />
          <span aria-live="polite">{{ t('search.sourcesSelected', selected.length) }}</span>
        </div>

        <div
          ref="list"
          class="picker__list"
          @keydown.down.prevent="moveFocus(1)"
          @keydown.up.prevent="moveFocus(-1)"
        >
          <template v-if="query.trim()">
            <p
              v-if="filtered.length === 0"
              class="picker__empty"
            >
              {{ t('search.noSourcesMatch', {q: query.trim()}) }}
            </p>
            <div
              v-else
              class="picker__group"
            >
              <SourcePickerOption
                v-for="source in filtered"
                :key="source.uri"
                :source="source"
                :checked="selectedSet.has(source.uri)"
                @toggle="toggle(source.uri)"
              />
            </div>
          </template>

          <template v-else>
            <div
              v-for="group in groups"
              :key="group.uri"
              class="picker__group"
            >
              <div class="picker__group-head">
                <button
                  type="button"
                  class="picker__group-toggle"
                  :aria-expanded="expanded.has(group.uri)"
                  :aria-controls="`group-${group.id}`"
                  @click="toggleGroup(group.uri)"
                >
                  <ChevronDownIcon class="icon picker__chev" />
                  {{ group.name }}
                  <span class="picker__group-count">{{ t('search.pickerOf', {selected: group.selectedCount, total: group.sources.length}) }}</span>
                </button>
                <label class="picker__group-all">
                  <input
                    type="checkbox"
                    :checked="group.selectedCount === group.sources.length"
                    :indeterminate.prop="group.selectedCount > 0 && group.selectedCount < group.sources.length"
                    @change="setGroup(group, ($event.target as HTMLInputElement).checked)"
                  >
                  {{ t('search.pickerAllInGroup') }}
                </label>
              </div>
              <div
                v-show="expanded.has(group.uri)"
                :id="`group-${group.id}`"
              >
                <SourcePickerOption
                  v-for="source in group.sources"
                  :key="source.uri"
                  :source="source"
                  :checked="selectedSet.has(source.uri)"
                  @toggle="toggle(source.uri)"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <ul
      v-if="selectedSources.length > 0"
      class="picker__selected"
      :aria-label="t('search.labelTermSources')"
    >
      <li
        v-for="source in selectedSources"
        :key="source.uri"
        class="chip"
      >
        <span
          class="dot"
          :class="{'dot--off': source.status && !source.status.isAvailable}"
          aria-hidden="true"
        />
        {{ source.alternateName || source.name }}
        <button
          type="button"
          class="chip__remove"
          :aria-label="t('search.removeSource', {name: source.name})"
          @click="toggle(source.uri)"
        >
          <XMarkIcon class="icon" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {ChevronDownIcon, XMarkIcon} from '@heroicons/vue/16/solid';
import state from '../store';
import {SOURCES_QUERY, Source, holderName} from '../query';
import SourcePickerOption from './SourcePickerOption.vue';

const props = defineProps({
  invalid: {type: Boolean, default: false},
  describedBy: {type: String, default: undefined},
  /** Open the panel as soon as the picker mounts (minimaal theme: "Bronnen kiezen"). */
  autoOpen: {type: Boolean, default: false},
});

const {t, locale} = useI18n();

// Query variables and header make villus cache per locale and refetch on change.
const variables = reactive({locale});
const headers = reactive({'Accept-Language': locale});
const {data} = useQuery<{sources: Source[]}>({
  query: SOURCES_QUERY,
  variables,
  context: {headers},
});

watch(data, (newData) => {
  if (newData?.sources) {
    state.sources = newData.sources;
  }
}, {immediate: true});

const sources = computed(() =>
  [...state.sources].sort((a, b) => a.name.localeCompare(b.name, locale.value)),
);
const selected = computed(() => state.selectedDatasets);
const selectedSet = computed(() => new Set(state.selectedDatasets));
const selectedSources = computed(() =>
  sources.value.filter(source => selectedSet.value.has(source.uri)),
);

interface Group {
  uri: string;
  id: string;
  name: string;
  sources: Source[];
  selectedCount: number;
}

const groups = computed<Group[]>(() => {
  const map = new Map<string, Group>();
  let index = 0;
  for (const source of sources.value) {
    const genres = source.genres.length > 0 ? source.genres : [{uri: '_other', name: '—'}];
    for (const genre of genres) {
      let group = map.get(genre.uri);
      if (!group) {
        group = {uri: genre.uri, id: String(index++), name: genre.name, sources: [], selectedCount: 0};
        map.set(genre.uri, group);
      }
      group.sources.push(source);
      if (selectedSet.value.has(source.uri)) {
        group.selectedCount++;
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, locale.value));
});

const query = ref('');
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return sources.value.filter(source =>
    [source.name, source.alternateName, holderName(source), source.creators?.[0]?.name]
      .some(value => value?.toLowerCase().includes(q)),
  );
});

const open = ref(false);
const expanded = reactive(new Set<string>());
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const searchInput = ref<HTMLInputElement | null>(null);
const list = ref<HTMLElement | null>(null);

const panelMaxHeight = ref('min(28rem, 70vh)');

// Keep the whole panel on screen: scroll the trigger up if needed, then size the
// panel to the space below it.
function sizePanel() {
  const rect = trigger.value?.getBoundingClientRect();
  if (!rect) {
    return;
  }
  const minHeight = 18 * 16;
  let space = window.innerHeight - rect.bottom - 24;
  if (space < minHeight) {
    window.scrollBy({top: Math.min(rect.top - 16, minHeight - space), behavior: 'auto'});
    space = window.innerHeight - (trigger.value?.getBoundingClientRect().bottom ?? rect.bottom) - 24;
  }
  panelMaxHeight.value = `${Math.max(minHeight, Math.min(space, 28 * 16))}px`;
}

function show() {
  open.value = true;
  sizePanel();
  nextTick(() => searchInput.value?.focus());
}

function close(refocus = false) {
  if (!open.value) {
    return;
  }
  open.value = false;
  query.value = '';
  if (refocus) {
    trigger.value?.focus();
  }
}

// Close when keyboard focus leaves the picker. Pointer clicks on non-focusable
// text inside the panel can move focus to an ancestor, so those are ignored.
const pointerInside = ref(false);
function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (!pointerInside.value && next && root.value && !root.value.contains(next)) {
    close();
  }
}

function onDocumentPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown);
  if (props.autoOpen) {
    show();
  }
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown));

function toggle(uri: string) {
  state.selectedDatasets = selectedSet.value.has(uri)
    ? state.selectedDatasets.filter(item => item !== uri)
    : [...state.selectedDatasets, uri];
}

function setGroup(group: Group, checked: boolean) {
  const uris = group.sources.map(source => source.uri);
  state.selectedDatasets = checked
    ? [...new Set([...state.selectedDatasets, ...uris])]
    : state.selectedDatasets.filter(uri => !uris.includes(uri));
}

function selectAll() {
  state.selectedDatasets = sources.value.map(source => source.uri);
}

function selectNone() {
  state.selectedDatasets = [];
}

function toggleGroup(uri: string) {
  if (expanded.has(uri)) {
    expanded.delete(uri);
  } else {
    expanded.add(uri);
  }
}

function options(): HTMLInputElement[] {
  if (!list.value) {
    return [];
  }
  return Array.from(list.value.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    .filter(input => input.offsetParent !== null);
}

function focusOption(index: number) {
  const items = options();
  items[Math.max(0, Math.min(index, items.length - 1))]?.focus();
}

function moveFocus(delta: number) {
  const items = options();
  const current = items.indexOf(document.activeElement as HTMLInputElement);
  if (current === -1) {
    focusOption(0);
    return;
  }
  focusOption(current + delta);
}
</script>
