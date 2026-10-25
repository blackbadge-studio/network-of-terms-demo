<template>
  <div class="relation">
    <span class="relation__caption">{{ caption }}</span>
    <ul class="relation__list">
      <li
        v-for="term in terms"
        :key="term.uri"
      >
        <router-link
          v-if="lookupLink"
          class="chip"
          :to="{name: 'lookup', query: {uri: term.uri}}"
        >
          {{ filterLanguageStrings(term.prefLabel)[0] ?? term.uri }}
        </router-link>
        <a
          v-else
          class="chip"
          :href="term.uri"
          target="_blank"
          rel="noopener"
        >
          {{ filterLanguageStrings(term.prefLabel)[0] ?? term.uri }}
          <ArrowTopRightOnSquareIcon class="icon" />
        </a>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import {PropType} from 'vue';
import {RelatedTerm, filterLanguageStrings} from '../query';
import {ArrowTopRightOnSquareIcon} from '@heroicons/vue/16/solid';

defineProps({
  caption: {type: String, required: true},
  terms: {type: Array as PropType<RelatedTerm[]>, required: true},
  lookupLink: {type: Boolean, default: true},
});
</script>

<style scoped>
.relation__list { list-style: none; }
.relation__list li { max-width: 100%; }
.chip { max-width: 100%; }
</style>
