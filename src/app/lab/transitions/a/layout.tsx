// Variant A: View Transitions API
// Wrapping children in <ViewTransition> makes App Router navigations within
// this layout participate in the browser's View Transitions API automatically.
// Shared-element morph is handled by matching viewTransitionName CSS props on
// the card image (IndexGrid) and the hero (CaseStudy).

import { ViewTransition } from "react";

export default function VariantALayout({ children }: { children: React.ReactNode }) {
  return <ViewTransition>{children}</ViewTransition>;
}
