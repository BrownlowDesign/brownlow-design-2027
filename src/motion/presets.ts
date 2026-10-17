import {
  MotionDurationInstant,
  MotionDurationUiFast,
  MotionDurationUi,
  MotionDurationReveal,
  MotionDurationRevealSlow,
  MotionDurationPage,
  MotionStaggerLine,
  MotionStaggerItem,
  MotionEasingStandard,
  MotionEasingEnter,
  MotionEasingExit,
  MotionEasingUi,
} from "../tokens/generated/tokens.js";

function ms(token: string): number {
  return parseInt(token, 10);
}

export type EasingTuple = [number, number, number, number];

export const presets = {
  duration: {
    instant:      ms(MotionDurationInstant),
    fast:         ms(MotionDurationUiFast),
    base:         ms(MotionDurationUi),
    reveal:       ms(MotionDurationReveal),
    revealSlow:   ms(MotionDurationRevealSlow),
    page:         ms(MotionDurationPage),
    staggerLine:  ms(MotionStaggerLine),
    staggerItem:  ms(MotionStaggerItem),
  },
  easing: {
    standard: MotionEasingStandard as EasingTuple,
    enter:    MotionEasingEnter as EasingTuple,
    exit:     MotionEasingExit as EasingTuple,
    ui:       MotionEasingUi as EasingTuple,
  },
} as const;
