<template>
  <FaqLayout :title="t('faq.title_c')">
    <FaqEn1 v-if="locale === 'en'" />
    <FaqNl1 v-else />
  </FaqLayout>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import FaqLayout from './FaqLayout.vue';
import FaqEn1 from './FaqEn1.vue';
import FaqNl1 from './FaqNl1.vue';

const {t, locale} = useI18n();
</script>
