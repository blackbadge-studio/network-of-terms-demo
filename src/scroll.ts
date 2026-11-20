/** Room left above an element that is scrolled to, so it does not sit against the edge of the window. */
const TOP_GAP = 16;

/**
 * Brings an element to the top of the window and keeps it there while the page around it still changes
 * (a list fills in, results arrive): until `until()` says the page is done, the time is up, or the reader moves.
 * It waits on a timer, not on animation frames: a tab in the background draws none and would never scroll.
 */
export function holdAtTop(find: () => Element | null | undefined, options: {forMs?: number, until?: () => boolean} = {}) {
  let deadline = Date.now() + (options.forMs ?? 2500);
  let finishing = false;
  let released = false;
  const release = () => { released = true; };
  const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  events.forEach(type => window.addEventListener(type, release, {once: true, passive: true}));

  const tick = () => {
    if (released || Date.now() > deadline) {
      events.forEach(type => window.removeEventListener(type, release));
      return;
    }
    const top = find()?.getBoundingClientRect().top;
    if (top !== undefined && Math.abs(top - TOP_GAP) > 2) {
      window.scrollBy({top: top - TOP_GAP, behavior: 'instant'});
    }
    // Once the page says it is done, allow it a moment to draw, then stop.
    if (!finishing && options.until?.()) {
      finishing = true;
      deadline = Math.min(deadline, Date.now() + 300);
    }
    setTimeout(tick, 50);
  };
  tick();
}

/**
 * For a scroll the visitor caused (pressing search): returns a function that glides the element to the top of
 * the window, and says whether the page was long enough to get it there. Call it when the element appears, and
 * again once its content has arrived if it could not get there. It does nothing once the visitor has moved the
 * page themself. The glide is the page's own scroll behaviour (smooth, or a jump for who asked for less motion).
 */
export function glideToTop(find: () => Element | null | undefined): () => boolean {
  let released = false;
  const release = () => { released = true; };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(type => window.addEventListener(type, release, {once: true, passive: true}));

  return () => {
    const top = find()?.getBoundingClientRect().top;
    if (released || top === undefined) {
      return true;
    }
    const distance = top - TOP_GAP;
    if (Math.abs(distance) > 2) {
      window.scrollBy({top: distance});
    }
    const room = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    return distance <= room;
  };
}
