<template>
  <FaqLayout :title="t('faq.title_o')">
    <FaqEn3 v-if="locale === 'en'" />
    <FaqNl3 v-else />
  </FaqLayout>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import FaqLayout from './FaqLayout.vue';
import FaqEn3 from './FaqEn3.vue';
import FaqNl3 from './FaqNl3.vue';

const {t, locale} = useI18n();
</script>
