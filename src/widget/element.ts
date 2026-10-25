import {
  RESULT_TYPES, SourceState, TermsEntry, WidgetSource, WidgetTerm,
  fetchSources, fetchTerms, pickLabels, sourceState,
} from './api';
import {MESSAGES, WidgetLang, WidgetMessages, format, isWidgetLang} from './messages';
import {WIDGET_STYLES} from './styles';

/**
 * <vtn-search>: the embeddable federated search of the Vlaams Termennetwerk. One script tag
 * registers it; attributes configure it (see the Zoekwidget page):
 *
 *   sources      comma-separated source URIs            default: every source of the API
 *   lang         nl | en                                default: the page's language
 *   types        concept,person,organization,place,event  default: every type
 *   limit        results per source                     default: 20
 *   placeholder  text in the empty search field
 *   api          GraphQL endpoint                       default: the production API
 *   theme        light | dark | inherit                 default: light
 *
 * Events (CustomEvent, bubbling and composed, so a listener on the element or the document hears them):
 *   vtn:search  {query, sources, types}
 *   vtn:select  {uri, prefLabel, source: {uri, name}, resultType, language}
 *   vtn:error   {source, type, message}  per unreachable source, or source null for the API itself
 */

/** The `vtn:select` payload: the fields worth saving next to a record. */
export interface VtnSelectDetail {
  uri: string;
  prefLabel: string;
  source: {uri: string; name: string};
  resultType: string;
  language: string;
}

export interface VtnSearchDetail {
  query: string;
  sources: string[];
  types: string[];
}

export interface VtnErrorDetail {
  source: {uri: string; name: string} | null;
  type: string;
  message: string;
}

const DEFAULT_API = (import.meta.env.VITE_GRAPHQL_URL as string | undefined) || 'https://network-of-terms-production-59fup0.laravel.cloud/graphql';
const SITE_URL = 'https://vlaams-termennetwerk-ui-production-zi7ngv.laravel.cloud';

const ICONS = {
  search: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clip-rule="evenodd"/></svg>',
  copy: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10.986 3H12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1.014A2.25 2.25 0 0 1 7.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM9.5 4v-.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z" clip-rule="evenodd"/></svg>',
  check: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/></svg>',
  external: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0 0 1.5h1.69L6.22 8.72Z"/><path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 0 0 7 4H4.75A2.75 2.75 0 0 0 2 6.75v4.5A2.75 2.75 0 0 0 4.75 14h4.5A2.75 2.75 0 0 0 12 11.25V9a.75.75 0 0 0-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5Z"/></svg>',
};

const escape = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const splitList = (value: string | null): string[] =>
  (value ?? '').split(',').map(item => item.trim()).filter(Boolean);

const pageLang = (): WidgetLang => {
  const lang = (document.documentElement.lang || navigator.language || 'nl').slice(0, 2).toLowerCase();

  return isWidgetLang(lang) ? lang : 'nl';
};

type Phase = 'idle' | 'loading' | 'done' | 'failed';

export class VtnSearchElement extends HTMLElement {
  static readonly observedAttributes = ['sources', 'lang', 'types', 'limit', 'placeholder', 'api', 'theme'];

  private readonly root: ShadowRoot;
  private readonly ids = `vtn-${Math.random().toString(36).slice(2, 8)}`;
  private allSources: WidgetSource[] | null = null;
  private sourcesFailed = false;
  private phase: Phase = 'idle';
  private query = '';
  private entries: TermsEntry[] = [];
  private failure = '';
  private selectedUri: string | null = null;
  private openUris = new Set<string>();
  private copiedUri: string | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | undefined;
  private controller: AbortController | null = null;
  private frame = 0;

  constructor() {
    super();
    this.root = this.attachShadow({mode: 'open'});
    this.root.addEventListener('click', this.onClick);
    this.root.addEventListener('submit', this.onSubmit);
  }

  // ---- public API ---------------------------------------------------------------------------

  /** The current search text; setting it does not search (call search()). */
  get value(): string {
    return this.query;
  }

  set value(value: string) {
    this.query = value ?? '';
    const input = this.input();
    if (input && input.value !== this.query) {
      input.value = this.query;
    }
  }

  /** The chosen term's URI, or null. */
  get selected(): string | null {
    return this.selectedUri;
  }

  /** Runs a search, as the button does; resolves when the results are rendered. */
  async search(query?: string): Promise<void> {
    if (typeof query === 'string') {
      this.value = query;
    }
    await this.runSearch();
  }

  /** Clears the results and the search field. */
  reset(): void {
    this.controller?.abort();
    this.controller = null;
    this.query = '';
    this.phase = 'idle';
    this.entries = [];
    this.failure = '';
    this.selectedUri = null;
    this.openUris.clear();
    this.render();
  }

