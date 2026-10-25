<template>
  <section class="hero">
    <div class="container hero__inner">
      <h1 class="hero__title">
        {{ t('search.subtitle') }}
      </h1>
      <p class="hero__lead">
        {{ t('general.messageFooter') }}
      </p>
      <nav
        class="hero__audience"
        :aria-label="t('search.audienceLabel')"
      >
        <span class="hero__audience-label">{{ t('search.audienceLabel') }}</span>
        <router-link :to="{name: 'faq1'}">
          {{ t('faq.voor_c') }} <ArrowRightIcon class="icon" />
        </router-link>
        <router-link :to="{name: 'faq2'}">
          {{ t('faq.voor_b') }} <ArrowRightIcon class="icon" />
        </router-link>
        <router-link :to="{name: 'faq4'}">
          {{ t('faq.voor_r') }} <ArrowRightIcon class="icon" />
        </router-link>
        <router-link :to="{name: 'faq3'}">
          {{ t('faq.voor_o') }} <ArrowRightIcon class="icon" />
        </router-link>
      </nav>
    </div>
  </section>

  <div class="container">
    <div class="panel">
      <div
        class="panel__tabs"
        role="tablist"
      >
        <router-link
          id="tab-search"
          :to="{name: 'home'}"
          class="panel__tab"
          :class="{'is-active': active === 'search'}"
          role="tab"
          :aria-selected="active === 'search'"
          aria-controls="search"
        >
          <MagnifyingGlassIcon class="icon" />
          {{ t('search.tabSearch') }}
        </router-link>
        <router-link
          id="tab-lookup"
          :to="{name: 'lookup'}"
          class="panel__tab"
          :class="{'is-active': active === 'lookup'}"
          role="tab"
          :aria-selected="active === 'lookup'"
          aria-controls="lookup"
        >
          <LinkIcon class="icon" />
          {{ t('search.tabLookup') }}
        </router-link>
      </div>
      <div class="panel__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import {ArrowRightIcon, LinkIcon, MagnifyingGlassIcon} from '@heroicons/vue/16/solid';

defineProps({
  active: {
    type: String as () => 'search' | 'lookup',
    default: 'search',
  },
});

const {t} = useI18n();
</script>
