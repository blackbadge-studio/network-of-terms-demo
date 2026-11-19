<template>
  <FaqLayout :title="t('faq.title_r')">
    <FaqEn4 v-if="locale === 'en'" />
    <FaqNl4 v-else />
  </FaqLayout>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import FaqLayout from './FaqLayout.vue';
import FaqEn4 from './FaqEn4.vue';
import FaqNl4 from './FaqNl4.vue';

const {t, locale} = useI18n();
</script>
