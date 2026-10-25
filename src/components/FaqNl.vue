<template>
  <div class="content">
    <p>In deze FAQ geven we antwoorden op veelgestelde vragen over het Termenetwerk.</p>
    <p>We hebben de vragen opgedeeld per doelgroep:</p>
    <ul class="faq-index">
      <li>
        <router-link
          :to="{name: 'faq1'}"
        >
          voor beheerders van erfgoedcollecties
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq2'}"
        >
          voor beheerders van terminologiebronnen
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq4'}"
        >
          voor aanbieders van terminologiebronnen
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq3'}"
        >
          voor ontwikkelaars van erfgoedsoftware
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'FaqNl',
});
</script>
