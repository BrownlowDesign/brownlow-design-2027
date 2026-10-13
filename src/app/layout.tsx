import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "brownlow.design",
  description: "Ryan Brownlow — design portfolio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-surface text-ink font-sans">{children}</body>
    </html>
  );
}
