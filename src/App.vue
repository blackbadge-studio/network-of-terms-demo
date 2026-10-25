<template>
  <div class="app">
    <a
      href="#main"
      class="skip-link"
    >{{ t('general.skipToContent') }}</a>
    <header class="site-header">
      <div class="container site-header__inner">
        <div class="site-header__row">
          <router-link
            :to="{name: 'home'}"
            class="brand"
          >
            <span
              class="brand__mark"
              aria-hidden="true"
            />
            <span class="brand__text">
              <span class="brand__name">Vlaams Termennetwerk</span>
              <span class="brand__sub">{{ t('general.byline') }}</span>
            </span>
          </router-link>
          <button
            type="button"
            class="nav__toggle"
            aria-controls="site-nav"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <Bars3Icon
              v-if="!menuOpen"
              class="icon"
            />
            <XMarkIcon
              v-else
              class="icon"
            />
            {{ menuOpen ? t('general.close') : t('general.menu') }}
          </button>
        </div>
        <nav
          id="site-nav"
          class="nav"
          :class="{'nav--open': menuOpen}"
          :aria-label="t('general.mainNav')"
        >
          <router-link
            :to="{name: 'home'}"
            class="nav__link"
            exact-active-class="router-link-active"
            @click="menuOpen = false"
          >
            {{ t('search.tabSearch') }}
          </router-link>
          <router-link
            :to="{name: 'sources'}"
            class="nav__link"
            @click="menuOpen = false"
          >
            {{ t('termSources.title') }}
          </router-link>
          <router-link
            :to="{name: 'faq'}"
            class="nav__link"
            @click="menuOpen = false"
          >
            {{ t('faq.title') }}
          </router-link>
          <router-link
            :to="{name: 'widget'}"
            class="nav__link"
            @click="menuOpen = false"
          >
            {{ t('widget.navLabel') }}
          </router-link>
          <a
            class="nav__link"
            :href="apiUrl"
          >API <ArrowTopRightOnSquareIcon
            class="icon"
            style="width: .8em; height: .8em; margin-left: .2em;"
          /></a>
          <LanguageToggle />
        </nav>
      </div>
    </header>

    <main
      id="main"
      class="app__main"
      tabindex="-1"
    >
      <router-view :key="$route.fullPath" />
    </main>

    <footer class="site-footer">
      <div class="container">
        <div class="site-footer__inner">
          <div class="site-footer__brand">
            <p class="site-footer__title">
              Vlaams Termennetwerk
            </p>
            <p>{{ t('general.messageFooter') }}</p>
            <span class="site-footer__poc">{{ t('general.poc') }}</span>
          </div>
          <div>
            <h2>{{ t('general.footerService') }}</h2>
            <ul>
              <li>
                <router-link :to="{name: 'sources'}">
                  {{ t('termSources.title') }}
                </router-link>
              </li>
              <li>
                <router-link :to="{name: 'faq'}">
                  {{ t('faq.title') }}
                </router-link>
              </li>
              <li>
                <router-link :to="{name: 'reconciliation'}">
                  {{ t('faq.reconciliation') }}
                </router-link>
              </li>
              <li>
                <router-link :to="{name: 'widget'}">
                  {{ t('widget.navLabel') }}
                </router-link>
              </li>
              <li>
                <a :href="apiUrl">GraphQL API <ArrowTopRightOnSquareIcon class="icon" /></a>
              </li>
            </ul>
          </div>
          <div>
            <h2>{{ t('general.footerMore') }}</h2>
            <ul>
              <li>
                <router-link :to="{name: 'contact'}">
                  Contact
                </router-link>
              </li>
              <li>
                <router-link :to="{name: 'privacy'}">
                  {{ t('general.privacy') }}
                </router-link>
              </li>
              <li>
                <a href="https://github.com/blackbadge-studio/network-of-terms">{{ t('general.sourceCode') }} <ArrowTopRightOnSquareIcon class="icon" /></a>
              </li>
            </ul>
          </div>
        </div>
        <div class="site-footer__bottom">
          <span>© {{ new Date().getFullYear() }} meemoo</span>
          <span>Vlaams Termennetwerk – {{ t('general.byline') }}</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import {ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import LanguageToggle from './components/LanguageToggle.vue';
import {ArrowTopRightOnSquareIcon, Bars3Icon, XMarkIcon} from '@heroicons/vue/16/solid';

const {t} = useI18n();
const route = useRoute();
const menuOpen = ref(false);
watch(() => route.fullPath, () => { menuOpen.value = false; });

const apiUrl = (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql$/, '/graphiql');
</script>
