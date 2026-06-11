'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Scroll-driven "polaroid wheel": the card nearest the scroller's vertical centre
 * stands upright and opaque; cards above/below tilt back, shrink and fade.
 *
 * Implemented in JS (rAF-throttled) rather than CSS `animation-timeline: view()`
 * because that isn't supported on iOS WebKit — which is exactly where the app runs
 * as a PWA, so the CSS version silently fell back to flat. This drives the same
 * transform on every browser. Honours `prefers-reduced-motion`.
 *
 * The container must have CSS `perspective` (see `.feed-wheel`); each direct child
 * is treated as a card. Re-run by bumping `count` when the card list changes.
 */
export function useWheelEffect(ref: RefObject<HTMLElement | null>, count: number) {
  useEffect(() => {
    const wheel = ref.current;
    if (!wheel) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Nearest scrollable ancestor; fall back to the window.
    let scroller: HTMLElement | null = wheel.parentElement;
    while (scroller) {
      const oy = getComputedStyle(scroller).overflowY;
      if (oy === 'auto' || oy === 'scroll') break;
      scroller = scroller.parentElement;
    }
    const target: HTMLElement | Window = scroller ?? window;

    let raf = 0;
    const render = () => {
      raf = 0;
      const view = scroller
        ? { top: scroller.getBoundingClientRect().top, height: scroller.clientHeight }
        : { top: 0, height: window.innerHeight };
      const mid = view.top + view.height / 2;

      const cards = wheel.children;
      for (let i = 0; i < cards.length; i++) {
        const el = cards[i] as HTMLElement;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const range = view.height / 2 + r.height / 2;
        // p: -1 (above centre) .. 0 (centred) .. 1 (below centre)
        const p = Math.max(-1, Math.min(1, (center - mid) / range));
        const abs = Math.abs(p);
        const tilt = (i % 2 === 0 ? 3.5 : -3.5) * p;
        el.style.transform = `rotateX(${36 * p}deg) rotateZ(${tilt}deg) scale(${1 - 0.18 * abs})`;
        el.style.opacity = `${1 - 0.7 * abs}`;
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };

    render(); // initial pass
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, count]);
}