  // ---- lifecycle ----------------------------------------------------------------------------

  connectedCallback(): void {
    if (!this.hasAttribute('theme')) {
      this.setAttribute('theme', 'light');
    }
    this.render();
    void this.loadSources();
  }

  disconnectedCallback(): void {
    this.controller?.abort();
    clearTimeout(this.copiedTimer);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue || !this.isConnected) {
      return;
    }
    if (name === 'api') {
      this.allSources = null;
      void this.loadSources();
    }
    this.render();
  }

  // ---- configuration ------------------------------------------------------------------------

  private get widgetLang(): WidgetLang {
    const lang = this.getAttribute('lang');

    return isWidgetLang(lang) ? lang : pageLang();
  }

  private get messages(): WidgetMessages {
    return MESSAGES[this.widgetLang];
  }

  private get api(): string {
    return this.getAttribute('api') || DEFAULT_API;
  }

  private get limit(): number {
    const limit = Number.parseInt(this.getAttribute('limit') ?? '', 10);

    return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  }

  private get types(): string[] {
    return splitList(this.getAttribute('types'))
      .map(type => type.toUpperCase())
      .filter((type): type is typeof RESULT_TYPES[number] => (RESULT_TYPES as readonly string[]).includes(type));
  }

  private get sourceUris(): string[] {
    const chosen = splitList(this.getAttribute('sources'));
    if (chosen.length > 0) {
      return chosen;
    }

    return (this.allSources ?? []).map(source => source.uri);
  }


  // ---- data ---------------------------------------------------------------------------------

  private async loadSources(): Promise<void> {
    const api = this.api;
    try {
      const sources = await fetchSources(api, this.widgetLang);
      if (api === this.api) {
        this.allSources = sources;
        this.sourcesFailed = false;
      }
    } catch {
      if (api === this.api) {
        this.sourcesFailed = true;
      }
    }
    this.render();
  }

  private async runSearch(): Promise<void> {
    const query = this.query.trim();
    if (!query) {
      this.input()?.focus();

      return;
    }
    if (this.allSources === null && !this.hasAttribute('sources')) {
      await this.loadSources();
    }
    const sources = this.sourceUris;
    const types = this.types;

    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.phase = 'loading';
    this.failure = '';
    this.render();
    this.emit<VtnSearchDetail>('vtn:search', {query, sources, types});

    try {
      const entries = await fetchTerms({api: this.api, sources, query, lang: this.widgetLang, types, limit: this.limit, signal: controller.signal});
      if (controller.signal.aborted) {
        return;
      }
      this.entries = entries;
      this.phase = 'done';
      for (const entry of entries) {
        if (!('terms' in entry.result)) {
          this.emit<VtnErrorDetail>('vtn:error', {
            source: {uri: entry.source.uri, name: entry.source.name},
            type: entry.result.__typename,
            message: entry.result.message,
          });
        }
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.phase = 'failed';
      this.failure = message;
      this.emit<VtnErrorDetail>('vtn:error', {source: null, type: 'ApiError', message});
    }
    this.render();
  }

  private emit<T>(type: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(type, {detail, bubbles: true, composed: true}));
  }

  // ---- events -------------------------------------------------------------------------------

  private readonly onSubmit = (event: Event): void => {
    event.preventDefault();
    this.query = this.input()?.value ?? '';
    void this.runSearch();
  };

  private readonly onClick = (event: Event): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>('[data-action]');
    if (!target) {
      return;
    }
    const uri = target.dataset.uri ?? '';
    switch (target.dataset.action) {
      case 'select':
        this.select(uri);
        break;
      case 'toggle':
        if (this.openUris.has(uri)) {
          this.openUris.delete(uri);
        } else {
          this.openUris.add(uri);
        }
        this.render();
        break;
      case 'copy':
        void this.copy(uri);
        break;
      case 'retry':
        void this.runSearch();
        break;
      case 'lookup':
        this.query = target.dataset.query ?? '';
        void this.runSearch();
        break;
    }
  };

  private select(uri: string): void {
    for (const entry of this.entries) {
      if (!('terms' in entry.result)) {
        continue;
      }
      const term = entry.result.terms.find(item => item.uri === uri);
      if (term) {
        this.selectedUri = uri;
        this.render();
        this.emit<VtnSelectDetail>('vtn:select', {
          uri: term.uri,
          prefLabel: this.label(term),
          source: {uri: entry.source.uri, name: entry.source.name},
          resultType: term.resultType,
          language: this.widgetLang,
        });

        return;
      }
    }
  }

  private async copy(uri: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(uri);
    } catch {
      const area = document.createElement('textarea');
      area.value = uri;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    this.copiedUri = uri;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => {
      this.copiedUri = null;
      this.render();
    }, 1800);
    this.render();
  }

  // ---- rendering ----------------------------------------------------------------------------

  private input(): HTMLInputElement | null {
    return this.root.querySelector<HTMLInputElement>('input[type="search"]');
  }

  private label(term: WidgetTerm): string {
    return pickLabels(term.prefLabel, this.widgetLang).join(' · ') || term.uri;
  }

  /** Batches renders within a frame and keeps the search field's focus and caret. */
  private render(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.paint());
  }

  private paint(): void {
    const input = this.input();
    const hadFocus = input !== null && this.root.activeElement === input;
    const caret = input?.selectionStart ?? null;

    this.root.innerHTML = `<style>${WIDGET_STYLES}</style>${this.view()}`;

    const next = this.input();
    if (next) {
      next.value = this.query;
      if (hadFocus) {
        next.focus({preventScroll: true});
        if (caret !== null) {
          next.setSelectionRange(caret, caret);
        }
      }
    }
  }

  private view(): string {
    const m = this.messages;
    const loading = this.phase === 'loading';
    const sourceCount = this.hasAttribute('sources') ? splitList(this.getAttribute('sources')).length : this.allSources?.length;
    const sourcesLine = this.sourcesFailed && sourceCount === undefined
      ? `<span>${escape(m.apiError)}</span>`
      : sourceCount === undefined
        ? `<span>${escape(m.sourcesLoading)}</span>`
        : `<span>${escape(format(m.sourcesCount, {n: sourceCount}))}</span>`;
    const types = this.types;
    const typesLine = types.length > 0
      ? `<span>· ${types.map(type => escape(m.types[type] ?? type)).join(', ')}</span>`
      : '';

    return `
      <div class="widget" part="widget">
        <form class="form" role="search" novalidate>
          <label class="sr-only" for="${this.ids}-q">${escape(m.searchLabel)}</label>
          <div class="row">
            <div class="input-wrap">
              ${ICONS.search}
              <input class="input" id="${this.ids}-q" type="search" name="q" autocomplete="off" enterkeyhint="search"
                placeholder="${escape(this.getAttribute('placeholder') || m.placeholder)}" value="${escape(this.query)}"
                ${this.hasAttribute('autofocus') ? 'autofocus' : ''}>
            </div>
            <button class="btn btn--primary" type="submit" ${loading ? 'disabled' : ''}>${escape(loading ? m.searching : m.search)}</button>
          </div>
          <p class="meta" aria-live="polite">${sourcesLine}${typesLine}</p>
        </form>
        ${this.body()}
        <p class="foot"><a href="${SITE_URL}/${this.widgetLang}" target="_blank" rel="noopener"><i></i>${escape(m.poweredBy)}<span class="sr-only"> (${escape(m.externalLink)})</span></a></p>
      </div>`;
  }

  private body(): string {
    const m = this.messages;
    switch (this.phase) {
      case 'idle':
        return '';
      case 'loading':
        return `<div class="results" aria-busy="true"><div class="skeleton"></div><div class="skeleton"></div></div>`;
      case 'failed':
        return `<p class="notice notice--error" role="alert" title="${escape(this.failure)}"><span>${escape(m.apiError)}</span>
          <button class="btn btn--secondary btn--sm" type="button" data-action="retry">${escape(m.retry)}</button></p>`;
      default:
        return this.results();
    }
  }

  private results(): string {
    const m = this.messages;
    const termCount = this.entries.reduce((sum, entry) => sum + ('terms' in entry.result ? entry.result.terms.length : 0), 0);
    const okCount = this.entries.filter(entry => sourceState(entry.result) === 'ok').length;
    const ordered = [...this.entries].sort((a, b) => {
      const rank = (entry: TermsEntry) => ({ok: 0, none: 1, timeout: 2, error: 3})[sourceState(entry.result)];

      return rank(a) - rank(b);
    });

    return `
      <section class="results" aria-live="polite">
        <div class="results__bar">
          <p class="results__summary">${escape(format(m.summary, {n: termCount}))} ${escape(format(m.summaryIn, {n: okCount}))}</p>
          <p class="results__meta">${escape(format(m.resultsFor, {q: this.query.trim()}))}</p>
        </div>
        ${ordered.map(entry => this.source(entry)).join('')}
      </section>`;
  }

  private source(entry: TermsEntry): string {
    const m = this.messages;
    const state = sourceState(entry.result);
    const terms = 'terms' in entry.result ? entry.result.terms : [];
    const label: Record<SourceState, string> = {
      ok: format(m.stateResults, {n: terms.length}),
      none: m.stateNone,
      timeout: m.stateTimeout,
      error: m.stateUnreachable,
    };

    return `
      <article class="source" part="source">
        <header class="source__head">
          <h3 class="source__title">${escape(entry.source.name)}${entry.source.alternateName ? ` <small>(${escape(entry.source.alternateName)})</small>` : ''}</h3>
          <span class="source__state"><span class="status status--${state}" title="${entry.responseTimeMs} ms">${escape(label[state])}</span></span>
        </header>
        ${state === 'ok'
          ? `<ul class="terms">${terms.map(term => this.term(term, entry)).join('')}</ul>`
          : state === 'none'
            ? ''
            : `<p class="source__notice">${escape('terms' in entry.result ? '' : entry.result.message.split('\n')[0].slice(0, 160))}</p>`}
      </article>`;
  }

  private term(term: WidgetTerm, entry: TermsEntry): string {
    const m = this.messages;
    const lang = this.widgetLang;
    const label = this.label(term);
    const note = pickLabels(term.scopeNote, lang).join(' · ');
    const alt = [...new Set(pickLabels(term.altLabel, lang))];
    const open = this.openUris.has(term.uri);
    const selected = this.selectedUri === term.uri;
    const copied = this.copiedUri === term.uri;
    const hasDetails = alt.length + term.broader.length + term.narrower.length + term.related.length + term.exactMatch.length > 0 || note.length > 160;
    const relation = (caption: string, items: WidgetTerm['broader'], lookup: boolean) => items.length === 0 ? '' : `
      <div class="rel">
        <p class="rel__caption">${escape(caption)}</p>
        <div class="rel__list">${items.map(item => {
          const text = escape(pickLabels(item.prefLabel, lang).join(' · ') || item.uri);

          return lookup
            ? `<button class="chip" type="button" data-action="lookup" data-query="${escape(pickLabels(item.prefLabel, lang)[0] ?? '')}" title="${escape(item.uri)}">${text}</button>`
            : `<a class="chip" href="${escape(item.uri)}" target="_blank" rel="noopener" title="${escape(item.uri)}">${text}</a>`;
        }).join('')}</div>
      </div>`;

    return `
      <li class="term${open ? ' term--open' : ''}${selected ? ' term--selected' : ''}" part="term" data-uri="${escape(term.uri)}">
        <div class="term__head">
          <h4 class="term__title">${escape(label)}</h4>
          <span class="term__type">${escape(m.types[term.resultType] ?? term.resultType)}</span>
        </div>
        ${note ? `<p class="term__note">${escape(note)}</p>` : ''}
        <p class="term__uri"><code title="${escape(term.uri)}">${escape(term.uri)}</code>
          <button class="copy${copied ? ' is-copied' : ''}" type="button" data-action="copy" data-uri="${escape(term.uri)}" aria-label="${escape(copied ? m.copied : m.copyUri)}" title="${escape(copied ? m.copied : m.copyUri)}">${copied ? ICONS.check : ICONS.copy}</button>
        </p>
        <div class="term__actions">
          <button class="btn btn--sm ${selected ? 'btn--selected' : 'btn--primary'}" type="button" data-action="select" data-uri="${escape(term.uri)}" aria-label="${escape(format(m.selectTerm, {label}))}" aria-pressed="${selected}">
            ${selected ? ICONS.check : ''}${escape(selected ? m.selected : m.select)}
          </button>
          ${hasDetails ? `<button class="btn btn--ghost btn--sm" type="button" data-action="toggle" data-uri="${escape(term.uri)}" aria-expanded="${open}">${escape(open ? m.hideDetails : m.details)}</button>` : ''}
          <span class="spacer"></span>
          <a class="btn btn--ghost btn--sm" href="${escape(term.seeAlso[0] ?? entry.source.mainEntityOfPage ?? term.uri)}" target="_blank" rel="noopener">${escape(m.viewAtSource)} ${ICONS.external}<span class="sr-only"> (${escape(m.externalLink)})</span></a>
        </div>
        ${open ? `<div class="term__details">
          ${alt.length > 0 ? `<div class="rel"><p class="rel__caption">${escape(m.altLabels)}</p><p>${alt.map(escape).join(' · ')}</p></div>` : ''}
          ${relation(m.broader, term.broader, true)}
          ${relation(m.narrower, term.narrower, true)}
          ${relation(m.related, term.related, true)}
          ${relation(m.exactMatch, term.exactMatch, false)}
        </div>` : ''}
      </li>`;
  }
}

export const VTN_SEARCH_TAG = 'vtn-search';

/** Registers <vtn-search> once; safe to call from several bundles on one page. */
export function defineVtnSearch(): void {
  if (typeof window !== 'undefined' && !customElements.get(VTN_SEARCH_TAG)) {
    customElements.define(VTN_SEARCH_TAG, VtnSearchElement);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vtn-search': VtnSearchElement;
  }
  interface HTMLElementEventMap {
    'vtn:select': CustomEvent<VtnSelectDetail>;
    'vtn:search': CustomEvent<VtnSearchDetail>;
    'vtn:error': CustomEvent<VtnErrorDetail>;
  }
}
