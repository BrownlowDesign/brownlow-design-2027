import {
  MotionDurationFast,
  MotionDurationBase,
  MotionDurationSlow,
  MotionDurationPage,
  MotionDurationInstant,
  MotionStaggerLine,
  MotionStaggerItem,
  MotionEasingStandard,
  MotionEasingEnter,
  MotionEasingExit,
  MotionEasingWeighted,
} from "../tokens/generated/tokens.js";

function ms(token: string): number {
  return parseInt(token, 10);
}

export type EasingTuple = [number, number, number, number];

export const presets = {
  duration: {
    instant: ms(MotionDurationInstant),
    fast: ms(MotionDurationFast),
    base: ms(MotionDurationBase),
    slow: ms(MotionDurationSlow),
    page: ms(MotionDurationPage),
    staggerLine: ms(MotionStaggerLine),
    staggerItem: ms(MotionStaggerItem),
  },
  easing: {
    standard: MotionEasingStandard as EasingTuple,
    enter: MotionEasingEnter as EasingTuple,
    exit: MotionEasingExit as EasingTuple,
    weighted: MotionEasingWeighted as EasingTuple,
  },
} as const;
