<template>
  <div
    ref="root"
    class="theme"
    @keydown.esc.prevent="close(true)"
    @focusout="onFocusOut"
  >
    <button
      ref="button"
      type="button"
      class="theme__btn"
      aria-haspopup="menu"
      :aria-expanded="open"
      aria-controls="theme-menu"
      :aria-label="t('theme.current', {name: t(`theme.${theme}.name`)})"
      :title="t('theme.label')"
      @click="open ? close() : show()"
      @keydown.down.prevent="show(0)"
      @keydown.up.prevent="show(THEME_IDS.length - 1)"
    >
      <SwatchIcon class="icon" />
      <span>{{ t(`theme.${theme}.name`) }}</span>
      <ChevronDownIcon class="icon theme__chev" />
    </button>
    <ul
      v-if="open"
      id="theme-menu"
      role="menu"
      class="theme__menu"
      :aria-label="t('theme.label')"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.home.prevent="focusItem(0)"
      @keydown.end.prevent="focusItem(THEME_IDS.length - 1)"
    >
      <li
        v-for="id in THEME_IDS"
        :key="id"
        role="none"
      >
        <button
          ref="items"
          type="button"
          role="menuitemradio"
          class="theme__item"
          :class="{'is-active': id === theme}"
          :aria-checked="id === theme"
          @click="choose(id)"
        >
          <span
            class="theme__swatch"
            :data-swatch="id"
            aria-hidden="true"
          />
          <span class="theme__text">
            <b>{{ t(`theme.${id}.name`) }}</b>
            <small>{{ t(`theme.${id}.description`) }}</small>
          </span>
          <CheckIcon
            v-if="id === theme"
            class="icon theme__check"
          />
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {CheckIcon, ChevronDownIcon, SwatchIcon} from '@heroicons/vue/16/solid';
import {THEME_IDS, ThemeId, useTheme} from '../theme';

const {t} = useI18n();
const {theme, setTheme} = useTheme();

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const button = ref<HTMLButtonElement | null>(null);
const items = ref<HTMLButtonElement[]>([]);

function show(focusIndex?: number) {
  open.value = true;
  nextTick(() => focusItem(focusIndex ?? THEME_IDS.indexOf(theme.value)));
}

function close(refocus = false) {
  if (!open.value) {
    return;
  }
  open.value = false;
  if (refocus) {
    button.value?.focus();
  }
}

function choose(id: ThemeId) {
  setTheme(id);
  close(true);
}

function focusItem(index: number) {
  const list = items.value;
  const wrapped = (index + list.length) % list.length;
  list[wrapped]?.focus();
}

function move(delta: number) {
  const current = items.value.indexOf(document.activeElement as HTMLButtonElement);
  focusItem(current === -1 ? 0 : current + delta);
}

function onFocusOut(event: FocusEvent) {
  const next = event.relatedTarget as Node | null;
  if (next && root.value && !root.value.contains(next)) {
    close();
  }
}

function onPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown));
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown));
</script>
