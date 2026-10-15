"use client";

import Link from "next/link";
import type { Project } from "../_data/projects";

type Props = {
  variant: "a" | "b" | "c";
  projects: Project[];
  // Variant A wraps each link in <ViewTransition> — passes element wrapper fn
  CardWrapper?: React.ComponentType<{ slug: string; children: React.ReactNode }>;
};

function PlaceholderImage({ hue, slug }: { hue: number; slug: string }) {
  return (
    <div
      data-transition-hero={slug}
      style={{
        width: "100%",
        aspectRatio: "4/3",
        background: `hsl(${hue} 60% 55%)`,
        borderRadius: "var(--radius-md)",
        flexShrink: 0,
      }}
    />
  );
}

function DefaultWrapper({ children }: { slug: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export function IndexGrid({ variant, projects, CardWrapper = DefaultWrapper }: Props) {
  const VARIANT_LABEL: Record<"a" | "b" | "c", string> = {
    a: "View Transitions API",
    b: "Motion AnimatePresence",
    c: "GSAP Overlay / FLIP",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "var(--space-12) var(--space-8)" }}>
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

      <h1
        style={{
          fontFamily: "var(--font-family-sans)",
          fontSize: "var(--font-size-4xl)",
          fontWeight: "var(--font-weight-bold)",
          marginBottom: "var(--space-12)",
          paddingTop: "var(--space-8)",
        }}
      >
        Projects
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "var(--space-8)",
        }}
      >
        {projects.map((project) => (
          <CardWrapper key={project.slug} slug={project.slug}>
            <Link
              href={`/lab/transitions/${variant}/${project.slug}`}
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
            >
              <article>
                <PlaceholderImage hue={project.hue} slug={project.slug} />
                <div style={{ paddingTop: "var(--space-4)" }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-family-sans)",
                      fontSize: "var(--font-size-xl)",
                      fontWeight: "var(--font-weight-bold)",
                      marginBottom: "var(--space-1)",
                    }}
                  >
                    {project.title}
                  </h2>
                  <p
                    style={{
                      fontFamily: "var(--font-family-mono)",
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {project.category} · {project.year}
                  </p>
                </div>
              </article>
            </Link>
          </CardWrapper>
        ))}
      </div>
    </div>
  );
}
