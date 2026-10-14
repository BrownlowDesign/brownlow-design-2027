"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import { clock } from "../motion/clock";
import { useTier } from "../motion/tier";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

// Token values inlined — inline GLSL cannot include generated tokens.glsl
const vec3 COL_SURFACE = vec3(0.9569, 0.9529, 0.9412); // color.surface.default
const vec3 COL_ACCENT  = vec3(1.0,    0.3529, 0.1216); // color.accent.default

void main() {
  float v = 0.5 + 0.5 * sin(uTime * 0.8);
  vec3 col = mix(COL_SURFACE, COL_ACCENT, v * 0.15);
  gl_FragColor = vec4(col, 1.0);
}
`;

function ClockDriver() {
  const { invalidate } = useThree();
  useEffect(() => {
    return clock.subscribe(() => {
      invalidate();
    });
  }, [invalidate]);
  return null;
}

function PlaceholderQuad() {
  const tier = useTier();
  const matRef = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  useFrame(() => {
    // reduced tier: shaders render static frames per MOTION.md
    if (matRef.current && tier === "full") {
      (matRef.current.uniforms as { uTime: { value: number } }).uTime.value =
        clock.now();
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={{ uTime: { value: 0 } }}
      />
    </mesh>
  );
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
      <ClockDriver />
      <PlaceholderQuad />
    </Canvas>
  );
}
