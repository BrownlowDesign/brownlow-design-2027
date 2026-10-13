export type ClockSubscriber = (t: number) => void;

let _now = 0;
const _subs = new Set<ClockSubscriber>();

export const clock = {
  now: () => _now,
  set: (t: number) => { _now = t; },
  subscribe: (fn: ClockSubscriber) => { _subs.add(fn); return () => _subs.delete(fn); },
  tick: (t: number) => { _now = t; _subs.forEach((fn) => fn(t)); },
};
