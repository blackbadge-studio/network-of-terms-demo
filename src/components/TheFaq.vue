<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('faq.subtitle') }}
    </h1>
    <FaqEn v-if="locale === 'en'" />
    <FaqNl v-else />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';
import FaqEn from './FaqEn.vue';
import FaqNl from './FaqNl.vue';

export default defineComponent({
  name: 'TheFaq',
  components: {FaqEn, FaqNl},
  setup () {
    const {t, locale} = useI18n();

    return {t, locale};
  },
});
</script>

