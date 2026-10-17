import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "../motion/MotionProvider";
import CanvasRoot from "../gl/CanvasRoot";

const satoshi = localFont({
  src: [
    { path: "../../public/fonts/satoshi/Satoshi-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/satoshi/Satoshi-Medium.woff2",  weight: "500", style: "normal" },
    { path: "../../public/fonts/satoshi/Satoshi-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

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
    <html lang="en" className={`h-full ${satoshi.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-full bg-surface text-ink font-sans">
        <MotionProvider>
          <CanvasRoot />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
