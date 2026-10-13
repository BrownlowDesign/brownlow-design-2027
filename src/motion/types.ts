export type Tier = "full" | "reduced" | "static";

export type HarnessState = {
  ready: boolean;
  tier: Tier;
  t: number;
  progress: number;
  scenes: string[];
  scrollTo: (progress: number) => void;
  setTime: (t: number) => void;
};

declare global {
  interface Window {
    __HARNESS__?: HarnessState;
  }
}
