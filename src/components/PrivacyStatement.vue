<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('general.privacy') }}
    </h1>
    <PrivacyEn v-if="locale === 'en'" />
    <PrivacyNl v-else />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';
import PrivacyEn from './PrivacyStatementEn.vue';
import PrivacyNl from './PrivacyStatementNl.vue';

export default defineComponent({
  name: 'PrivacyStatement',
  components: {PrivacyEn, PrivacyNl},
  setup () {
    const {t, locale} = useI18n();

    return {t, locale};
  },
});
</script>

