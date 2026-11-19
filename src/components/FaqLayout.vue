<template>
  <div class="container page">
    <router-link
      :to="{name: 'faq'}"
      class="back-link"
    >
      <ArrowLeftIcon class="icon" />
      {{ t('faq.back') }}
    </router-link>
    <h1 class="page__title">
      {{ title }}
    </h1>

    <div class="faq">
      <nav
        v-if="questions.length > 0"
        class="faq__toc"
        :aria-label="t('faq.onThisPage')"
      >
        <h2>{{ t('faq.onThisPage') }}</h2>
        <ol>
          <li
            v-for="question in questions"
            :key="question.id"
          >
            <a
              :href="`#${question.id}`"
              :class="{'is-active': question.id === activeId}"
              :aria-current="question.id === activeId ? 'location' : undefined"
              @click.prevent="jump(question.id)"
            >{{ question.text }}</a>
          </li>
        </ol>
      </nav>

      <div
        ref="body"
        class="faq__body"
      >
        <slot />

        <aside class="faq__others">
          <h2>{{ t('faq.others') }}</h2>
          <ul class="faq-cards faq-cards--compact">
            <li
              v-for="audience in others"
              :key="audience.route"
            >
              <router-link :to="{name: audience.route}">
                <b>{{ t(`faq.audience.${audience.key}.title`) }}</b>
                <ArrowRightIcon class="icon" />
              </router-link>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {ArrowLeftIcon, ArrowRightIcon} from '@heroicons/vue/16/solid';
import {FAQ_AUDIENCES} from '../faq';

// One audience's questions: a way back to the overview, the questions listed beside the text (the one being
// read is marked while scrolling), and the other audiences at the end. The questions are read from the headings
// of the text itself.
defineProps({title: {type: String, required: true}});

const {t, locale} = useI18n();
const route = useRoute();
const body = ref<HTMLElement | null>(null);
const questions = ref<Array<{id: string; text: string}>>([]);
const activeId = ref('');
const others = computed(() => FAQ_AUDIENCES.filter(audience => audience.route !== route.name));

function readQuestions() {
  const headings = Array.from(body.value?.querySelectorAll<HTMLElement>('.content h3') ?? []);
  questions.value = headings.map((heading, index) => {
    heading.id = `vraag-${index + 1}`;
    return {id: heading.id, text: heading.textContent?.trim() ?? ''};
  });
  markActive();
}

// The question being read: the last heading that has passed the top of the window.
let frame = 0;
function markActive() {
  let current = questions.value[0]?.id ?? '';
  for (const question of questions.value) {
    const top = document.getElementById(question.id)?.getBoundingClientRect().top ?? Infinity;
    if (top > 140) {
      break;
    }
    current = question.id;
  }
  activeId.value = current;
}
function onScroll() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(markActive);
}

function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
}

onMounted(() => {
  readQuestions();
  window.addEventListener('scroll', onScroll, {passive: true});
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  cancelAnimationFrame(frame);
});
watch(locale, () => nextTick(readQuestions));
</script>
