<template>
  <FaqLayout :title="t('faq.title_b')">
    <FaqEn2 v-if="locale === 'en'" />
    <FaqNl2 v-else />
  </FaqLayout>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import FaqLayout from './FaqLayout.vue';
import FaqEn2 from './FaqEn2.vue';
import FaqNl2 from './FaqNl2.vue';

const {t, locale} = useI18n();
</script>
