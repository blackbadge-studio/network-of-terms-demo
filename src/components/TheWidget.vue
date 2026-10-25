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
      <span class="status status--ok">{{ locale === 'en' ? 'Beta' : 'Bèta' }}</span>
      <span v-if="locale === 'en'">
        The widget is live as a beta. Try it, style it and copy the code in the
        <router-link :to="{name: 'widget-v2'}">configurator (widget v2)</router-link>;
        this page documents the attributes, events and custom properties.
      </span>
      <span v-else>
        De widget is beschikbaar als bèta. Probeer, stileer en kopieer hem in de
        <router-link :to="{name: 'widget-v2'}">configurator (widget v2)</router-link>;
        deze pagina documenteert de attributen, events en custom properties.
      </span>
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
