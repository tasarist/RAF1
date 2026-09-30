"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  ["Ürün", "/product"],
  ["Nasıl Çalışır", "/how-it-works"],
  ["Metodoloji", "/methodology"],
  ["Çözümler", "/solutions"],
  ["İçgörüler", "/insights"],
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="pa-header">
      <div className="container pa-header-inner">
        <Link href="/" className="pa-logo" aria-label="Pack Analytic ana sayfa">
          <span className="pa-logo-mark" aria-hidden="true"><i>P</i><i>A</i></span>
          <span>Pack Analytic</span>
        </Link>

        <nav className="pa-nav" aria-label="Ana menü">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href ? "active" : ""}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="pa-header-actions">
          <Link href="/analyze" className="pa-button pa-button-small">Ambalajını Analiz Et</Link>
          <button
            className="pa-menu-button"
            type="button"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span /><span />
          </button>
        </div>
      </div>

      {open ? (
        <div className="pa-mobile-menu">
          <div className="container">
            <nav aria-label="Mobil menü">
              {nav.map(([label, href]) => (
                <Link key={href} href={href} className={pathname === href ? "active" : ""}>{label}</Link>
              ))}
            </nav>
            <Link href="/analyze" className="pa-mobile-cta">Ambalajını Analiz Et <span>↗</span></Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
