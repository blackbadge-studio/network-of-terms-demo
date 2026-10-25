<template>
  <div class="container page">
    <h1>
      {{ t('faq.reconciliation') }}
    </h1>
    <ReconEn v-if="locale === 'en'" />
    <ReconNl v-else />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';
import ReconEn from './ReconEn.vue';
import ReconNl from './ReconNl.vue';

export default defineComponent({
  name: 'ReconciliationService',
  components: {ReconEn, ReconNl},
  setup () {
    const {t, locale} = useI18n();

    return {t, locale};
  },
});
</script>

