<template>
  <label class="picker__option">
    <input
      type="checkbox"
      :checked="checked"
      :value="source.uri"
      @change="$emit('toggle')"
    >
    <span
      class="dot"
      :class="{'dot--off': unavailable, 'dot--unknown': unknown}"
      :title="unknown ? t('search.statusUnknown') : unavailable ? t('search.unavailable') : t('search.available')"
    />
    <span class="picker__name">
      {{ source.name }}<template v-if="source.alternateName"> ({{ source.alternateName }})</template>
      <span
        v-if="unavailable"
        class="sr-only"
      >, {{ t('search.unavailable') }}</span>
      <small
        v-if="holder"
        class="picker__holder"
      >{{ holder }}</small>
    </span>
  </label>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {Source, holderName} from '../query';

const props = defineProps({
  source: {type: Object as PropType<Source>, required: true},
  checked: {type: Boolean, default: false},
});
defineEmits<{toggle: []}>();

const {t} = useI18n();
const holder = computed(() => holderName(props.source));
const unknown = computed(() => props.source.status === undefined || props.source.status === null);
const unavailable = computed(() => !unknown.value && !props.source.status!.isAvailable);
</script>
