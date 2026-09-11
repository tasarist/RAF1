import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5SE™ Packaging Intelligence",
  description: "Packaging analysis prototype based on the 5 Shelf Effect methodology.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
