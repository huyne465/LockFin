'use client';

import { useEffect, type RefObject } from 'react';

/** Nửa độ rộng dải giữa khung nhìn (theo |p| ∈ [0,1]) mà thẻ giữ thẳng hoàn toàn. */
const DEAD_ZONE = 0.32;

/**
 * Scroll-driven "polaroid wheel": the card nearest the scroller's vertical centre
 * stands upright and opaque; cards above/below tilt back, shrink and fade.
 *
 * Implemented in JS (rAF-throttled) rather than CSS `animation-timeline: view()`
 * because that isn't supported on iOS WebKit — which is exactly where the app runs
 * as a PWA, so the CSS version silently fell back to flat. This drives the same
 * transform on every browser. Honours `prefers-reduced-motion`.
 *
 * Card geometry is measured once (untransformed) and cached; each scroll frame
 * only reads `scrollTop` and writes transforms. Measuring per-frame with
 * `getBoundingClientRect()` is a trap here: the rect includes the transform we
 * applied last frame, so a tilting/shrinking card feeds back into its own `p`
 * and jitters around the dead-zone edge — and interleaving those reads with
 * style writes forces a style recalc per card per frame.
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

    const scrollPos = () => (scroller ? scroller.scrollTop : window.scrollY);

    // Untransformed card geometry in scroller-content coordinates.
    let tops: number[] = [];
    let heights: number[] = [];
    let lastZ: number[] = [];
    let viewH = 0;

    const measure = () => {
      const cards = wheel.children;
      // Clear our transforms first so the rects reflect the real layout.
      for (let i = 0; i < cards.length; i++) (cards[i] as HTMLElement).style.transform = '';
      const baseTop = scroller ? scroller.getBoundingClientRect().top : 0;
      const scroll = scrollPos();
      viewH = scroller ? scroller.clientHeight : window.innerHeight;
      tops = [];
      heights = [];
      lastZ = [];
      for (let i = 0; i < cards.length; i++) {
        const r = (cards[i] as HTMLElement).getBoundingClientRect();
        tops.push(r.top - baseTop + scroll);
        heights.push(r.height);
        lastZ.push(-1);
      }
    };

    let raf = 0;
    const render = () => {
      raf = 0;
      const mid = scrollPos() + viewH / 2;

      // The tilt foreshortens each card, but perspective also pushes its leading
      // (top) edge toward the viewer — on tall cards that edge can creep over the
      // neighbour above and cover its reaction row. Ease the angle off on short
      // viewports (small phones), where a card fills most of the screen and the
      // encroachment is largest.
      const maxTilt = viewH < 720 ? 22 : 32;

      const cards = wheel.children;
      const n = Math.min(cards.length, tops.length);
      for (let i = 0; i < n; i++) {
        const el = cards[i] as HTMLElement;
        const center = tops[i] + heights[i] / 2;
        const range = viewH / 2 + heights[i] / 2;
        // p: -1 (above centre) .. 0 (centred) .. 1 (below centre)
        const p = Math.max(-1, Math.min(1, (center - mid) / range));
        // Dead-zone: cards within a central band stay fully upright (mirrors the
        // 42–58% flat plateau of the original keyframe). Without it every card but
        // the exact-centre one tilts, so a screen full of cards looks stretched.
        const abs = Math.abs(p);
        const ramp = abs <= DEAD_ZONE ? 0 : (abs - DEAD_ZONE) / (1 - DEAD_ZONE);
        // Smoothstep so the tilt eases in from the dead-zone edge instead of
        // kicking in with a visible jolt.
        const t = ramp * ramp * (3 - 2 * ramp);
        const signed = Math.sign(p) * t;
        const tilt = (i % 2 === 0 ? 3.5 : -3.5) * signed;
        el.style.transform = `rotateX(${maxTilt * signed}deg) rotateZ(${tilt}deg) scale(${1 - 0.18 * t})`;
        el.style.opacity = `${1 - 0.7 * t}`;
        // The upright, most-centred card must stack above its tilted neighbours so
        // a card creeping up from below never paints over (and blocks taps on) its
        // reaction row. Closer to centre (smaller abs) = higher in the stack.
        // Only touch z-index when it actually changes — rewriting it every frame
        // makes the browser re-sort stacking contexts mid-scroll.
        const z = 100 - Math.round(abs * 100);
        if (z !== lastZ[i]) {
          lastZ[i] = z;
          el.style.zIndex = `${z}`;
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    render(); // initial pass
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [ref, count]);
}
