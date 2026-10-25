<template>
  <div class="container page cfg-page">
    <div class="cfg-head">
      <div>
        <p class="cfg-head__eyebrow">
          <span class="status status--ok">{{ t('beta') }}</span>
          <router-link :to="{name: 'widget'}">
            {{ t('docsLink') }}
          </router-link>
        </p>
        <h1 class="page__title">
          {{ t('title') }}
        </h1>
        <p class="page__lead">
          {{ t('lead') }}
        </p>
      </div>
    </div>

    <div class="cfg">
      <aside class="cfg__aside">
        <section class="cfg__section">
          <div class="cfg__section-head">
            <h2>{{ t('style') }}</h2>
            <button
              v-if="styleChanged"
              type="button"
              class="link-btn cfg__reset"
              @click="resetStyle"
            >
              <ArrowPathIcon class="icon" />
              {{ t('resetStyle') }}
            </button>
          </div>

          <ColorField
            v-model="style.primary"
            :label="t('primary')"
            :hint="t('primaryHint')"
          />
          <ColorField
            v-model="style.primaryHover"
            :label="t('primaryHover')"
            :hint="t('primaryHoverHint')"
          />
          <ColorField
            v-model="style.text"
            :label="t('textColor')"
            :hint="t('textColorHint')"
          />
          <ColorField
            v-model="style.bg"
            :label="t('bgColor')"
            :hint="t('bgColorHint')"
          />

          <div class="field">
            <label
              class="field__label"
              :for="`${uid}-font`"
            >{{ t('font') }}</label>
            <select
              :id="`${uid}-font`"
              v-model="style.font"
              class="input cfg__select"
            >
              <option
                v-for="(font, key) in FONTS"
                :key="key"
                :value="key"
              >
                {{ font.label }}{{ key === DEFAULT_STYLE.font ? ` (${t('siteDefault')})` : '' }}
              </option>
            </select>
          </div>

          <div class="field">
            <span class="field__label">{{ t('corners') }}</span>
            <SegmentedControl
              v-model="style.radius"
              :label="t('corners')"
              :options="RADII.map(r => ({value: r.key, label: t(`radius_${r.key}`)}))"
            />
          </div>

          <div class="field">
            <span class="field__label">{{ t('theme') }}</span>
            <SegmentedControl
              v-model="style.theme"
              :label="t('theme')"
              :options="THEMES.map(th => ({value: th, label: t(`theme_${th}`)}))"
            />
            <p class="field__hint">
              {{ t(`themeHint_${style.theme}`) }}
            </p>
          </div>
        </section>

        <section class="cfg__section">
          <div class="cfg__section-head">
            <h2>{{ t('widget') }}</h2>
          </div>

          <div class="field">
            <span class="field__label">{{ t('language') }}</span>
            <SegmentedControl
              v-model="options.lang"
              :label="t('language')"
              :options="[{value: 'nl', label: 'NL'}, {value: 'en', label: 'EN'}]"
            />
          </div>

          <div class="field">
            <div class="cfg__inline">
              <span class="field__label">{{ t('sources') }}</span>
              <span class="cfg__count">{{ options.sources.length === 0 ? t('allSources') : t('nSources', {n: options.sources.length}) }}</span>
            </div>
            <p class="field__hint">
              {{ t('sourcesHint') }}
            </p>
            <ul
              v-if="sources.length > 0"
              class="cfg__sources"
            >
              <li
                v-for="source in sources"
                :key="source.uri"
              >
                <label class="cfg__check">
                  <input
                    type="checkbox"
                    :value="source.uri"
                    :checked="options.sources.includes(source.uri)"
                    @change="toggleSource(source.uri)"
                  >
                  <span>{{ source.name }}<small v-if="source.alternateName"> ({{ source.alternateName }})</small></span>
                </label>
              </li>
            </ul>
            <p
              v-else
              class="field__hint"
            >
              {{ t('sourcesLoading') }}
            </p>
          </div>

          <div class="field">
            <span class="field__label">{{ t('types') }}</span>
            <div class="chip-row">
              <label
                v-for="type in RESULT_TYPES"
                :key="type"
                class="chip chip-toggle"
              >
                <input
                  type="checkbox"
                  :value="type"
                  :checked="options.types.includes(type)"
                  @change="toggleType(type)"
                >
                {{ typeLabel(type) }}
              </label>
            </div>
            <p class="field__hint">
              {{ options.types.length === 0 ? t('allTypes') : t('typesChosen') }}
            </p>
          </div>

          <div class="cfg__two">
            <div class="field">
              <label
                class="field__label"
                :for="`${uid}-limit`"
              >{{ t('limit') }}</label>
              <input
                :id="`${uid}-limit`"
                v-model.number="options.limit"
                class="input cfg__input"
                type="number"
                min="1"
                max="100"
              >
            </div>
            <div class="field">
              <label
                class="field__label"
                :for="`${uid}-placeholder`"
              >{{ t('placeholder') }}</label>
              <input
                :id="`${uid}-placeholder`"
                v-model="options.placeholder"
                class="input cfg__input"
                type="text"
                :placeholder="t('placeholderDefault')"
              >
            </div>
          </div>
        </section>
      </aside>

      <main class="cfg__main">
        <section class="cfg__block">
          <div class="cfg__block-head">
            <h2>{{ t('previewTitle') }}</h2>
            <SegmentedControl
              v-model="previewKind"
              :label="t('previewKind')"
              :options="[{value: 'website', label: t('previewWebsite')}, {value: 'cms', label: t('previewCms')}]"
            />
          </div>
          <p class="cfg__legend">
            <span class="cfg__legend-swatch" />
            {{ t('legend') }}
          </p>

          <div
            ref="previewOuter"
            class="preview"
            :style="{height: previewHeight ? `${previewHeight}px` : undefined}"
          >
            <div
              ref="previewInner"
              class="preview__page"
              :class="`preview__page--${previewKind}`"
              :style="{width: `${DESIGN_WIDTH}px`, transform: `scale(${previewScale})`, fontFamily: fontFamily, ...pageVars}"
            >
              <template v-if="previewKind === 'website'">
                <div class="mock-nav">
                  <span class="mock-nav__brand">{{ t('mockBrand') }}</span>
                  <span class="mock-nav__links"><span>{{ t('mockNav1') }}</span><span>{{ t('mockNav2') }}</span><span>{{ t('mockNav3') }}</span><span class="mock-nav__cta">{{ t('mockNav4') }}</span></span>
                </div>
                <section class="mock-section">
                  <div class="mock-section__intro">
                    <p class="mock-section__eyebrow">
                      {{ t('mockEyebrow') }}
                    </p>
                    <h2 class="mock-section__title">
                      {{ t('mockTitle') }}
                    </h2>
                    <p class="mock-section__text">
                      {{ t('mockText') }}
                    </p>
                  </div>
                  <div class="widget-area">
                    <span class="widget-area__label">&lt;vtn-search&gt;</span>
                    <vtn-search
                      :key="`web-${options.lang}`"
                      class="vtn-preview"
                      :style="widgetVars"
                      :lang="options.lang"
                      :sources="options.sources.length > 0 ? options.sources.join(',') : null"
                      :types="options.types.length > 0 ? options.types.map(x => x.toLowerCase()).join(',') : null"
                      :limit="options.limit !== 20 ? options.limit : null"
                      :placeholder="options.placeholder || null"
                      :theme="style.theme"
                    />
                  </div>
                </section>
              </template>

              <template v-else>
                <div class="mock-cms">
                  <aside class="mock-cms__side">
                    <p class="mock-cms__logo">
                      {{ t('cmsName') }}
                    </p>
                    <ul>
                      <li>{{ t('cmsNav1') }}</li>
                      <li class="is-active">
                        {{ t('cmsNav2') }}
                      </li>
                      <li>{{ t('cmsNav3') }}</li>
                      <li>{{ t('cmsNav4') }}</li>
                    </ul>
                  </aside>
                  <div class="mock-cms__main">
                    <p class="mock-cms__crumb">
                      {{ t('cmsNav2') }} › {{ t('cmsRecord') }}
                    </p>
                    <h2 class="mock-cms__title">
                      {{ t('cmsRecordTitle') }}
                    </h2>
                    <div class="mock-cms__grid">
                      <div class="mock-field">
                        <label>{{ t('cmsInventory') }}</label>
                        <input
                          type="text"
                          value="2024.0183"
                          readonly
                        >
                      </div>
                      <div class="mock-field">
                        <label>{{ t('cmsObjectName') }}</label>
                        <input
                          type="text"
                          value="olieverfschilderij"
                          readonly
                        >
                      </div>
                      <div class="mock-field mock-field--wide">
                        <label>{{ t('cmsCreator') }}</label>
                        <div class="mock-field__picked">
                          <template v-if="picked">
                            <span class="mock-field__picked-label">{{ picked.prefLabel }}</span>
                            <span class="chip chip--tag">{{ typeLabel(picked.resultType) }}</span>
                            <span class="mock-field__picked-source">{{ picked.source.name }}</span>
                            <code class="mock-field__picked-uri">{{ picked.uri }}</code>
                            <button
                              type="button"
                              class="link-btn"
                              @click="picked = null"
                            >
                              {{ t('cmsClear') }}
                            </button>
                          </template>
                          <span
                            v-else
                            class="mock-field__empty"
                          >{{ t('cmsPickHint') }}</span>
                        </div>
                      </div>
                      <div class="mock-field mock-field--wide">
                        <div class="widget-area">
                          <span class="widget-area__label">&lt;vtn-search&gt; · vtn:select</span>
                          <vtn-search
                            :key="`cms-${options.lang}`"
                            class="vtn-preview"
                            :style="widgetVars"
                            :lang="options.lang"
                            :sources="options.sources.length > 0 ? options.sources.join(',') : null"
                            :types="options.types.length > 0 ? options.types.map(x => x.toLowerCase()).join(',') : null"
                            :limit="options.limit !== 20 ? options.limit : null"
                            :placeholder="options.placeholder || null"
                            :theme="style.theme"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <p
            v-if="lastEvent"
            class="cfg__event"
          >
            <span class="status status--info">{{ t('lastEvent') }}</span>
            <code>{{ lastEvent }}</code>
          </p>
        </section>

        <section class="cfg__block cfg__block--card">
          <div class="cfg__block-head">
            <h2>{{ t('installTitle') }}</h2>
            <SegmentedControl
              v-model="platform"
              :label="t('platform')"
              :options="[{value: 'html', label: t('platformHtml')}, {value: 'framer', label: t('platformFramer')}]"
            />
          </div>

          <template v-if="platform === 'html'">
            <InstallStep
              :number="1"
              :title="t('step1Title')"
              :body="t('step1Body')"
              :code="scriptTag"
            />
            <InstallStep
              :number="2"
              :title="t('step2Title')"
              :body="t('step2Body')"
              :code="elementTag"
            />
            <InstallStep
              v-if="cssSnippet"
              :number="3"
              :title="t('step3Title')"
              :body="t('step3Body')"
              :code="cssSnippet"
            />
            <InstallStep
              :number="cssSnippet ? 4 : 3"
              :title="t('step4Title')"
              :body="t('step4Body')"
              :code="eventSnippet"
            />
          </template>
          <template v-else>
            <InstallStep
              :number="1"
              :title="t('framer1Title')"
              :body="t('framer1Body')"
              :code="framerHead"
            />
            <InstallStep
              :number="2"
              :title="t('framer2Title')"
              :body="t('framer2Body')"
              :code="elementTag"
            />
            <p class="cfg__note">
              {{ t('framerNote') }}
            </p>
          </template>

          <p class="cfg__note">
            {{ t('installNote') }}
            <router-link :to="{name: 'widget', hash: '#configuratie'}">
              {{ t('installNoteLink') }}
            </router-link>
          </p>
        </section>
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref, useId, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useQuery} from 'villus';
import {ArrowPathIcon} from '@heroicons/vue/16/solid';
import {RESULT_TYPES} from '../widget/api';
import {VtnSelectDetail, VtnSearchDetail, VtnErrorDetail, defineVtnSearch} from '../widget/element';
import ColorField from './widget-v2/ColorField.vue';
import SegmentedControl from './widget-v2/SegmentedControl.vue';
import InstallStep from './widget-v2/InstallStep.vue';
import {messages} from './widget-v2/messages';

