import { notFound } from "next/navigation";

export default function LabLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_LAB !== "1") {
    notFound();
  }
  return <>{children}</>;
}
