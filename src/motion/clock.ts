export type ClockSubscriber = (t: number, dt: number) => void;

let _now = 0;
let _delta = 0;
let _start: number | null = null;
let _rafId: number | null = null;
let _frozen = false;

const _subs = new Set<ClockSubscriber>();

function _step(wallMs: number) {
  if (_start === null) _start = wallMs;
  const t = (wallMs - _start) / 1000;
  _delta = t - _now;
  _now = t;
  _subs.forEach((fn) => fn(_now, _delta));
  if (_subs.size > 0 && !_frozen) {
    _rafId = requestAnimationFrame(_step);
  } else {
    _rafId = null;
  }
}

function _ensureRunning() {
  if (typeof requestAnimationFrame === "undefined") return;
  if (!_frozen && _subs.size > 0 && _rafId === null) {
    _rafId = requestAnimationFrame(_step);
  }
}

export const clock = {
  now: () => _now,

  subscribe(fn: ClockSubscriber): () => void {
    _subs.add(fn);
    _ensureRunning();
    return () => {
      _subs.delete(fn);
    };
  },

  /** Harness only: freeze the clock (stops rAF). */
  freeze() {
    _frozen = true;
    if (_rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  },

  /** Harness only: move to time t without notifying subscribers. */
  set(t: number) {
    _now = t;
    _delta = 0;
  },

  /** Harness only: set time and notify all subscribers (triggers one render pass). */
  tick(t: number) {
    _delta = t - _now;
    _now = t;
    _subs.forEach((fn) => fn(_now, _delta));
  },
};
