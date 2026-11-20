import {createRouter, createWebHistory} from 'vue-router';
import TheFaq from './components/TheFaq.vue';
import TheFaq1 from './components/TheFaq1.vue';
import TheFaq2 from './components/TheFaq2.vue';
import TheFaq3 from './components/TheFaq3.vue';
import TheFaq4 from './components/TheFaq4.vue';
import Contact from './components/ContactInfo.vue';
import PrivacyStatement from './components/PrivacyStatement.vue';
import LookupForm from './components/LookupForm.vue';
import TerminologySources from './components/TerminologySources.vue';
import {i18n} from './main';
import TheMain from './components/TheMain.vue';
import TheSimulator from './components/TheSimulator.vue';
import TheWidgetV2 from './components/TheWidgetV2.vue';
import SearchForm from './components/SearchForm.vue';
import TheBrowse from './components/TheBrowse.vue';
import TheStatus from './components/TheStatus.vue';
import TheIntegration from './components/TheIntegration.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:locale(nl|en)',
      component: TheMain,
      children: [
        {
          path: '',
          name: 'home',
          component: SearchForm,
        },
        {
          path: 'lookup',
          name: 'lookup',
          component: LookupForm,
        },
        {
          path: 'faq',
          name: 'faq',
          component: TheFaq,
        },
        {
          path: 'faq1',
          name: 'faq1',
          component: TheFaq1,
        },
        {
          path: 'faq2',
          name: 'faq2',
          component: TheFaq2,
        },
        {
          path: 'faq3',
          name: 'faq3',
          component: TheFaq3,
        },
        {
          path: 'faq4',
          name: 'faq4',
          component: TheFaq4,
        },
        {
          path: 'sources',
          name: 'sources',
          component: TerminologySources,
        },
        {
          path: 'hierarchie',
          name: 'browse',
          // The page was called Bladeren before; links to its old address keep working.
          alias: 'bladeren',
          component: TheBrowse,
        },
        {
          path: 'widget',
          name: 'widget',
          component: TheWidgetV2,
        },
        {
          // The configurator lived here while an older page had /widget; links to it keep working.
          path: 'widget-v2',
          redirect: to => ({name: 'widget', params: to.params, query: to.query}),
        },
        {
          path: 'testpagina',
          name: 'simulator',
          // The page was called Simulator before; links to its old address keep working.
          alias: 'simulator',
          component: TheSimulator,
        },
        {
          path: 'status',
          name: 'status',
          component: TheStatus,
        },
        {
          path: 'integratie',
          name: 'integration',
          component: TheIntegration,
        },
        {
          path: 'contact',
          name: 'contact',
          component: Contact,
        },
        {
          path: 'privacy',
          name: 'privacy',
          component: PrivacyStatement,
        },
      ],
    },
  ],
  scrollBehavior (to, from) {
    if (to.hash) {
      // A link from elsewhere straight to a heading (/integratie#opzoeken) is handled apart, see holdAt.
      if (from.matched.length === 0) {
        holdAt(to.hash.slice(1));
        return;
      }
      return {el: to.hash, top: HEADING_GAP, behavior: 'smooth'};
    }
  },
});

const HEADING_GAP = 16;

/**
 * On a first load the page keeps growing for a moment (lists and examples fill in), so a single scroll to a
 * heading lands short or not at all. Keep the heading at the top until the page is still, or the reader moves.
 */
function holdAt(id: string) {
  const until = Date.now() + 2500;
  let released = false;
  const release = () => { released = true; };
  for (const type of ['wheel', 'touchstart', 'keydown', 'mousedown']) {
    window.addEventListener(type, release, {once: true, passive: true});
  }
  const tick = () => {
    if (released || Date.now() > until) {
      return;
    }
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && Math.abs(top - HEADING_GAP) > 2) {
      window.scrollBy({top: top - HEADING_GAP, behavior: 'instant'});
    }
    // A timer, not an animation frame: a tab opened in the background draws no frames, and would stay at the top.
    setTimeout(tick, 50);
  };
  tick();
}

router.beforeEach((to, from, next) => {
  const locale: string = to.params.locale as  string;
  if (!locale || !(i18n.global.availableLocales as string[]).includes(locale)) {
    const path = to.path === '/' ? '' : to.path.replace(/\/+$/, '');

    return next({path: `/${i18n.global.locale}${path}`, query: to.query});
  }

  i18n.global.locale = locale as 'nl' | 'en';
  document.documentElement.lang = locale;
  next();
});

// Matomo page view tracking for SPA
declare global {
  interface Window {
    _paq?: [string, ...unknown[]][];
  }
}

router.afterEach((to, from) => {
  if (import.meta.env.PROD) {
    window._paq?.push(['setReferrerUrl', window.location.origin + from.fullPath]);
    window._paq?.push(['setCustomUrl', window.location.origin + to.fullPath]);
    window._paq?.push(['trackPageView']);
  }
});
