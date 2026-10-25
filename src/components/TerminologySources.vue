<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('termSources.title') }}
    </h1>
    <p class="page__lead">
      {{ t('termSources.intro') }}
    </p>
    <suspense>
      <TerminologySourcesList />
      <template #fallback>
        <div class="sources__list">
          <div class="skeleton skeleton--block" />
          <div class="skeleton skeleton--block" />
          <div class="skeleton skeleton--block" />
        </div>
      </template>
    </suspense>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import TerminologySourcesList from './TerminologySourcesList.vue';

const {t} = useI18n();
</script>
