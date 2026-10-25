<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('widget.title') }}
    </h1>
    <p class="page__lead">
      {{ t('widget.lead') }}
    </p>
    <p
      class="notice notice--info"
      role="note"
    >
      <span class="status status--info">{{ t('widget.statusBadge') }}</span>
      <span>{{ t('widget.statusText') }}</span>
    </p>
    <WidgetEn v-if="locale === 'en'" />
    <WidgetNl v-else />
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import WidgetEn from './WidgetEn.vue';
import WidgetNl from './WidgetNl.vue';

const {t, locale} = useI18n();
</script>
