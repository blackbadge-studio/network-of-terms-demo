<template>
  <article class="term">
    <div class="term__head">
      <h3 class="term__title">
        <router-link
          :to="{name: 'lookup', query: {uri: term.uri}}"
          :aria-label="t('search.detailOf', {label: prefLabel})"
        >
          {{ prefLabel }}
        </router-link>
        <LanguageTag :language="label.language" />
      </h3>
      <span
        v-if="term.resultType"
        class="chip chip--tag term__type"
      >{{ t('types.' + term.resultType, term.resultType) }}</span>
    </div>

    <div v-if="scopeNote">
      <p
        :id="`note-${noteId}`"
        class="term__note"
        :class="{'term__note--clamped': !noteExpanded}"
      >
        {{ scopeNote }}<LanguageTag :language="note.language" />
      </p>
      <button
        v-if="scopeNote.length > 220"
        type="button"
        class="link-btn"
        style="font-size: var(--fs-sm)"
        :aria-expanded="noteExpanded"
        :aria-controls="`note-${noteId}`"
        @click="noteExpanded = !noteExpanded"
      >
        {{ noteExpanded ? t('search.showLess') : t('search.showMore') }}
      </button>
    </div>

    <dl
      v-if="personFacts.length > 0"
      class="term__facts"
    >
      <div
        v-for="fact in personFacts"
        :key="fact.label"
      >
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>

    <dl
      v-if="altLabels.length > 0"
      class="term__alt"
    >
      <dt>{{ t('search.altLabel', altLabels.length) }}</dt>
      <dd
        v-for="altLabel in altLabels"
        :key="altLabel"
      >
        {{ altLabel }}
      </dd>
    </dl>

    <p class="term__uri">
      <span class="sr-only">{{ t('search.uri') }}:</span>
      <code :title="term.uri">{{ term.uri }}</code>
    </p>

    <div class="term__actions">
      <CopyButton
        :text="term.uri"
        label="search.copyUri"
      />
      <a
        :href="term.seeAlso[0] ?? term.uri"
        target="_blank"
        rel="noopener"
        class="btn btn--ghost btn--sm"
      >
        {{ t('search.viewAtSource') }}
        <ArrowTopRightOnSquareIcon class="icon" />
        <span class="sr-only">({{ t('general.externalLink') }})</span>
      </a>
      <router-link
        v-if="showTreeLink"
        :to="{name: 'browse', query: {bron: sourceUri, term: term.uri}}"
        class="btn btn--ghost btn--sm"
      >
        <RectangleGroupIcon class="icon" />
        {{ t('browse.showInTree') }}
      </router-link>
    </div>

    <div
      v-if="hasRelations"
      class="term__relations"
    >
      <RelatedTerms
        v-if="term.broader.length > 0"
        :caption="t('search.broaderTerm', term.broader.length)"
        :terms="term.broader"
      />
      <RelatedTerms
        v-if="term.narrower.length > 0"
        :caption="t('search.narrowerTerm', term.narrower.length)"
        :terms="term.narrower"
      />
      <RelatedTerms
        v-if="term.related.length > 0"
        :caption="t('search.relatedTerm', term.related.length)"
        :terms="term.related"
      />
      <RelatedTerms
        v-if="term.exactMatch.length > 0"
        :caption="t('search.exactMatch', term.exactMatch.length)"
        :lookup-link="false"
        :terms="term.exactMatch"
      />
    </div>
  </article>
</template>

<script lang="ts" setup>
import {computed, PropType, reactive, ref, useId} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute} from 'vue-router';
import {useQuery} from 'villus';
import {ArrowTopRightOnSquareIcon, RectangleGroupIcon} from '@heroicons/vue/16/solid';
import RelatedTerms from './RelatedTerms.vue';
import CopyButton from './CopyButton.vue';
import {Entity, LanguageString, SOURCES_QUERY, Source, Term, filterLanguageStrings} from '../query';
import {supportsHierarchy} from '../browse';
import {pickLanguage, useResultLanguage} from '../languages';
import LanguageTag from './LanguageTag.vue';
import state from '../store';

const props = defineProps({
  term: {type: Object as PropType<Term>, required: true},
  /** Source of the term; enables "Toon in boom" when that source has a hierarchy. */
  sourceUri: {type: String, default: null},
});

const {t, locale} = useI18n();
const route = useRoute();

// The source list (with features) may not be loaded on every page; villus dedupes and caches this query.
const {data: sourcesData} = useQuery<{sources: Source[]}>({
  query: SOURCES_QUERY,
  variables: reactive({locale}),
  context: {headers: reactive({'Accept-Language': locale})},
  skip: () => state.sources.length > 0 || !props.sourceUri,
});
const sources = computed(() => state.sources.length > 0 ? state.sources : (sourcesData.value?.sources ?? []));
const showTreeLink = computed(() =>
  Boolean(props.sourceUri)
  && route.name !== 'browse'
  && supportsHierarchy(sources.value.find(source => source.uri === props.sourceUri)),
);
const noteId = useId();
const noteExpanded = ref(false);

// In the language the results are shown in (on a page without that choice: the language of the interface);
// where the source has no name or description in it, in another one, which is named.
const language = useResultLanguage();
const label = computed(() => pickLanguage(props.term.prefLabel, language.value));
const note = computed(() => pickLanguage(props.term.scopeNote, language.value));
const prefLabel = computed(() => label.value.values.join(' · ') || props.term.uri);
const scopeNote = computed(() => note.value.values.join(' · '));
const altLabels = computed(() => [...new Set(filterLanguageStrings(props.term.altLabel, language.value))]);

/**
 * What the source states about a person as data (birth, death, occupation, nationality), where it does.
 * Dates are shown as the source gives them. A death year still to come is an estimate some sources carry for
 * the living (Getty ULAN) and is left out.
 */
const personFacts = computed(() => {
  const person = props.term.person;
  if (!person) {
    return [];
  }
  const names = (entities: Array<{name: LanguageString[]} | null>) =>
    [...new Set(entities.flatMap(entity => entity ? filterLanguageStrings(entity.name, language.value) : []))];
  const when = (date: string | null, places: Entity[]) => [date, names(places).join(' / ')].filter(Boolean).join(', ');
  const deathYear = Number.parseInt(person.deathDate ?? '', 10);
  const deathDate = deathYear > new Date().getFullYear() ? null : person.deathDate;
  // A source that only names an occupation gives one role per language: pick the language over all of them.
  const occupations = [...new Set([
    ...filterLanguageStrings(person.hasOccupation.flatMap(role => role.roleName), language.value),
    ...names(person.hasOccupation.filter(role => role.roleName.length === 0).map(role => role.occupation)),
  ])];
  return [
    {label: t('search.born'), value: when(person.birthDate, person.birthPlace)},
    {label: t('search.died'), value: when(deathDate, person.deathPlace)},
    {label: t('search.occupation'), value: occupations.join(', ')},
    {label: t('search.nationality'), value: names(person.nationality).join(', ')},
  ].filter(fact => fact.value);
});
const hasRelations = computed(() =>
  props.term.broader.length + props.term.narrower.length + props.term.related.length + props.term.exactMatch.length > 0,
);
</script>
