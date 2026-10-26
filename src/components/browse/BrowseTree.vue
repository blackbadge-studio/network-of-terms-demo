<template>
  <div class="tree">
    <p class="tree__hint field__hint">
      {{ t('browse.keyboardHint') }}
    </p>
    <p
      v-if="root?.status === 'loading'"
      class="tree__loading"
    >
      <span
        class="spinner"
        aria-hidden="true"
      /> {{ t('browse.loading') }}
    </p>
    <p
      v-else-if="root?.status === 'error' || root?.status === 'timeout'"
      class="tree__error"
      role="alert"
    >
      <ExclamationTriangleIcon class="icon" />
      <span>{{ t(root.status === 'timeout' ? 'api.TimeoutError' : 'api.ServerError') }}</span>
      <button
        type="button"
        class="link-btn"
        @click="$emit('retry', ROOT)"
      >
        {{ t('browse.retry') }}
      </button>
    </p>
    <ul
      v-else-if="root?.status === 'ok'"
      ref="treeEl"
      role="tree"
      class="tree__group tree__group--root"
      :aria-label="t('browse.tree', {source: sourceName})"
      @keydown="onKeydown"
    >
      <BrowseNodeItem
        v-for="node in root.nodes"
        :key="node.uri"
        :node="node"
        :source="source"
        :level="1"
        :expanded-set="expandedSet"
        :children-map="childrenMap"
        :selected-uri="selectedUri"
        :focused-uri="focusedUri ?? selectedUri ?? root.nodes[0]?.uri"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
        @retry="$emit('retry', $event)"
        @focus="focusedUri = $event"
      />
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, PropType, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ExclamationTriangleIcon} from '@heroicons/vue/16/solid';
import BrowseNodeItem from './BrowseNodeItem.vue';
import {ChildrenState, ROOT} from './tree';

const props = defineProps({
  source: {type: String, required: true},
  sourceName: {type: String, default: ''},
  expandedSet: {type: Object as PropType<Set<string>>, required: true},
  childrenMap: {type: Object as PropType<Map<string, ChildrenState>>, required: true},
  selectedUri: {type: String, default: null},
});
const emit = defineEmits<{toggle: [uri: string], select: [uri: string], retry: [uri: string]}>();

const {t} = useI18n();
const root = computed(() => props.childrenMap.get(ROOT));
const treeEl = ref<HTMLElement | null>(null);
const focusedUri = ref<string | null>(null);

const visibleItems = () => Array.from(treeEl.value?.querySelectorAll<HTMLElement>('[role="treeitem"]') ?? []);

function focusItem(item: HTMLElement | undefined) {
  if (item) {
    focusedUri.value = item.dataset.uri ?? null;
    item.focus();
  }
}

/** Keyboard model of a WAI-ARIA tree: arrows move and open/close, Enter opens the term, Space toggles. */
function onKeydown(event: KeyboardEvent) {
  const item = (event.target as HTMLElement).closest<HTMLElement>('[role="treeitem"]');
  if (!item) {
    return;
  }
  const items = visibleItems();
  const index = items.indexOf(item);
  const uri = item.dataset.uri ?? '';
  const expandable = item.getAttribute('aria-expanded') !== null;
  const expanded = item.getAttribute('aria-expanded') === 'true';
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusItem(items[index + 1]);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusItem(items[index - 1]);
      break;
    case 'ArrowRight':
      event.preventDefault();
      if (expandable && !expanded) {
        emit('toggle', uri);
        nextTick(() => focusItem(item));
      } else if (expanded) {
        focusItem(item.querySelector<HTMLElement>('[role="treeitem"]') ?? undefined);
      }
      break;
    case 'ArrowLeft':
      event.preventDefault();
      if (expandable && expanded) {
        emit('toggle', uri);
      } else {
        focusItem(item.parentElement?.closest<HTMLElement>('[role="treeitem"]') ?? undefined);
      }
      break;
    case 'Home':
      event.preventDefault();
      focusItem(items[0]);
      break;
    case 'End':
      event.preventDefault();
      focusItem(items[items.length - 1]);
      break;
    case 'Enter':
      event.preventDefault();
      emit('select', uri);
      break;
    case ' ':
      event.preventDefault();
      if (expandable) {
        emit('toggle', uri);
      }
      break;
    default:
      return;
  }
}

/** Focus a node after it has been revealed (e.g. after expanding a path). */
function focusUri(uri: string) {
  nextTick(() => focusItem(visibleItems().find(item => item.dataset.uri === uri)));
}
defineExpose({focusUri});
</script>
