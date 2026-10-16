#include "tokens.glsl"

uniform float uTime;
uniform float uProgress;
uniform float uTransition;
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  // Scroll progress: vertical gradient from surface to ink
  vec3 base = mix(COLOR_SURFACE_DEFAULT, COLOR_INK_700, vUv.y * uProgress * 0.8);

  // Gentle wave driven by time (full tier only — reduced/static pass uTime=0)
  float wave = sin(vUv.x * 6.28 + uTime * 0.6) * 0.04;
  base += vec3(wave) * (1.0 - uProgress);

  // Transition: accent pulse across the face (uTransition 0→1)
  float pulse = sin(uTransition * 3.14159);
  base = mix(base, COLOR_SIGNAL_500, pulse * 0.35);

  gl_FragColor = vec4(base, 1.0);
}
