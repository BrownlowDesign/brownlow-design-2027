"use client";

import { motion } from "motion/react";
import { presets } from "../presets";

type Props = {
  id: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

// Shared-element wrapper for cross-route layout animations.
// Give the same `id` to the source element (e.g. card thumbnail) and the
// destination element (e.g. case-study hero). Motion animates between their
// measured bounds when both are present in the tree during a transition.
// Only meaningful inside an <AnimatePresence> — otherwise renders a plain div.
//
// Layout transition: tween 200ms with exit easing [0.4,0,1,1] — aggressive
// ease-in so the card accelerates sharply toward its destination.
export function SharedElement({ id, style, children }: Props) {
  return (
    <motion.div
      layoutId={id}
      style={style}
      transition={{
        layout: { type: "tween", duration: presets.duration.fast / 1000, ease: presets.easing.exit },
      }}
    >
      {children}
    </motion.div>
  );
}
