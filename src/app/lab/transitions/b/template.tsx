"use client";

import { usePathname } from "next/navigation";
import { MotionPageTransition } from "../../../../motion/transitions/MotionPageTransition";

export default function VariantBTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <MotionPageTransition routeKey={pathname}>{children}</MotionPageTransition>;
}
