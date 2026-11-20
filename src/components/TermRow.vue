<template>
  <button
    type="button"
    class="term-row"
    :class="{'is-active': active}"
    :aria-pressed="active"
    :aria-label="t('search.openDetail', {label: prefLabel})"
    @click="$emit('select')"
  >
    <span class="term-row__main">
      <span class="term-row__title">{{ prefLabel }}<LanguageTag :language="label.language" /></span>
      <span
        v-if="scopeNote"
        class="term-row__note"
      >{{ scopeNote }}<LanguageTag :language="note.language" /></span>
      <span class="term-row__uri">{{ term.uri }}</span>
    </span>
    <span class="term-row__aside">
      <span
        v-if="term.resultType"
        class="chip chip--tag"
      >{{ t('types.' + term.resultType, term.resultType) }}</span>
      <ChevronRightIcon class="icon" />
    </span>
  </button>
</template>

<script lang="ts" setup>
import {computed, PropType} from 'vue';
import {useI18n} from 'vue-i18n';
import {ChevronRightIcon} from '@heroicons/vue/16/solid';
import {Term} from '../query';
import {pickLanguage, useResultLanguage} from '../languages';
import LanguageTag from './LanguageTag.vue';

const props = defineProps({
  term: {type: Object as PropType<Term>, required: true},
  active: {type: Boolean, default: false},
});
defineEmits<{select: []}>();

const {t} = useI18n();
// In the language chosen above the results; where the source has none in it, in another one, which is named.
const language = useResultLanguage();
const label = computed(() => pickLanguage(props.term.prefLabel, language.value));
const note = computed(() => pickLanguage(props.term.scopeNote, language.value));
const prefLabel = computed(() => label.value.values.join(' · ') || props.term.uri);
const scopeNote = computed(() => note.value.values.join(' · '));
</script>
