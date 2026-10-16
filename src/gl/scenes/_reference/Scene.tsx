"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import { View } from "@react-three/drei";
import { clock } from "../../../motion/clock";
import { canvasSignals } from "../../signals";
import { sceneRegistry } from "../../registry";
import { useTier } from "../../../motion/tier";
import vertSrc from "./ref.vert";
import fragSrc from "./ref.frag";
import { makeUniforms } from "./uniforms";

type Props = {
  id: string;
  progress?: number;
  style?: React.CSSProperties;
  className?: string;
};

function ReferenceQuad({ progress }: { progress?: number }) {
  const tier = useTier();
  const matRef = useRef<ShaderMaterial>(null);
  const { viewport, size } = useThree();

  useFrame(() => {
    if (!matRef.current) return;
    const u = matRef.current.uniforms as ReturnType<typeof makeUniforms>;
    if (tier === "full") u.uTime.value = clock.now();
    u.uProgress.value = progress !== undefined ? progress : canvasSignals.getProgress();
    u.uTransition.value = canvasSignals.getTransition();
    u.uResolution.value = [size.width, size.height];
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry />
      <shaderMaterial
        ref={matRef}
        vertexShader={vertSrc}
        fragmentShader={fragSrc}
        uniforms={makeUniforms()}
      />
    </mesh>
  );
}

export function ReferenceScene({ id, progress, style, className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return sceneRegistry.register(id, () => {});
  }, [id]);

  return (
    <div
      data-scene={id}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      <div ref={trackRef} style={{ position: "absolute", inset: 0 }} />
      {/* Cast: HTMLDivElement extends HTMLElement; drei typed track non-nullable pre-React-19 */}
      <View track={trackRef as unknown as React.RefObject<HTMLElement>} style={{ position: "absolute", inset: 0 }}>
        <ReferenceQuad progress={progress} />
      </View>
    </div>
  );
}
