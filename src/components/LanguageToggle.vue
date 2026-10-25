<template>
  <div
    class="lang"
    role="group"
    :aria-label="t('language.label')"
  >
    <button
      v-for="lang in languages"
      :key="lang.code"
      type="button"
      class="lang__btn"
      :aria-pressed="locale === lang.code"
      :lang="lang.code"
      :title="lang.name"
      @click="switchLocale(lang.code)"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';

const router = useRouter();
const route = useRoute();
const {t, locale} = useI18n();

const languages = [
  {code: 'nl', name: 'Nederlands'},
  {code: 'en', name: 'English'},
];

const switchLocale = (code: string) => {
  router.replace({params: {...route.params, locale: code}, query: route.query});
};
</script>
