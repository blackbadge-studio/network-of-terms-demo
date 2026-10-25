<template>
  <div class="container page">
    <h1 class="page__title">
      Contact
    </h1>
    <ContactEn v-if="locale === 'en'" />
    <ContactNl v-else />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {useI18n} from 'vue-i18n';
import ContactEn from './ContactEn.vue';
import ContactNl from './ContactNl.vue';

export default defineComponent({
  name: 'ContactInfo',
  components: {ContactEn, ContactNl},
  setup () {
    const {t, locale} = useI18n();

    return {t, locale};
  },
});
</script>
