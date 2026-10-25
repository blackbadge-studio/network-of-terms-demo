<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('faq.title_c') }}
    </h1>
    <FaqEn1 v-if="locale === 'en'" />
    <FaqNl1 v-else />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';
import FaqEn1 from './FaqEn1.vue';
import FaqNl1 from './FaqNl1.vue';

export default defineComponent({
  name: 'TheFaq1',
  components: {FaqEn1, FaqNl1},
  setup () {
    const {t, locale} = useI18n();

    return {t, locale};
  },
});
</script>

