import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5SE™ Packaging Intelligence",
  description: "Ambalajınızı rafta ölç, teşhis et, rakiplerle karşılaştır, iyileştir ve yeniden test et. Tasarist 5 Shelf Effect metodolojisi.",
  applicationName: "5SE Packaging Intelligence",
};

export const viewport: Viewport = { themeColor: "#0413EC", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='30' fill='%230413EC'/%3E%3Cpath d='M17 22h30L32 47z' fill='white'/%3E%3C/svg%3E" />
      </head>
      <body>{children}</body>
    </html>
  );
}
