"use client";

import { ViewTransition } from "react";
import { IndexGrid } from "../_scene/IndexGrid";
import { PROJECTS } from "../_data/projects";

// Each card link is wrapped in <ViewTransition> so the navigation to the case
// study is a view transition. The card image has a viewTransitionName matching
// the case-study hero, enabling shared-element morph.
function CardWrapper({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={`hero-${slug}`}>
      <div style={{ viewTransitionName: `card-${slug}` }}>
        {children}
      </div>
    </ViewTransition>
  );
}

export default function VariantAIndex() {
  return <IndexGrid variant="a" projects={PROJECTS} CardWrapper={CardWrapper} />;
}
