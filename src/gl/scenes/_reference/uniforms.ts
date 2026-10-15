import type { IUniform } from "three";

export type ReferenceUniforms = {
  uTime: IUniform<number>;
  uProgress: IUniform<number>;
  uTransition: IUniform<number>;
  uResolution: IUniform<[number, number]>;
};

export function makeUniforms(): ReferenceUniforms {
  return {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uTransition: { value: 0 },
    uResolution: { value: [1, 1] },
  };
}
