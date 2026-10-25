<template>
  <header class="source__head">
    <h2 class="source__title">
      {{ source.name }}
      <small v-if="source.alternateName">({{ source.alternateName }})</small>
    </h2>
    <span
      v-if="holder"
      class="source__holder"
    >{{ holder }}</span>
    <span class="source__state">
      <span
        class="status"
        :class="`status--${state}`"
        :title="responseTimeMs ? t('search.responseTime', {ms: responseTimeMs}) : undefined"
      >
        {{ label }}
      </span>
      <button
        v-if="state === 'error' || state === 'timeout'"
        type="button"
        class="btn btn--secondary btn--sm"
        :disabled="retrying"
        @click="$emit('retry')"
      >
        <ArrowPathIcon class="icon" />
        {{ retrying ? t('search.retrying') : t('search.retry') }}
      </button>
    </span>
  </header>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowPathIcon} from '@heroicons/vue/16/solid';
import {Source, SourceState, holderName} from '../query';

const props = defineProps({
  source: {type: Object as PropType<Source>, required: true},
  state: {type: String as PropType<SourceState>, default: 'loading'},
  count: {type: Number, default: 0},
  responseTimeMs: {type: Number, default: 0},
  retrying: {type: Boolean, default: false},
});
defineEmits<{retry: []}>();

const {t} = useI18n();
const holder = computed(() => holderName(props.source));
const label = computed(() => {
  switch (props.state) {
    case 'ok': return t('search.stateResults', props.count);
    case 'none': return t('search.stateNone');
    case 'error': return t('search.stateUnreachable');
    case 'timeout': return t('search.stateTimeout');
    default: return t('search.stateSearching');
  }
});
</script>
