/**
 * Black Badge Studio feedback widget: one vanilla-JS file that mounts its own
 * floating button on document.body. It must load from its own host (it derives
 * the API URL from the script origin) and only accepts origins registered on
 * the project behind the public `data-key`.
 */
const DEFAULT_SCRIPT = 'https://app.blackbadge.studio/feedback-widget.js';
const SCRIPT_ID = 'bbs-feedback-widget';

export function mountFeedbackWidget() {
  const key = import.meta.env.VITE_FEEDBACK_WIDGET_KEY;
  if (!key) {
    return;
  }
  // Framed pages are skipped: the screenshot feature needs an unframed secure context.
  if (window.self !== window.top || document.getElementById(SCRIPT_ID)) {
    return;
  }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--vtn-primary').trim() || '#009690';
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.src = import.meta.env.VITE_FEEDBACK_WIDGET_SCRIPT || DEFAULT_SCRIPT;
  script.defer = true;
  script.dataset.key = key;
  script.dataset.accent = accent;
  script.dataset.label = 'Feedback';
  script.dataset.version = import.meta.env.VITE_APP_VERSION || __BUILD_TIME__;
  document.body.appendChild(script);
  // Lets the layout keep content clear of the floating button on small screens.
  document.documentElement.classList.add('has-feedback-widget');
}
