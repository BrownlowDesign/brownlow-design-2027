"use client";

// Shared scroll-lab scene markup.
// Renders the static HTML structure; each engine variant imports this and
// applies animations to elements via data-scene attributes or the forwarded ref.
//
// Page structure (total ≈ 900vh):
//   [0–300vh]   Section 1 — pinned 3-stage sequence (200vh scroll space)
//   [300–500vh] Section 2 — parallax stack, 3 layers
//   [500–800vh] Section 3 — horizontal scroll strip, 5 cards
//   [800–900vh] Section 4 — text reveal on enter

import { forwardRef } from "react";

export type SceneVariant = "a" | "b" | "c";

const VARIANT_LABEL: Record<SceneVariant, string> = {
  a: "Lenis + GSAP",
  b: "Native CSS",
  c: "motion.dev",
};

// CSS label style uses the lab token for the variant color
const variantColor: Record<SceneVariant, string> = {
  a: "var(--color-lab-a)",
  b: "var(--color-lab-b)",
  c: "var(--color-lab-c)",
};

interface Props {
  variant: SceneVariant;
  tier?: "full" | "reduced" | "static";
}

export const ScrollSceneLayout = forwardRef<HTMLDivElement, Props>(
  function ScrollSceneLayout({ variant, tier = "full" }, ref) {
    const vc = variantColor[variant];
    // In non-full tiers the engine never runs, so elements must start visible.
    const hidden = tier === "full";
    return (
      <div
        ref={ref}
        data-scene="root"
        style={{ background: "var(--color-surface-default)", color: "var(--color-text-default)" }}
      >
        {/* Fixed variant badge */}
        <div
          style={{
            position: "fixed",
            top: "var(--space-4)",
            right: "var(--space-4)",
            zIndex: 100,
            padding: "var(--space-1) var(--space-4)",
            background: vc,
            color: "var(--color-text-inverse)",
            fontFamily: "var(--font-family-mono)",
            fontSize: "var(--font-size-sm)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          {VARIANT_LABEL[variant]}
        </div>

        {/* ── Section 1: Pinned 3-stage (300vh) ──────────────────────────── */}
        <section
          data-scene="pin-outer"
          style={{ height: "300vh" }}
        >
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
            {/* Stage 1: headline — 3 lines animate in sequentially */}
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
              {["Build for", "the web.", "Every frame."].map((text, i) => (
                <span
                  key={i}
                  data-scene="headline-line"
                  data-line={i}
                  style={{
                    display: "block",
                    opacity: hidden ? 0 : 1,
                    transform: hidden ? "translateY(var(--space-6))" : "none",
                  }}
                >
                  {text}
                </span>
              ))}
            </div>

            {/* Stage 2: hero image card → full-bleed */}
            <div
              data-scene="hero-image"
              style={{
                position: "absolute",
                width: "38%",
                height: "42%",
                borderRadius: "var(--radius-md)",
                background: vc,
                opacity: hidden ? 0 : 1,
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
                opacity: hidden ? 0 : 1,
              }}
            >
              scroll-driven · {VARIANT_LABEL[variant].toLowerCase()}
            </p>

            {/* uProgress readout (visible evidence that the canvas signal fires) */}
            <div
              data-scene="progress-bar"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "var(--space-1)",
                width: "0%",
                background: vc,
                transition: "none",
              }}
            />
          </div>
        </section>

        {/* ── Section 2: Parallax stack (200vh) ──────────────────────────── */}
        <section
          data-scene="parallax-outer"
          style={{ height: "200vh", position: "relative", overflow: "hidden" }}
        >
          {[
            { rate: 0.2, label: "slow  0.2×" },
            { rate: 0.5, label: "mid   0.5×" },
            { rate: 1.0, label: "fast  1.0×" },
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
                background: `color-mix(in srgb, ${vc} ${(i + 1) * 25}%, var(--color-surface-default))`,
                borderRight: i < 2 ? "1px solid var(--color-border-subtle)" : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-family-mono)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                  writingMode: "vertical-rl",
                }}
              >
                {label}
              </span>
            </div>
          ))}
          <div
            style={{
              position: "sticky",
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center",
              fontFamily: "var(--font-family-sans)",
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-bold)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            Parallax
          </div>
        </section>

        {/* ── Section 3: Horizontal strip (300vh) ─────────────────────────── */}
        <section
          data-scene="strip-outer"
          style={{ height: "300vh" }}
        >
          <div
            data-scene="strip-inner"
            style={{
              position: "sticky",
              top: 0,
              height: "100vh",
              overflow: "hidden",
            }}
          >
            <div
              data-scene="strip-track"
              style={{
                display: "flex",
                width: "500vw",
                height: "100%",
                willChange: "transform",
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  data-scene="strip-card"
                  data-index={n - 1}
                  style={{
                    width: "100vw",
                    height: "100%",
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRight: n < 5 ? "1px solid var(--color-border-subtle)" : undefined,
                    background:
                      n % 2 === 0
                        ? `color-mix(in srgb, ${vc} 12%, var(--color-surface-default))`
                        : "var(--color-surface-default)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "var(--font-size-6xl)",
                      fontWeight: "var(--font-weight-bold)",
                      fontFamily: "var(--font-family-sans)",
                      color: vc,
                    }}
                  >
                    {n < 10 ? `0${n}` : n}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-family-mono)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-muted)",
                      marginTop: "var(--space-2)",
                    }}
                  >
                    card {n} of 5
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Text reveal on enter (100vh) ─────────────────────── */}
        <section
          data-scene="text-reveal-outer"
          style={{
            height: "100vh",
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
              opacity: hidden ? 0 : 1,
              transform: hidden ? "translateY(var(--space-6))" : "none",
              fontSize: "var(--font-size-2xl)",
              fontFamily: "var(--font-family-sans)",
              fontWeight: "var(--font-weight-medium)",
              textAlign: "center",
              maxWidth: "60ch",
              padding: "0 var(--space-8)",
              lineHeight: 1.4,
            }}
          >
            This text reveals on enter —
            <br />
            not scrubbed, using motion presets.
          </p>
          <p
            style={{
              fontFamily: "var(--font-family-mono)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-muted)",
            }}
          >
            IntersectionObserver trigger · duration-base · easing-enter
          </p>
        </section>
      </div>
    );
  }
);
