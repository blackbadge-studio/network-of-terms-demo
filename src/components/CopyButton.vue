<template>
  <button
    type="button"
    :class="label ? ['btn', 'btn--secondary', 'btn--sm'] : ['copy-icon', {'is-copied': copied}]"
    :aria-label="label ? undefined : t('search.copyUri')"
    :title="label ? undefined : t('search.copyUri')"
    @click="copy"
  >
    <ClipboardDocumentCheckIcon
      v-if="copied"
      class="icon"
    />
    <ClipboardDocumentIcon
      v-else
      class="icon"
    />
    <template v-if="label">
      {{ copied ? t('search.copied') : t(label) }}
    </template>
    <span
      class="sr-only"
      aria-live="polite"
    >{{ copied ? t('search.copied') : '' }}</span>
  </button>
</template>

<script lang="ts" setup>
import {onBeforeUnmount, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {ClipboardDocumentCheckIcon, ClipboardDocumentIcon} from '@heroicons/vue/16/solid';

const props = defineProps({
  text: {type: String, required: true},
  label: {type: String, default: ''},
});

const {t} = useI18n();
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text);
  } catch {
    // Fallback for contexts without the async clipboard API.
    const area = document.createElement('textarea');
    area.value = props.text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
  copied.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => { copied.value = false; }, 1800);
}

onBeforeUnmount(() => clearTimeout(timer));
</script>
