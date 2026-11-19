<template>
  <div class="container page">
    <h1 class="page__title">
      {{ t('faq.subtitle') }}
    </h1>
    <p class="page__lead">
      {{ t('faq.lead') }}
    </p>
    <ul class="faq-cards">
      <li
        v-for="audience in FAQ_AUDIENCES"
        :key="audience.route"
      >
        <router-link :to="{name: audience.route}">
          <component
            :is="audience.icon"
            class="faq-cards__icon"
            aria-hidden="true"
          />
          <b>{{ t(`faq.audience.${audience.key}.title`) }}</b>
          <span>{{ t(`faq.audience.${audience.key}.text`) }}</span>
          <small>
            {{ t('faq.questions', {n: audience.questions[locale === 'en' ? 'en' : 'nl']}) }}
            <ArrowRightIcon class="icon" />
          </small>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import {ArrowRightIcon} from '@heroicons/vue/16/solid';
import {FAQ_AUDIENCES} from '../faq';

const {t, locale} = useI18n();
</script>
