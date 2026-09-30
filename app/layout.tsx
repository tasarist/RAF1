import type { Metadata } from "next";
import "./globals.css";
import "./feng-gui.css";

export const metadata: Metadata = {
  title: "Pack Analytic — Packaging Performance Intelligence",
  description: "Test packaging against competitors, diagnose shelf performance and optimize before launch.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
