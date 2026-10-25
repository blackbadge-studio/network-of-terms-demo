<template>
  <!-- minimaal: no hero, a centred stage -->
  <div
    v-if="theme === 'minimaal'"
    class="container"
  >
    <div
      class="stage"
      :class="{'stage--compact': hasQuery}"
    >
      <p class="stage__brand">
        Vlaams Termennetwerk
        <small>{{ t('search.subtitle') }}</small>
      </p>
      <slot />
    </div>
  </div>

  <!-- netwerk: split hero with the source-status panel -->
  <template v-else-if="theme === 'netwerk'">
    <section class="hero">
      <div class="container hero__inner hero--split">
        <div class="hero__main">
          <h1 class="hero__title">
            {{ t('search.netwerkHeadline') }}
          </h1>
          <p
            class="hero__lead"
            style="display: block"
          >
            {{ t('search.netwerkOneLiner') }}
          </p>
          <div class="panel">
            <PanelTabs :active="active" />
            <div class="panel__body">
              <slot />
            </div>
          </div>
          <nav
            class="hero__audience"
            :aria-label="t('search.audienceLabel')"
          >
            <span class="hero__audience-label">{{ t('search.audienceLabel') }}</span>
            <router-link
              v-for="item in audiences"
              :key="item.route"
              :to="{name: item.route}"
            >
              {{ t(item.label) }} <ArrowRightIcon class="icon" />
            </router-link>
          </nav>
        </div>
        <SourceStatusPanel />
      </div>
    </section>
  </template>

  <!-- helder (baseline) and mint -->
  <template v-else>
    <section class="hero">
      <svg
        v-if="theme === 'mint'"
        class="hero__art"
        viewBox="0 0 540 360"
        aria-hidden="true"
        focusable="false"
      >
        <g>
          <line
            v-for="(edge, i) in edges"
            :key="i"
            :x1="nodes[edge[0]][0]"
            :y1="nodes[edge[0]][1]"
            :x2="nodes[edge[1]][0]"
            :y2="nodes[edge[1]][1]"
          />
        </g>
        <g>
          <circle
            v-for="(node, i) in nodes"
            :key="i"
            :cx="node[0]"
            :cy="node[1]"
            :r="node[2]"
            :class="{'is-deep': i % 3 === 0, 'is-light': i % 3 === 2}"
          />
        </g>
      </svg>
      <div class="container hero__inner">
        <h1 class="hero__title">
          {{ theme === 'mint' ? t('search.mintHeadline') : t('search.heroTitle') }}
        </h1>
        <p class="hero__lead">
          {{ t('search.heroLead') }}
        </p>
      </div>
    </section>

    <div class="container">
      <div class="panel">
        <PanelTabs :active="active" />
        <div class="panel__body">
          <slot />
        </div>
      </div>

      <nav
        v-if="theme !== 'mint'"
        class="hero__audience hero__audience--below"
        :aria-label="t('search.audienceLabel')"
      >
        <span class="hero__audience-label">{{ t('search.audienceLabel') }}</span>
        <router-link
          v-for="item in audiences"
          :key="item.route"
          :to="{name: item.route}"
        >
          {{ t(item.label) }} <ArrowRightIcon class="icon" />
        </router-link>
      </nav>

      <nav
        v-if="theme === 'mint'"
        :aria-label="t('search.audienceLabel')"
      >
        <ul class="audience-cards">
          <li
            v-for="item in audiences"
            :key="item.route"
          >
            <router-link :to="{name: item.route}">
              <span class="audience-cards__icon"><component
                :is="item.icon"
                class="icon"
              /></span>
              <span>
                <small>{{ t('faq.title') }}</small>
                {{ t(item.label) }}
              </span>
              <ArrowRightIcon class="icon audience-cards__arrow" />
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </template>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {ArrowRightIcon} from '@heroicons/vue/16/solid';
import {BuildingLibraryIcon, CircleStackIcon, CodeBracketIcon, ShareIcon} from '@heroicons/vue/24/outline';
import PanelTabs from './PanelTabs.vue';
import SourceStatusPanel from './SourceStatusPanel.vue';
import {useTheme} from '../theme';

defineProps({
  active: {
    type: String as () => 'search' | 'lookup',
    default: 'search',
  },
});

const {t} = useI18n();
const {theme} = useTheme();
const route = useRoute();
// minimaal: the stage is full-height until a search or lookup is active.
const hasQuery = computed(() => Boolean(route.query.q || route.query.uri));

const audiences = [
  {route: 'faq1', label: 'faq.voor_c', icon: BuildingLibraryIcon},
  {route: 'faq2', label: 'faq.voor_b', icon: CircleStackIcon},
  {route: 'faq4', label: 'faq.voor_r', icon: ShareIcon},
  {route: 'faq3', label: 'faq.voor_o', icon: CodeBracketIcon},
];

// Abstract network-of-nodes illustration for the mint hero: [x, y, radius].
const nodes: [number, number, number][] = [
  [60, 80, 6], [150, 40, 9], [240, 110, 5], [330, 50, 12], [420, 120, 7], [500, 60, 5],
  [100, 190, 10], [200, 230, 6], [300, 190, 8], [390, 240, 14], [480, 200, 6],
  [60, 300, 5], [170, 320, 8], [270, 300, 11], [360, 330, 6], [460, 310, 9], [530, 270, 5],
];
const edges: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [0, 6], [2, 6], [6, 7], [7, 8], [2, 8], [8, 9], [4, 9], [9, 10], [5, 10],
  [6, 11], [11, 12], [7, 12], [12, 13], [8, 13], [13, 14], [9, 14], [14, 15], [9, 15], [15, 16], [10, 16],
];
</script>
