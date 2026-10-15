"use client";

import { motion } from "motion/react";

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
export function SharedElement({ id, style, children }: Props) {
  return (
    <motion.div layoutId={id} style={style}>
      {children}
    </motion.div>
  );
}
