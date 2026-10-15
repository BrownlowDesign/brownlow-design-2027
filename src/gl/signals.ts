"use client";

// Module-level signals for canvas uniforms.
// App-layer pages call setProgress() / setTransition() to drive uniforms on the quad.
// CanvasRoot reads these values each frame — no React prop-drilling needed.

let _progress = 0;
const _progressListeners = new Set<(v: number) => void>();

let _transition = 0;
const _transitionListeners = new Set<(v: number) => void>();

export const canvasSignals = {
  setProgress(v: number) {
    _progress = v;
    _progressListeners.forEach((fn) => fn(v));
  },
  getProgress(): number {
    return _progress;
  },
  onProgress(fn: (v: number) => void): () => void {
    _progressListeners.add(fn);
    return () => _progressListeners.delete(fn);
  },

  setTransition(v: number) {
    _transition = v;
    _transitionListeners.forEach((fn) => fn(v));
  },
  getTransition(): number {
    return _transition;
  },
  onTransition(fn: (v: number) => void): () => void {
    _transitionListeners.add(fn);
    return () => _transitionListeners.delete(fn);
  },
};
