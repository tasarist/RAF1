import type { Metadata } from "next";
import "./globals.css";
import "./feng-gui.css";

export const metadata: Metadata = {
  title: "Pack Analytic — Ambalaj Performans Zekâsı",
  description: "Ambalajınızı rakipleriyle test edin, raf performansını teşhis edin ve rafa çıkmadan önce optimize edin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
