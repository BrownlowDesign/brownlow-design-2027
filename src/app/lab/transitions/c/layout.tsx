"use client";

import { GsapOverlay } from "../../../../motion/transitions/GsapOverlay";

export default function VariantCLayout({ children }: { children: React.ReactNode }) {
  return <GsapOverlay>{children}</GsapOverlay>;
}
