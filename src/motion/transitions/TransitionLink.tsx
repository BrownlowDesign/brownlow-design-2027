"use client";

// <TransitionLink> is the public API for triggering a page transition.
// Variant C: delegates to window.__TRANSITION_NAVIGATE__ (GsapOverlay).
// Variants A & B: falls back to a plain Next.js <Link> (their transitions are
// handled at the layout/template level, not per-link).

import Link from "next/link";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link>;

export function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    const navigate = (
      window as Window & { __TRANSITION_NAVIGATE__?: (href: string) => void }
    ).__TRANSITION_NAVIGATE__;

    if (navigate) {
      e.preventDefault();
      navigate(String(href));
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
