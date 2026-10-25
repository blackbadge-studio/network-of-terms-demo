import {createApp} from 'vue';
import {createI18n} from 'vue-i18n';
import {createClient} from 'villus';
import {router} from './router';
import * as en from './locales/en.json';
import * as nl from './locales/nl.json';

import App from './App.vue';
import {mountFeedbackWidget} from './feedback';
import '@fontsource-variable/figtree';
import './index.css';

export const i18n = createI18n({
  locale: 'nl',
  messages: {
    en,
    nl,
  },
});

// One GraphQL client for the whole app (components use villus' useQuery directly).
const client = createClient({
  url: import.meta.env.VITE_GRAPHQL_URL,
});

const app = createApp(App);
app.use(i18n);
app.use(router);
app.use(client);

router.isReady().then(() => {
  app.mount('#app');
  mountFeedbackWidget();
});
