<template>
  <span
    v-if="language && language !== wanted"
    class="chip chip--tag chip--lang lang-tag"
    :title="name"
  >
    <span aria-hidden="true">{{ language }}</span>
    <span class="sr-only">{{ t('search.labelLanguage', {language: name}) }}</span>
  </span>
</template>

<script lang="ts" setup>
import {PropType, computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {languageName, useResultLanguage} from '../languages';

// Says in which language a label or description is, when that is another language than the one
// the results are shown in: the source has none in that language, and nothing is translated.
const props = defineProps({
  language: {type: String as PropType<string | null>, default: null},
});

const {t, locale} = useI18n();
const wanted = useResultLanguage();
const name = computed(() => props.language ? languageName(props.language, locale.value) : '');
</script>

<style scoped>
.lang-tag { min-height: 1.25rem; padding: 0 0.4rem; vertical-align: middle; margin-inline-start: 0.4em; font-size: 0.6875rem; }
</style>
