"use client";

// Module-level signals for canvas uniforms.
// App-layer pages (lab routes) call setProgress() to drive uProgress on the quad.
// CanvasRoot reads these values each frame — no React prop-drilling needed.

let _progress = 0;
const _progressListeners = new Set<(v: number) => void>();

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
};
