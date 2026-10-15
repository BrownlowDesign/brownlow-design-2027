"use client";

import { useRef } from "react";
import Link from "next/link";
import { SharedElement } from "../../../../motion/transitions/SharedElement";
import { useScrollScene } from "../../../../motion/useScrollScene";
import { canvasSignals } from "../../../../gl/signals";
import type { Project } from "../_data/projects";

type Props = {
  variant: "a" | "b" | "c";
  project: Project;
};

// Case-study page layout: hero image (morphs from card) + long scroll scene.
// The scroll section reuses the same applyScrollState mechanics as lab 002.
// Total height: ~400vh (hero 100vh + scroll scene 300vh).
export function CaseStudy({ variant, project }: Props) {
  const scrollRootRef = useRef<HTMLDivElement>(null);

  useScrollScene(scrollRootRef, {
    id: `case-study-${project.slug}`,
    onPinProgress: canvasSignals.setProgress,
  });

  const VARIANT_LABEL: Record<"a" | "b" | "c", string> = {
    a: "View Transitions API",
    b: "Motion AnimatePresence",
    c: "GSAP Overlay / FLIP",
  };

  return (
    <div style={{ background: "var(--color-surface-default)" }}>
      {/* Variant badge */}
      <div
        style={{
          position: "fixed",
          top: "var(--space-4)",
          right: "var(--space-4)",
          zIndex: 100,
          padding: "var(--space-1) var(--space-4)",
          background: "var(--color-accent-default)",
          color: "var(--color-text-inverse)",
          fontFamily: "var(--font-family-mono)",
          fontSize: "var(--font-size-sm)",
          borderRadius: "var(--radius-sm)",
        }}
      >
        {variant.toUpperCase()} · {VARIANT_LABEL[variant]}
      </div>

      {/* Back link */}
      <div
        style={{
          position: "fixed",
          top: "var(--space-4)",
          left: "var(--space-4)",
          zIndex: 100,
        }}
      >
        <Link
          href={`/lab/transitions/${variant}`}
          style={{
            fontFamily: "var(--font-family-mono)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          ← Back
        </Link>
      </div>

      {/* Hero — for variant B, uses SharedElement so Motion can morph it from
          the card thumbnail (same layoutId) during the page transition. */}
      <section
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "var(--space-12)",
          position: "relative",
        }}
      >
        {variant === "b" ? (
          <SharedElement
            id={`hero-${project.slug}`}
            style={{
              position: "absolute",
              inset: 0,
              background: `hsl(${project.hue} 60% 55%)`,
            }}
          />
        ) : (
          <div
            data-transition-hero={project.slug}
            style={{
              position: "absolute",
              inset: 0,
              background: `hsl(${project.hue} 60% 55%)`,
            }}
          />
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-family-mono)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-inverse)",
              opacity: 0.7,
              marginBottom: "var(--space-2)",
            }}
          >
            {project.category} · {project.year}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-family-sans)",
              fontSize: "var(--font-size-6xl)",
              fontWeight: "var(--font-weight-bold)",
              color: "var(--color-text-inverse)",
              lineHeight: 1,
            }}
          >
            {project.title}
          </h1>
        </div>
      </section>

      {/* Scroll scene (300vh) — uses the same applyScrollState mechanics as
          lab 002. useScrollScene() initializes initLenisGsap on this subtree. */}
      <div ref={scrollRootRef} data-scene="root">
        {/* Section 1: Pinned 3-stage (200vh) */}
        <section data-scene="pin-outer" style={{ height: "200vh" }}>
          <div
            data-scene="pin-inner"
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Progress bar */}
            <div
              data-scene="progress-bar"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "var(--space-1)",
                width: "0%",
                background: `hsl(${project.hue} 60% 55%)`,
                transition: "none",
              }}
            />

            {/* Stage 1: headlines */}
            <div
              data-scene="headline"
              style={{
                textAlign: "center",
                fontFamily: "var(--font-family-sans)",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "var(--font-size-5xl)",
                lineHeight: 1.1,
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-2)",
              }}
            >
              {[project.title, "Case Study", String(project.year)].map((text, i) => (
                <span
                  key={i}
                  data-scene="headline-line"
                  data-line={i}
                  style={{ display: "block", opacity: 0, transform: "translateY(var(--space-6))" }}
                >
                  {text}
                </span>
              ))}
            </div>

            {/* Stage 2: hero image (shrinks from full-bleed to card size) */}
            <div
              data-scene="hero-image"
              style={{
                position: "absolute",
                width: "38%",
                height: "42%",
                borderRadius: "var(--radius-md)",
                background: `hsl(${project.hue} 60% 55%)`,
                opacity: 0,
              }}
            />

            {/* Stage 3: caption */}
            <p
              data-scene="caption"
              style={{
                position: "absolute",
                bottom: "var(--space-12)",
                fontFamily: "var(--font-family-mono)",
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-muted)",
                opacity: 0,
              }}
            >
              scroll-driven · {project.category.toLowerCase()}
            </p>
          </div>
        </section>

        {/* Section 2: Parallax stack (100vh) */}
        <section data-scene="parallax-outer" style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
          {[
            { rate: 0.2, label: "slow 0.2×" },
            { rate: 0.5, label: "mid 0.5×" },
            { rate: 1.0, label: "fast 1.0×" },
          ].map(({ rate, label }, i) => (
            <div
              key={i}
              data-scene="parallax-layer"
              data-rate={rate}
              style={{
                position: "absolute",
                left: `${i * 33}%`,
                width: "34%",
                top: 0,
                height: "120%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `color-mix(in srgb, hsl(${project.hue} 60% 55%) ${(i + 1) * 25}%, var(--color-surface-default))`,
                borderRight: i < 2 ? "1px solid var(--color-border-subtle)" : undefined,
              }}
            >
              <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)", writingMode: "vertical-rl" }}>
                {label}
              </span>
            </div>
          ))}
        </section>

        <section data-scene="strip-outer" style={{ height: "100vh" }}>
          <div data-scene="strip-inner" style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
            <div data-scene="strip-track" style={{ display: "flex", width: "500vw", height: "100%", willChange: "transform" }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  style={{
                    width: "100vw",
                    height: "100%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: n % 2 === 0
                      ? `color-mix(in srgb, hsl(${project.hue} 60% 55%) 12%, var(--color-surface-default))`
                      : "var(--color-surface-default)",
                    borderRight: n < 5 ? "1px solid var(--color-border-subtle)" : undefined,
                  }}
                >
                  <span style={{ fontSize: "var(--font-size-6xl)", fontWeight: "var(--font-weight-bold)", fontFamily: "var(--font-family-sans)", color: `hsl(${project.hue} 60% 55%)` }}>
                    {String(n).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Text reveal */}
        <section
          data-scene="text-reveal-outer"
          style={{
            height: "100vh",
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--space-4)",
          }}
        >
          <p
            data-scene="text-reveal"
            style={{
              opacity: 0,
              transform: "translateY(var(--space-6))",
              fontSize: "var(--font-size-2xl)",
              fontFamily: "var(--font-family-sans)",
              fontWeight: "var(--font-weight-medium)",
              textAlign: "center",
              maxWidth: "60ch",
              padding: "0 var(--space-8)",
              lineHeight: 1.4,
            }}
          >
            {project.title} — {project.category}
            <br />
            scroll-driven · Lenis + GSAP
          </p>
        </section>
      </div>
    </div>
  );
}
