<template>
  <div class="container page">
    <h1 class="page__title">
      {{ guide.title }}
    </h1>
    <p class="page__lead">
      {{ guide.lead }}
    </p>

    <div class="faq">
      <nav
        class="faq__toc"
        :aria-label="t('faq.onThisPage')"
      >
        <h2>{{ t('faq.onThisPage') }}</h2>
        <ol>
          <li
            v-for="(step, index) in guide.steps"
            :key="step.id"
          >
            <a :href="`#${step.id}`">{{ index + 1 }}. {{ step.title }}</a>
          </li>
          <li><a href="#widget">{{ guide.widgetTitle }}</a></li>
          <li><a href="#stabiel">{{ guide.stableTitle }}</a></li>
        </ol>
      </nav>

      <div class="faq__body guide">
        <div class="guide__address">
          <p>{{ guide.address }}</p>
          <p>
            <code>POST {{ graphqlUrl }}</code>
            <CopyButton :text="graphqlUrl" />
          </p>
          <p>
            <a :href="playgroundUrl">GraphQL Playground <ArrowTopRightOnSquareIcon class="icon" /></a>
          </p>
        </div>

        <section
          v-for="(step, index) in guide.steps"
          :id="step.id"
          :key="step.id"
          class="guide__step"
        >
          <h2>
            <span class="guide__number">{{ index + 1 }}</span>
            {{ step.title }}
          </h2>
          <p
            v-for="paragraph in step.text"
            :key="paragraph"
          >
            <InlineCode :text="paragraph" />
          </p>
          <ul v-if="step.list">
            <li
              v-for="item in step.list"
              :key="item"
            >
              <InlineCode :text="item" />
            </li>
          </ul>
          <IntegrationExample
            v-if="step.query"
            :code="QUERIES[step.query]"
            runnable
          />
          <IntegrationExample
            v-if="step.sample"
            :code="step.sample"
          />
        </section>

        <section
          id="widget"
          class="guide__step"
        >
          <h2>{{ guide.widgetTitle }}</h2>
          <p>{{ guide.widgetText }}</p>
          <p>
            <router-link
              :to="{name: 'widget'}"
              class="btn btn--secondary btn--sm"
            >
              {{ guide.widgetLink }}
              <ArrowRightIcon class="icon" />
            </router-link>
          </p>
        </section>

        <section
          id="stabiel"
          class="guide__step"
        >
          <h2>{{ guide.stableTitle }}</h2>
          <p>{{ guide.stableLead }}</p>
          <ul>
            <li
              v-for="item in guide.stable"
              :key="item"
            >
              <InlineCode :text="item" />
            </li>
          </ul>
          <p class="guide__links">
            <router-link :to="{name: 'simulator'}">
              {{ t('simulator.navLabel') }}
            </router-link>
            <router-link :to="{name: 'status'}">
              {{ t('status.navLabel') }}
            </router-link>
          </p>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {ArrowRightIcon, ArrowTopRightOnSquareIcon} from '@heroicons/vue/16/solid';
import CopyButton from './CopyButton.vue';
import IntegrationExample from './IntegrationExample.vue';
import InlineCode from './InlineCode';
import {GUIDE, QUERIES} from '../integration';

const {t, locale} = useI18n();
const guide = computed(() => GUIDE[locale.value === 'en' ? 'en' : 'nl']);
const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL as string;
const playgroundUrl = graphqlUrl.replace(/\/graphql$/, '/graphiql');
</script>
