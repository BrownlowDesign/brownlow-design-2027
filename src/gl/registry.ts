"use client";

type Cleanup = () => void;

const scenes = new Map<string, Cleanup>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export const sceneRegistry = {
  register(id: string, cleanup: Cleanup): () => void {
    scenes.set(id, cleanup);
    notify();
    return () => {
      const fn = scenes.get(id);
      if (fn) fn();
      scenes.delete(id);
      notify();
    };
  },

  ids(): string[] {
    return Array.from(scenes.keys());
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
