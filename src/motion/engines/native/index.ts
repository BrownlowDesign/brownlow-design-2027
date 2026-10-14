"use client";

// Variant B — Native scroll engine.
// Uses a single scroll event listener to write progress values as CSS custom
// properties on the scene root element. Animations are applied by the page layer
// (CSS-only on the layout element, or via tiny inline style updates here).
// IntersectionObserver drives the non-scrubbed text reveal.
//
// Scene layout (total 900vh):
//   pin-outer:       0–300vh   → --pin-p    0→1
//   parallax-outer:  300–500vh → --par-p    0→1
//   strip-outer:     500–800vh → --strip-p  0→1
//   text-reveal:     800–900vh → enter once

export type NativeScrollState = {
  pinP: number;
  parP: number;
  stripP: number;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

// Compute per-section progress values from raw page scroll progress (0–1).
// Heights (vh fractions of 900): pin=300/900, par=200/900, strip=300/900
export function progressFromPage(pageP: number): NativeScrollState {
  const pinEnd = 300 / 900;
  const parEnd = 500 / 900;
  const stripEnd = 800 / 900;

  const pinP = clamp(pageP / pinEnd, 0, 1);
  const parP = clamp((pageP - pinEnd) / (parEnd - pinEnd), 0, 1);
  const stripP = clamp((pageP - parEnd) / (stripEnd - parEnd), 0, 1);

  return { pinP, parP, stripP };
}

// Apply scroll state to DOM — sets CSS custom properties + directly drives
// the strip-track translateX and parallax layer translateY values.
// onPinProgress: page layer wires this to canvasSignals.setProgress (gl layer
// can't be imported here — motion→gl is a layer violation).
export function applyScrollState(
  root: HTMLElement,
  state: NativeScrollState,
  onPinProgress?: (p: number) => void,
): void {
  const { pinP, parP, stripP } = state;
  onPinProgress?.(pinP);

  root.style.setProperty("--pin-p", String(pinP));
  root.style.setProperty("--par-p", String(parP));
  root.style.setProperty("--strip-p", String(stripP));

  // Headline lines: each line enters on its third of the pin sequence
  root.querySelectorAll<HTMLElement>("[data-scene='headline-line']").forEach((el) => {
    const line = Number(el.dataset.line ?? 0);
    const start = line / 3;
    const p = clamp((pinP - start) / (1 / 3), 0, 1);
    el.style.opacity = String(p);
    el.style.transform = `translateY(calc(var(--space-6) * ${1 - p}))`;
  });

  // Hero image: stage 2 (pin 0.33–0.66) — scale from card to full-bleed
  const heroP = clamp((pinP - 1 / 3) / (1 / 3), 0, 1);
  const heroEl = root.querySelector<HTMLElement>("[data-scene='hero-image']");
  if (heroEl) {
    heroEl.style.opacity = String(heroP);
    const w = lerp(38, 100, heroP);
    const h = lerp(42, 100, heroP);
    const r = lerp(12, 0, heroP);
    heroEl.style.width = `${w}%`;
    heroEl.style.height = `${h}%`;
    heroEl.style.borderRadius = `${r}px`;
  }

  // Caption: stage 3 (pin 0.66–1.0)
  const captionP = clamp((pinP - 2 / 3) / (1 / 3), 0, 1);
  const captionEl = root.querySelector<HTMLElement>("[data-scene='caption']");
  if (captionEl) captionEl.style.opacity = String(captionP);

  // Progress bar width
  const barEl = root.querySelector<HTMLElement>("[data-scene='progress-bar']");
  if (barEl) barEl.style.width = `${pinP * 100}%`;

  // Parallax layers: translate each layer at its data-rate
  root.querySelectorAll<HTMLElement>("[data-scene='parallax-layer']").forEach((el) => {
    const rate = Number(el.dataset.rate ?? 0.5);
    const travel = (1 - rate) * 20; // max translateY% offset
    el.style.transform = `translateY(${-parP * travel}%)`;
  });

  // Horizontal strip: translate the track
  const trackEl = root.querySelector<HTMLElement>("[data-scene='strip-track']");
  if (trackEl) {
    trackEl.style.transform = `translateX(-${stripP * 400}vw)`;
  }
}

// Returns an unsubscribe function. Call from useEffect.
// onPinProgress: page layer passes canvasSignals.setProgress here.
export function initNativeScroll(
  root: HTMLElement,
  onPinProgress?: (p: number) => void,
): () => void {
  const totalH = () => document.documentElement.scrollHeight - window.innerHeight;

  function onScroll() {
    const pageP = totalH() > 0 ? window.scrollY / totalH() : 0;
    const state = progressFromPage(pageP);
    applyScrollState(root, state, onPinProgress);
  }

  // Initial paint
  onScroll();

  window.addEventListener("scroll", onScroll, { passive: true });

  // Text reveal via IntersectionObserver (not scrubbed)
  const revealEl = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
  let io: IntersectionObserver | null = null;
  if (revealEl) {
    io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          revealEl.style.transition = [
            `opacity var(--motion-duration-base) var(--motion-easing-enter)`,
            `transform var(--motion-duration-base) var(--motion-easing-enter)`,
          ].join(", ");
          revealEl.style.opacity = "1";
          revealEl.style.transform = "translateY(0)";
          io?.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(revealEl);
  }

  return () => {
    window.removeEventListener("scroll", onScroll);
    io?.disconnect();
  };
}

// Harness helper: jump to a specific page progress and apply state instantly.
// Called by the lab page inside initHarness's post-scroll settle.
export function jumpToProgress(
  root: HTMLElement,
  pageP: number,
  onPinProgress?: (p: number) => void,
): void {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, pageP * totalH);
  applyScrollState(root, progressFromPage(pageP), onPinProgress);
  // Force text-reveal to final state if it would be visible at this progress
  if (pageP >= 800 / 900) {
    const el = root.querySelector<HTMLElement>("[data-scene='text-reveal']");
    if (el) {
      el.style.transition = "none";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }
  }
}
