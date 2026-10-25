<template>
  <div class="content">
    <p>In this FAQ we provide answers to frequently asked questions about the Terme network.</p>
    <p>We have divided the questions by target audience:</p>
    <ul class="faq-index">
      <li>
        <router-link
          :to="{name: 'faq1'}"
        >
          for managers of heritage collections
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq2'}"
        >
          for managers of terminology resources
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq4'}"
        >
          for terminology resource providers
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
      <li>
        <router-link
          :to="{name: 'faq3'}"
        >
          for heritage software developers
          <span aria-hidden="true">→</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'FaqEn',
});
</script>