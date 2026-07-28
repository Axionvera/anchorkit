import type { Metadata } from "next";
import "./globals.css";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "AnchorKit · Stellar Developer Toolkit",
  description:
    "Open-source Stellar developer toolkit for builders working with Stellar wallets, anchors, payment rails, SEP flows, and Soroban-based treasury logic.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
