import { PerfOverlay } from "./PerfOverlay";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PerfOverlay />
    </>
  );
}
