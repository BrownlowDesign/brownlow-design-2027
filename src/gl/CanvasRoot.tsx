"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { View } from "@react-three/drei";
import type { ShaderMaterial } from "three";
import { clock } from "../motion/clock";
import { useTier } from "../motion/tier";
import { canvasSignals } from "./signals";

// Background layer: time-driven gradient visible across all routes.
// Inline GLSL — template literals can't use #include; see docs/WEBGL.md.
const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uProgress;
uniform float uTransition;
varying vec2 vUv;
// Token values inlined — inline GLSL cannot use #include.
const vec3 COL_SURFACE = vec3(0.9569, 0.9529, 0.9412);
const vec3 COL_ACCENT  = vec3(1.0,    0.3529, 0.1216);
void main() {
  float v = 0.5 + 0.5 * sin(uTime * 0.8);
  vec3 col = mix(COL_SURFACE, COL_ACCENT, v * 0.15 + uProgress * 0.25 + uTransition * 0.35);
  gl_FragColor = vec4(col, 1.0);
}
`;

function BackgroundQuad() {
  const tier = useTier();
  const matRef = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame(() => {
    if (!matRef.current || tier !== "full") return;
    const u = matRef.current.uniforms as {
      uTime: { value: number };
      uProgress: { value: number };
      uTransition: { value: number };
    };
    u.uTime.value = clock.now();
    u.uProgress.value = canvasSignals.getProgress();
    u.uTransition.value = canvasSignals.getTransition();
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{ uTime: { value: 0 }, uProgress: { value: 0 }, uTransition: { value: 0 } }}
      />
    </mesh>
  );
}

function CanvasInternals() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const u1 = clock.subscribe(() => invalidate());
    const u2 = canvasSignals.onProgress(() => invalidate());
    const u3 = canvasSignals.onTransition(() => invalidate());
    return () => { u1(); u2(); u3(); };
  }, [invalidate]);
  return null;
}

export default function CanvasRoot() {
  const tier = useTier();
  if (tier === "static") return null;

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1] }}
      frameloop="demand"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <CanvasInternals />
      <BackgroundQuad />
      <View.Port />
    </Canvas>
  );
}
