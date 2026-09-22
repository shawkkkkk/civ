import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CIV — Build Your Army. Build the World.",
  description: "A real-time strategy game powered by StonkFun rewards. Play free, hold CIV, earn GOLD, and use GOLD across the CIV world.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
