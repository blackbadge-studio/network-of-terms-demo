<template>
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
</template>

<script lang="ts" setup>
import {useI18n} from 'vue-i18n';
import {LinkIcon, MagnifyingGlassIcon} from '@heroicons/vue/16/solid';

defineProps({
  active: {
    type: String as () => 'search' | 'lookup',
    default: 'search',
  },
});

const {t} = useI18n();
</script>
