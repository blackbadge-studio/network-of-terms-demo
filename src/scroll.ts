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
