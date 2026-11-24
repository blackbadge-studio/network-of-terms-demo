/**
 * Black Badge Studio feedback widget: one vanilla-JS file that mounts its own
 * floating button on document.body. It must load from its own host (it derives
 * the API URL from the script origin) and only accepts origins registered on
 * the project behind the public `data-key`.
 */
import {router} from './router';

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
  // All four UI themes are light, so the widget uses its light theme and the studio mark.
  script.dataset.theme = 'light';
  script.dataset.icon = 'bbs';
  script.dataset.version = import.meta.env.VITE_APP_VERSION || __BUILD_TIME__;
  // The acceptance tab: the points of the tender that are checked in this interface (group ui of
  // the acceptance list the API serves). "Try" opens the test's page through the router, so the
  // panel stays open on the test.
  script.dataset.tests = 'ui';
  window.addEventListener('bbs-feedback:try', openTestPage);
  document.body.appendChild(script);
  // Lets the layout keep content clear of the floating button on small screens.
  document.documentElement.classList.add('has-feedback-widget');
}

function openTestPage(event: Event) {
  const url = (event as CustomEvent<{url?: string | null}>).detail?.url;
  if (!url) {
    return;
  }
  const target = new URL(url, window.location.href);
  if (target.origin !== window.location.origin) {
    return;
  }
  event.preventDefault();
  void router.push(target.pathname + target.search + target.hash);
}
