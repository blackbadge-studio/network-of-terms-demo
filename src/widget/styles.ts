/**
 * The widget's stylesheet, inside its shadow root. The host page styles it through the public
 * custom properties on the element (or an ancestor); everything else is derived from them:
 *
 *   --vtn-primary        buttons, active states, focus ring        (#009690)
 *   --vtn-primary-hover  hover colour of the primary button         (#00c8aa)
 *   --vtn-text           text                                       (#141414 / #f3f4f6 dark)
 *   --vtn-bg             the widget's background                    (#ffffff / #111827 dark)
 *   --vtn-surface        cards and the input                        (= --vtn-bg)
 *   --vtn-border         borders                                    (derived)
 *   --vtn-muted          secondary text                             (derived)
 *   --vtn-font           font family                                (system stack)
 *   --vtn-font-size      base font size                             (1rem)
 *   --vtn-radius         corner radius of inputs, buttons, cards    (10px)
 *
 * theme="dark" swaps the neutral fallbacks; theme="inherit" takes text, background and font from
 * the page and only draws its own controls.
 */
export const WIDGET_STYLES = `
:host {
  --_primary: var(--vtn-primary, #009690);
  --_primary-hover: var(--vtn-primary-hover, #00c8aa);
  --_text: var(--vtn-text, #141414);
  --_bg: var(--vtn-bg, #ffffff);
  --_surface: var(--vtn-surface, var(--_bg));
  --_surface-2: color-mix(in srgb, var(--_text) 5%, var(--_bg));
  --_border: var(--vtn-border, color-mix(in srgb, var(--_text) 16%, var(--_bg)));
  --_muted: var(--vtn-muted, color-mix(in srgb, var(--_text) 62%, var(--_bg)));
  --_font: var(--vtn-font, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
  --_mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --_fs: var(--vtn-font-size, 1rem);
  --_radius: var(--vtn-radius, 10px);
  --_on-primary: #ffffff;
  --_ok: #1b7f3b; --_ok-bg: color-mix(in srgb, #1b7f3b 14%, var(--_bg));
  --_warn: #8a5a00; --_warn-bg: color-mix(in srgb, #e3a008 18%, var(--_bg));
  --_danger: #b3261e; --_danger-bg: color-mix(in srgb, #b3261e 12%, var(--_bg));
  --_focus: 0 0 0 3px color-mix(in srgb, var(--_primary) 35%, transparent);

  display: block;
  box-sizing: border-box;
  font-family: var(--_font);
  font-size: var(--_fs);
  line-height: 1.5;
  color: var(--_text);
  background: var(--_bg);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:host([hidden]) { display: none; }
:host([theme="dark"]) {
  --_text: var(--vtn-text, #f3f4f6);
  --_bg: var(--vtn-bg, #111827);
  --_ok: #6fd48c; --_warn: #f0c060; --_danger: #f28b82;
}
:host([theme="inherit"]) {
  --_text: var(--vtn-text, inherit);
  --_bg: var(--vtn-bg, transparent);
  --_surface: var(--vtn-surface, transparent);
  --_surface-2: color-mix(in srgb, currentColor 6%, transparent);
  --_border: var(--vtn-border, color-mix(in srgb, currentColor 18%, transparent));
  --_muted: var(--vtn-muted, color-mix(in srgb, currentColor 65%, transparent));
  --_font: var(--vtn-font, inherit);
  --_fs: var(--vtn-font-size, inherit);
  color: inherit;
  background: transparent;
}
*, *::before, *::after { box-sizing: inherit; }
button, input { font: inherit; color: inherit; margin: 0; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .55; }
:focus-visible { outline: none; box-shadow: var(--_focus); }
a { color: var(--_primary); }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.widget { display: grid; gap: .9em; }

/* search row */
.form { display: grid; gap: .5em; }
.row { display: flex; gap: .5em; }
.input-wrap { position: relative; flex: 1 1 auto; min-width: 0; }
.input-wrap svg { position: absolute; left: .8em; top: 50%; width: 1.1em; height: 1.1em; transform: translateY(-50%); color: var(--_muted); pointer-events: none; }
.input {
  width: 100%; min-height: 2.9em; padding: .55em .9em .55em 2.6em;
  background: var(--_surface); color: var(--_text);
  border: 1.5px solid var(--_border); border-radius: var(--_radius);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.input::placeholder { color: var(--_muted); opacity: 1; }
.input:hover { border-color: var(--_primary); }
.input:focus-visible { border-color: var(--_primary); box-shadow: var(--_focus); }
.input::-webkit-search-cancel-button { -webkit-appearance: none; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: .4em;
  min-height: 2.9em; padding: .55em 1.1em; border: 1.5px solid transparent; border-radius: var(--_radius);
  font-weight: 600; line-height: 1.2; white-space: nowrap; text-decoration: none;
  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease;
}
.btn--primary { background: var(--_primary); border-color: var(--_primary); color: var(--_on-primary); }
.btn--primary:hover:not(:disabled) { background: var(--_primary-hover); border-color: var(--_primary-hover); color: #111; }
.btn--secondary { background: var(--_surface); border-color: var(--_border); color: var(--_text); }
.btn--secondary:hover:not(:disabled) { border-color: var(--_primary); color: var(--_primary); }
.btn--ghost { background: transparent; border-color: transparent; color: var(--_primary); padding-inline: .6em; }
.btn--ghost:hover:not(:disabled) { background: var(--_surface-2); }
.btn--sm { min-height: 2.1em; padding: .25em .75em; font-size: .875em; }
.btn--selected { background: var(--_ok-bg); border-color: var(--_ok); color: var(--_ok); }
.btn svg { width: 1em; height: 1em; flex: none; }

.meta { display: flex; flex-wrap: wrap; align-items: center; gap: .35em .75em; font-size: .8125em; color: var(--_muted); }
.meta b { color: var(--_text); font-weight: 600; }

/* notices */
.notice { display: flex; flex-wrap: wrap; align-items: center; gap: .5em 1em; padding: .7em .9em; border-radius: var(--_radius); border: 1px solid var(--_border); background: var(--_surface-2); font-size: .875em; }
.notice--error { background: var(--_danger-bg); border-color: color-mix(in srgb, var(--_danger) 30%, transparent); }

/* results */
.results { display: grid; gap: 1.1em; }
.results__bar { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .25em 1em; padding-bottom: .5em; border-bottom: 1px solid var(--_border); }
.results__summary { font-weight: 700; }
.results__meta { font-size: .8125em; color: var(--_muted); }
.source { display: grid; gap: .5em; }
.source__head { display: flex; flex-wrap: wrap; align-items: center; gap: .25em .75em; }
.source__title { margin: 0; font-size: 1em; font-weight: 700; }
.source__title small { font-weight: 500; color: var(--_muted); font-size: .85em; }
.source__state { margin-left: auto; display: inline-flex; align-items: center; gap: .5em; }
.status { display: inline-flex; align-items: center; gap: .4em; padding: .15em .6em; border-radius: 999px; font-size: .75em; font-weight: 700; letter-spacing: .02em; white-space: nowrap; background: var(--_surface-2); color: var(--_muted); }
.status::before { content: ""; width: .5em; height: .5em; border-radius: 50%; background: currentColor; }
.status--ok { background: var(--_ok-bg); color: var(--_ok); }
.status--timeout { background: var(--_warn-bg); color: var(--_warn); }
.status--error { background: var(--_danger-bg); color: var(--_danger); }
.status--loading::before { animation: vtn-pulse 1s ease-in-out infinite; }
.source__notice { font-size: .875em; color: var(--_muted); padding: .5em .75em; border: 1px dashed var(--_border); border-radius: var(--_radius); }
.terms { display: grid; gap: .5em; list-style: none; margin: 0; padding: 0; }

.term { background: var(--_surface); border: 1px solid var(--_border); border-radius: var(--_radius); padding: .8em .9em; display: grid; gap: .45em; transition: border-color 120ms ease; }
.term:hover { border-color: var(--_primary); }
.term--selected { border-color: var(--_ok); box-shadow: inset 3px 0 0 var(--_ok); }
.term__head { display: flex; flex-wrap: wrap; align-items: center; gap: .3em .6em; }
.term__title { margin: 0; font-size: 1.0625em; font-weight: 700; }
.term__type { display: inline-flex; align-items: center; min-height: 1.5em; padding: .05em .6em; border-radius: 999px; background: var(--_surface-2); color: var(--_muted); font-size: .75em; font-weight: 600; letter-spacing: .01em; margin-left: auto; }
.term__note { margin: 0; font-size: .9em; color: var(--_muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.term--open .term__note { display: block; }
.term__uri { display: flex; align-items: center; gap: .4em; min-width: 0; font-family: var(--_mono); font-size: .75em; color: var(--_muted); }
.term__uri code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.term__actions { display: flex; flex-wrap: wrap; align-items: center; gap: .4em; }
.term__actions .spacer { flex: 1; }
.copy { display: inline-grid; place-items: center; width: 1.8em; height: 1.8em; border: 0; border-radius: calc(var(--_radius) / 2); background: transparent; color: var(--_primary); padding: 0; flex: none; }
.copy:hover { background: var(--_surface-2); }
.copy svg { width: 1.05em; height: 1.05em; }
.copy.is-copied { color: var(--_ok); }
.term__details { display: grid; gap: .6em; padding-top: .6em; border-top: 1px dashed var(--_border); font-size: .9em; }
.rel { display: grid; gap: .3em; }
.rel__caption { font-size: .75em; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--_muted); }
.rel__list { display: flex; flex-wrap: wrap; gap: .35em; }
.chip { display: inline-flex; align-items: center; min-height: 1.8em; padding: .1em .7em; border-radius: 999px; border: 1px solid var(--_border); background: var(--_surface); color: var(--_text); font-size: .85em; text-decoration: none; }
.chip:hover { border-color: var(--_primary); color: var(--_primary); }

.skeleton { height: 3.6em; border-radius: var(--_radius); background: linear-gradient(90deg, var(--_surface-2) 25%, var(--_border) 50%, var(--_surface-2) 75%); background-size: 200% 100%; animation: vtn-shimmer 1.4s linear infinite; }

.foot { display: flex; justify-content: flex-end; font-size: .75em; color: var(--_muted); }
.foot a { color: inherit; text-decoration: none; display: inline-flex; align-items: center; gap: .35em; }
.foot a:hover { color: var(--_primary); }
.foot i { width: .6em; height: .6em; border-radius: 50%; background: var(--_primary); display: inline-block; }

@keyframes vtn-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
@keyframes vtn-shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .status--loading::before, .skeleton { animation: none; } }
@media (max-width: 30em) { .row { flex-direction: column; } .term__type { margin-left: 0; } }
`;
