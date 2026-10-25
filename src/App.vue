<template>
  <div class="flex-wrapper">
    <nav class="navbar navbar-expand-sm vtn-nav">
      <div class="container">
        <router-link
          :to="{name: 'home'}"
          class="navbar-brand vtn-brand"
        >
          <span class="vtn-brand__mark">Vlaams Termennetwerk</span>
          <span class="vtn-brand__sub">{{ t('general.byline') }}</span>
        </router-link>
        <button
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          class="navbar-toggler"
          data-bs-target="#navbarSupportedContent"
          data-bs-toggle="collapse"
          type="button"
        >
          <span class="navbar-toggler-icon" />
        </button>
        <div
          id="navbarSupportedContent"
          class="collapse navbar-collapse"
        >
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link
                :to="{name: 'sources'}"
                class="nav-link"
              >
                {{ t('termSources.title') }}
              </router-link>
            </li>
            <li class="nav-item dropdown">
              <a
                id="faqDropdownMenuLink"
                class="nav-link dropdown-toggle"
                data-bs-toggle="dropdown"
                href="#"
                role="button"
                aria-expanded="false"
              >{{ t('faq.title') }}</a>
              <ul
                class="dropdown-menu"
                aria-labelledby="navbarDropdownMenuLink"
              >
                <router-link
                  :to="{name: 'faq1'}"
                  class="dropdown-item"
                >
                  {{ t('faq.voor_c') }}
                </router-link>
                <router-link
                  :to="{name: 'faq2'}"
                  class="dropdown-item"
                >
                  {{ t('faq.voor_b') }}
                </router-link>
                <router-link
                  :to="{name: 'faq4'}"
                  class="dropdown-item"
                >
                  {{ t('faq.voor_r') }}
                </router-link>
                <router-link
                  :to="{name: 'faq3'}"
                  class="dropdown-item"
                >
                  {{ t('faq.voor_o') }}
                </router-link>
              </ul>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                :href="apiUrl"
              >API</a>
            </li>
            <LanguageToggle />
          </ul>
        </div>
      </div>
    </nav>

    <div class="container px-3 pt-3 pb-md-4 mx-auto">
      <router-view :key="$route.fullPath" />
    </div>
    <br>
    <footer class="vtn-footer">
      <div class="container">
        <div class="row">
          <div class="col-md-4">
            <p class="vtn-footer__title">
              Vlaams Termennetwerk
            </p>
            <p>{{ t('general.messageFooter') }}</p>
          </div>
          <div class="col-md-4">
            <p>
              <router-link :to="{name: 'sources'}">
                {{ t('termSources.title') }}
              </router-link>
            </p>
            <p>
              <a :href="apiUrl">GraphQL API</a> <ArrowTopRightOnSquareIcon class="icon" />
            </p>
            <p>
              <a href="https://github.com/blackbadge-studio/network-of-terms">{{ t('general.sourceCode') }}</a> <ArrowTopRightOnSquareIcon class="icon" />
            </p>
          </div>
          <div class="col-md-4">
            <p>
              <router-link :to="{name: 'privacy'}">
                {{ t('general.privacy') }}
              </router-link>
            </p>
            <p>
              <router-link :to="{name: 'contact'}">
                Contact
              </router-link>
            </p>
            <p class="vtn-footer__poc">
              {{ t('general.poc') }}
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {computed, defineComponent} from 'vue';
import LanguageToggle from './components/LanguageToggle.vue';
import {ArrowTopRightOnSquareIcon} from '@heroicons/vue/16/solid';

export default defineComponent({
  name: 'App',
  components: {
    LanguageToggle,
    ArrowTopRightOnSquareIcon,
  },
  setup() {
    const {t, locale} = useI18n();
    const route = useRoute();

    const currentLocation = computed(() => {
      const {...rest} = route;
      return rest;
    });

    const apiUrl = (import.meta.env.VITE_GRAPHQL_URL as string).replace(/\/graphql$/, '/graphiql');

    return {t, locale, currentLocation, apiUrl};
  },
});
</script>
