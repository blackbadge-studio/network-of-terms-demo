<template>
  <li
    :id="itemId"
    role="treeitem"
    class="tree__item"
    :aria-level="level"
    :aria-expanded="node.hasNarrower ? expanded : undefined"
    :aria-selected="selected"
    :tabindex="focused ? 0 : -1"
    :data-uri="node.uri"
    @focus.self="$emit('focus', node.uri)"
  >
    <div
      class="tree__row"
      :class="{'is-selected': selected}"
    >
      <button
        v-if="node.hasNarrower"
        type="button"
        class="tree__toggle"
        tabindex="-1"
        :aria-label="t(expanded ? 'browse.collapse' : 'browse.expand', {label})"
        @click.stop="$emit('toggle', node.uri)"
      >
        <span
          v-if="children?.status === 'loading'"
          class="spinner"
          aria-hidden="true"
        />
        <ChevronRightIcon
          v-else
          class="icon tree__chev"
          :class="{'is-open': expanded}"
        />
      </button>
      <span
        v-else
        class="tree__leaf"
        aria-hidden="true"
      />
      <button
        type="button"
        class="tree__label"
        tabindex="-1"
        @click.stop="$emit('select', node.uri)"
      >
        {{ label }}
      </button>
      <span
        v-if="node.broader.length > 1"
        class="tree__also"
      >
        {{ t('browse.alsoUnder') }}
        <template
          v-for="(parent, index) in otherParents"
          :key="parent.uri"
        >
          <router-link
            :to="{name: 'browse', query: {bron: source, term: parent.uri}}"
            tabindex="-1"
            @click.stop
          >
            {{ relatedLabel(parent) }}
          </router-link><template v-if="index < otherParents.length - 1">, </template>
        </template>
      </span>
    </div>

    <template v-if="node.hasNarrower && expanded">
      <p
        v-if="children?.status === 'error' || children?.status === 'timeout'"
        class="tree__error"
        role="status"
      >
        <ExclamationTriangleIcon class="icon" />
        <span>{{ t(children.status === 'timeout' ? 'api.TimeoutError' : 'api.ServerError') }}</span>
        <button
          type="button"
          class="link-btn"
          tabindex="-1"
          @click.stop="$emit('retry', node.uri)"
        >
          {{ t('browse.retry') }}
        </button>
      </p>
      <p
        v-else-if="children?.status === 'ok' && children.nodes.length === 0"
        class="tree__empty"
      >
        {{ t('browse.empty') }}
      </p>
      <ul
        v-else-if="children?.status === 'ok'"
        role="group"
        class="tree__group"
      >
        <BrowseNodeItem
          v-for="child in children.nodes"
          :key="child.uri"
          :node="child"
          :source="source"
          :level="level + 1"
          :parent-uri="node.uri"
          :expanded-set="expandedSet"
          :children-map="childrenMap"
          :selected-uri="selectedUri"
          :focused-uri="focusedUri"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
          @retry="$emit('retry', $event)"
          @focus="$emit('focus', $event)"
        />
      </ul>
    </template>
  </li>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {ChevronRightIcon, ExclamationTriangleIcon} from '@heroicons/vue/16/solid';
import type {BrowseNode} from '../../browse';
import {RelatedTerm, filterLanguageStrings} from '../../query';
import type {ChildrenState} from './tree';

defineOptions({name: 'BrowseNodeItem'});

const props = defineProps({
  node: {type: Object as PropType<BrowseNode>, required: true},
  source: {type: String, required: true},
  level: {type: Number, default: 1},
  parentUri: {type: String, default: ''},
  expandedSet: {type: Object as PropType<Set<string>>, required: true},
  childrenMap: {type: Object as PropType<Map<string, ChildrenState>>, required: true},
  selectedUri: {type: String, default: null},
  focusedUri: {type: String, default: null},
});
defineEmits<{toggle: [uri: string], select: [uri: string], retry: [uri: string], focus: [uri: string]}>();

const {t} = useI18n();
const label = computed(() => props.node.prefLabel.filter(Boolean)[0] ?? props.node.uri);
const expanded = computed(() => props.expandedSet.has(props.node.uri));
const selected = computed(() => props.selectedUri === props.node.uri);
const focused = computed(() => props.focusedUri === props.node.uri);
const children = computed(() => props.childrenMap.get(props.node.uri));
const otherParents = computed(() => props.node.broader.filter(parent => parent.uri !== props.parentUri));
const relatedLabel = (term: RelatedTerm) => filterLanguageStrings(term.prefLabel)[0] ?? term.uri;
const itemId = computed(() => 'tree-' + props.node.uri.replace(/[^a-z0-9]+/gi, '-'));
</script>