// The live preview is the real component: the same code as the embed script.
defineVtnSearch();

const {t, locale} = useI18n({useScope: 'local', messages});
const uid = useId();

// ---- style ------------------------------------------------------------------------------------
/** Fonts offered in the picker; `bunny` is the Bunny Fonts family string, null for fonts a page has anyway. */
const FONTS = {
  figtree: {label: 'Figtree', family: '"Figtree Variable", Figtree, sans-serif', bunny: 'figtree:400,500,600,700'},
  system: {label: 'System', family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', bunny: null},
  inter: {label: 'Inter', family: 'Inter, sans-serif', bunny: 'inter:400,500,600,700'},
  'dm-sans': {label: 'DM Sans', family: '"DM Sans", sans-serif', bunny: 'dm-sans:400,500,600,700'},
  poppins: {label: 'Poppins', family: 'Poppins, sans-serif', bunny: 'poppins:400,500,600,700'},
  'plus-jakarta-sans': {label: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", sans-serif', bunny: 'plus-jakarta-sans:400,500,600,700'},
  'source-sans-3': {label: 'Source Sans 3', family: '"Source Sans 3", sans-serif', bunny: 'source-sans-3:400,600,700'},
  lora: {label: 'Lora (serif)', family: 'Lora, Georgia, serif', bunny: 'lora:400,500,600,700'},
} as const;
type FontKey = keyof typeof FONTS;

const RADII = [
  {key: 'soft', value: '10px'},
  {key: 'round', value: '20px'},
  {key: 'square', value: '3px'},
] as const;
type RadiusKey = typeof RADII[number]['key'];

const THEMES = ['light', 'dark', 'inherit'] as const;
type ThemeKey = typeof THEMES[number];

interface WidgetStyle {
  primary: string;
  primaryHover: string;
  text: string;
  bg: string;
  font: FontKey;
  radius: RadiusKey;
  theme: ThemeKey;
}

/** meemoo's own look: what the widget shows without any custom property. */
const DEFAULT_STYLE: WidgetStyle = {
  primary: '#009690',
  primaryHover: '#00c8aa',
  text: '#141414',
  bg: '#ffffff',
  font: 'figtree',
  radius: 'soft',
  theme: 'light',
};
const DARK_DEFAULTS = {text: '#f3f4f6', bg: '#111827'};

const style = reactive<WidgetStyle>({...DEFAULT_STYLE});
const styleChanged = computed(() => (Object.keys(DEFAULT_STYLE) as (keyof WidgetStyle)[]).some(key => style[key] !== DEFAULT_STYLE[key]));
const resetStyle = () => Object.assign(style, DEFAULT_STYLE);

// Switching to dark picks dark neutrals unless the user set their own; back to light restores meemoo's.
watch(() => style.theme, (theme, previous) => {
  const was = previous === 'dark' ? DARK_DEFAULTS : {text: DEFAULT_STYLE.text, bg: DEFAULT_STYLE.bg};
  const now = theme === 'dark' ? DARK_DEFAULTS : {text: DEFAULT_STYLE.text, bg: DEFAULT_STYLE.bg};
  if (style.text === was.text) {
    style.text = now.text;
  }
  if (style.bg === was.bg) {
    style.bg = now.bg;
  }
});

const fontFamily = computed(() => FONTS[style.font].family);

/** The custom properties that differ from the widget's own defaults: what goes in the CSS snippet. */
const customProperties = computed(() => {
  const vars: Record<string, string> = {};
  const neutralDefaults = style.theme === 'dark' ? DARK_DEFAULTS : {text: DEFAULT_STYLE.text, bg: DEFAULT_STYLE.bg};
  if (style.primary !== DEFAULT_STYLE.primary) {
    vars['--vtn-primary'] = style.primary;
  }
  if (style.primaryHover !== DEFAULT_STYLE.primaryHover) {
    vars['--vtn-primary-hover'] = style.primaryHover;
  }
  if (style.theme !== 'inherit') {
    if (style.text !== neutralDefaults.text) {
      vars['--vtn-text'] = style.text;
    }
    if (style.bg !== neutralDefaults.bg) {
      vars['--vtn-bg'] = style.bg;
    }
  }
  if (style.font !== 'system' && style.theme !== 'inherit') {
    vars['--vtn-font'] = FONTS[style.font].family;
  }
  const radius = RADII.find(r => r.key === style.radius)!;
  if (radius.key !== DEFAULT_STYLE.radius) {
    vars['--vtn-radius'] = radius.value;
  }

  return vars;
});

/**
 * The preview widget's properties, all of them set explicitly: this site defines the same --vtn-*
 * tokens on :root (index.css) and the widget would inherit them, so what the widget's own
 * defaults cover is reset to `initial` (the fallback in the shadow stylesheet then applies),
 * as on a page without such variables.
 */
const widgetVars = computed(() => {
  const inherit = style.theme === 'inherit';

  return {
    '--vtn-primary': style.primary,
    '--vtn-primary-hover': style.primaryHover,
    '--vtn-text': inherit ? 'initial' : style.text,
    '--vtn-bg': inherit ? 'initial' : style.bg,
    '--vtn-surface': 'initial',
    '--vtn-border': 'initial',
    '--vtn-muted': 'initial',
    '--vtn-font': inherit ? 'initial' : FONTS[style.font].family,
    '--vtn-font-size': 'initial',
    '--vtn-radius': RADII.find(r => r.key === style.radius)!.value,
  };
});

/** The mock page around the widget follows the chosen text/background in "inherit" mode, as a host page would. */
const pageVars = computed(() => style.theme === 'inherit'
  ? {'--mock-text': style.text, '--mock-bg': style.bg}
  : {'--mock-text': '#0e2423', '--mock-bg': '#e9e8e3'});

// Load the chosen font for the preview (Bunny Fonts, as the generated code does).
watch(() => style.font, (key) => {
  const font = FONTS[key];
  if (!font.bunny || document.querySelector(`link[data-vtn-font="${key}"]`)) {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.bunny.net/css?family=${font.bunny}&display=swap`;
  link.setAttribute('data-vtn-font', key);
  document.head.appendChild(link);
});

// ---- widget options -------------------------------------------------------------------------
interface WidgetOptions {
  lang: 'nl' | 'en';
  sources: string[];
  types: string[];
  limit: number;
  placeholder: string;
}
const options = reactive<WidgetOptions>({
  lang: locale.value === 'en' ? 'en' : 'nl',
  sources: [],
  types: [],
  limit: 20,
  placeholder: '',
});
watch(locale, (value) => { options.lang = value === 'en' ? 'en' : 'nl'; });

interface SourceRow {
  uri: string;
  name: string;
  alternateName: string | null;
}
const {data: sourcesData} = useQuery<{sources: SourceRow[]}>({
  query: 'query WidgetV2Sources { sources { uri name alternateName } }',
});
const sources = computed(() => [...(sourcesData.value?.sources ?? [])].sort((a, b) => a.name.localeCompare(b.name)));

const toggleSource = (uri: string) => {
  options.sources = options.sources.includes(uri) ? options.sources.filter(item => item !== uri) : [...options.sources, uri];
};
const toggleType = (type: string) => {
  options.types = options.types.includes(type) ? options.types.filter(item => item !== type) : [...options.types, type];
};
const typeLabel = (type: string) => t(`type_${type}`);

// ---- preview ----------------------------------------------------------------------------------
const DESIGN_WIDTH = 1200;
const previewKind = ref<'website' | 'cms'>('website');
const platform = ref<'html' | 'framer'>('html');
const previewOuter = ref<HTMLElement | null>(null);
const previewInner = ref<HTMLElement | null>(null);
const previewScale = ref(1);
const previewHeight = ref<number | null>(null);
const picked = ref<VtnSelectDetail | null>(null);
const lastEvent = ref('');

let observer: ResizeObserver | null = null;
const measure = () => {
  if (!previewOuter.value || !previewInner.value) {
    return;
  }
  const scale = Math.min(1, previewOuter.value.clientWidth / DESIGN_WIDTH);
  previewScale.value = scale;
  previewHeight.value = Math.ceil(previewInner.value.offsetHeight * scale);
};

const onSelect = (event: Event) => {
  const detail = (event as CustomEvent<VtnSelectDetail>).detail;
  picked.value = detail;
  lastEvent.value = `vtn:select ${JSON.stringify(detail)}`;
};
const onSearch = (event: Event) => {
  lastEvent.value = `vtn:search ${JSON.stringify((event as CustomEvent<VtnSearchDetail>).detail)}`;
};
const onError = (event: Event) => {
  const detail = (event as CustomEvent<VtnErrorDetail>).detail;
  lastEvent.value = `vtn:error ${JSON.stringify({source: detail.source?.name ?? null, type: detail.type})}`;
};

onMounted(() => {
  observer = new ResizeObserver(measure);
  if (previewOuter.value) {
    observer.observe(previewOuter.value);
  }
  if (previewInner.value) {
    observer.observe(previewInner.value);
  }
  // The events bubble (composed) out of the shadow root, so one listener on the page hears every widget.
  previewOuter.value?.addEventListener('vtn:select', onSelect);
  previewOuter.value?.addEventListener('vtn:search', onSearch);
  previewOuter.value?.addEventListener('vtn:error', onError);
  measure();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  previewOuter.value?.removeEventListener('vtn:select', onSelect);
  previewOuter.value?.removeEventListener('vtn:search', onSearch);
  previewOuter.value?.removeEventListener('vtn:error', onError);
});
watch([previewKind, () => options.lang], () => { lastEvent.value = ''; picked.value = null; });

// ---- the code to paste ----------------------------------------------------------------------
const origin = window.location.origin;
const scriptTag = computed(() => `<script src="${origin}/widget/vtn-widget.js" defer></` + 'script>');

const elementTag = computed(() => {
  const attributes: [string, string][] = [['lang', options.lang]];
  if (options.sources.length > 0) {
    attributes.push(['sources', options.sources.join(',')]);
  }
  if (options.types.length > 0) {
    attributes.push(['types', options.types.map(x => x.toLowerCase()).join(',')]);
  }
  if (options.limit !== 20) {
    attributes.push(['limit', String(options.limit)]);
  }
  if (options.placeholder) {
    attributes.push(['placeholder', options.placeholder.replace(/"/g, '&quot;')]);
  }
  if (style.theme !== 'light') {
    attributes.push(['theme', style.theme]);
  }
  const lines = attributes.map(([key, value]) => `  ${key}="${value}"`);

  return attributes.length <= 2
    ? `<vtn-search ${attributes.map(([key, value]) => `${key}="${value}"`).join(' ')}></vtn-search>`
    : `<vtn-search\n${lines.join('\n')}>\n</vtn-search>`;
});

const fontLink = computed(() => {
  const font = FONTS[style.font];

  return font.bunny && style.theme !== 'inherit'
    ? `<link rel="stylesheet" href="https://fonts.bunny.net/css?family=${font.bunny}&display=swap">`
    : '';
});

const cssSnippet = computed(() => {
  const vars = Object.entries(customProperties.value);
  if (vars.length === 0) {
    return '';
  }
  const css = `vtn-search {\n${vars.map(([key, value]) => `  ${key}: ${value};`).join('\n')}\n}`;

  return fontLink.value ? `${fontLink.value}\n<style>\n${css}\n</style>` : `<style>\n${css}\n</style>`;
});

const framerHead = computed(() => [scriptTag.value, cssSnippet.value].filter(Boolean).join('\n'));

const eventSnippet = computed(() => `const widget = document.querySelector('vtn-search');

widget.addEventListener('vtn:select', (event) => {
  const term = event.detail; // { uri, prefLabel, source: { uri, name }, resultType, language }
  document.querySelector('#${t('fieldPrefix')}-uri').value = term.uri;
  document.querySelector('#${t('fieldPrefix')}-label').value = term.prefLabel;
  document.querySelector('#${t('fieldPrefix')}-source').value = term.source.uri;
});`);
</script>

<style scoped>
.cfg-page { padding-bottom: var(--s-6); }
.cfg-head__eyebrow { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin-bottom: var(--s-3); font-size: var(--fs-sm); }
.cfg { display: grid; gap: var(--s-5); align-items: start; }
@media (min-width: 64em) { .cfg { grid-template-columns: 21rem minmax(0, 1fr); gap: var(--s-6); } }

.cfg__aside { display: grid; gap: var(--s-4); }
.cfg__section { display: grid; gap: var(--s-4); padding: var(--s-4); background: var(--vtn-surface); border: 1px solid var(--vtn-border); border-radius: var(--r-lg); }
.cfg__section-head { display: flex; align-items: center; justify-content: space-between; gap: var(--s-3); }
.cfg__section-head h2 { font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.1em; color: var(--vtn-muted); }
.cfg__reset { display: inline-flex; align-items: center; gap: 0.3em; font-size: var(--fs-xs); font-weight: 600; }
.cfg__select, .cfg__input { min-height: 2.75rem; font-size: var(--fs-md); padding-block: 0.5rem; }
.cfg__select { appearance: auto; }
.cfg__two { display: grid; gap: var(--s-3); grid-template-columns: 7rem minmax(0, 1fr); }
.cfg__inline { display: flex; align-items: baseline; justify-content: space-between; gap: var(--s-2); }
.cfg__count { font-size: var(--fs-xs); color: var(--vtn-muted); font-weight: 600; }
.cfg__sources { list-style: none; display: grid; gap: 2px; max-height: 15rem; overflow: auto; padding: var(--s-1); border: 1px solid var(--vtn-border); border-radius: var(--r-md); }
.cfg__check { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--s-2); padding: 0.4rem var(--s-2); border-radius: var(--r-sm); font-size: var(--fs-sm); cursor: pointer; }
.cfg__check:hover { background: var(--vtn-surface-2); }
.cfg__check:has(input:checked) { background: var(--vtn-mint-light); }
.cfg__check input { width: 1rem; height: 1rem; margin: 0; accent-color: var(--vtn-primary-strong); }
.cfg__check small { color: var(--vtn-muted); }

.cfg__main { display: grid; gap: var(--s-5); min-width: 0; }
.cfg__block { display: grid; gap: var(--s-3); }
.cfg__block--card { padding: var(--s-4); background: var(--vtn-surface); border: 1px solid var(--vtn-border); border-radius: var(--r-lg); gap: var(--s-5); }
.cfg__block-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--s-3); }
.cfg__block-head h2 { font-size: var(--fs-lg); }
.cfg__legend { display: flex; align-items: center; gap: var(--s-2); font-size: var(--fs-xs); color: var(--vtn-muted); }
.cfg__legend-swatch { width: 1.25rem; height: 0.75rem; border: 2px dashed #7c3aed; border-radius: 3px; }
.cfg__event { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2) var(--s-3); font-size: var(--fs-xs); color: var(--vtn-muted); }
.cfg__event code { font-size: var(--fs-xs); overflow-wrap: anywhere; }
.cfg__note { font-size: var(--fs-xs); color: var(--vtn-muted); }
@media (min-width: 48em) { .cfg__block--card { padding: var(--s-5); } }

/* the scaled mock page */
.preview { overflow: hidden; border: 1px solid var(--vtn-border); border-radius: var(--r-lg); background: var(--mock-bg, #e9e8e3); }
.preview__page { transform-origin: top left; background: var(--mock-bg, #e9e8e3); color: var(--mock-text, #0e2423); padding: 3rem 3.5rem 3.5rem; }
.preview__page--cms { padding: 0; }
.widget-area { position: relative; outline: 2px dashed #7c3aed; outline-offset: 10px; border-radius: 14px; }
.widget-area__label { position: absolute; top: -26px; left: 1rem; z-index: 1; padding: 0.15rem 0.7rem; border-radius: 999px; background: #7c3aed; color: #fff; font: 600 13px/1.5 var(--vtn-mono); }
.vtn-preview { padding: 1.25rem; border-radius: 14px; }

.mock-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2.5rem; padding: 0 1rem; font-size: 17px; }
.mock-nav__brand { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }
.mock-nav__links { display: flex; align-items: center; gap: 2.25rem; opacity: 0.75; }
.mock-nav__cta { padding: 0.65rem 1.4rem; border-radius: 999px; background: currentColor; }
.mock-nav__cta { color: var(--mock-bg, #e9e8e3); background: var(--mock-text, #0e2423); opacity: 1; }
.mock-section { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 3.5rem; align-items: start; padding: 3.5rem; border-radius: 32px; background: color-mix(in srgb, var(--mock-text, #0e2423) 4%, var(--mock-bg, #e9e8e3)); }
.mock-section__eyebrow { margin-bottom: 1rem; font-size: 14px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.6; }
.mock-section__title { font-size: 46px; line-height: 1.05; font-weight: 700; letter-spacing: -0.03em; }
.mock-section__text { margin-top: 1.5rem; font-size: 18px; line-height: 1.6; opacity: 0.7; }

.mock-cms { display: grid; grid-template-columns: 15rem minmax(0, 1fr); min-height: 30rem; background: #f6f7f9; color: #1f2937; }
.mock-cms__side { padding: 1.75rem 1.25rem; background: #1f2937; color: #e5e7eb; }
.mock-cms__logo { font-weight: 800; font-size: 18px; letter-spacing: -0.01em; margin-bottom: 1.5rem; }
.mock-cms__side ul { list-style: none; display: grid; gap: 0.2rem; font-size: 15px; }
.mock-cms__side li { padding: 0.55rem 0.75rem; border-radius: 8px; opacity: 0.75; }
.mock-cms__side li.is-active { background: rgba(255, 255, 255, 0.12); opacity: 1; font-weight: 600; }
.mock-cms__main { padding: 2rem 2.5rem 2.5rem; }
.mock-cms__crumb { font-size: 13px; color: #6b7280; margin-bottom: 0.5rem; }
.mock-cms__title { font-size: 26px; font-weight: 700; margin-bottom: 1.5rem; letter-spacing: -0.01em; }
.mock-cms__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem 1.5rem; }
.mock-field { display: grid; gap: 0.4rem; }
.mock-field--wide { grid-column: 1 / -1; }
.mock-field label { font-size: 13px; font-weight: 600; color: #374151; }
.mock-field input { min-height: 2.6rem; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 15px; color: #111827; }
.mock-field__picked { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 0.75rem; min-height: 2.6rem; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 8px; background: #fff; font-size: 15px; }
.mock-field__picked-label { font-weight: 600; }
.mock-field__picked-source { color: #6b7280; font-size: 13px; }
.mock-field__picked-uri { font-size: 12px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.mock-field__empty { color: #9ca3af; }
.mock-field .widget-area { margin-top: 1.5rem; }
</style>
