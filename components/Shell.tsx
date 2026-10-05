import type { ReactNode } from "react";
import { AppLink } from "./AppLink";
import { ModeBadge } from "./ModeBadge";
import { Wordmark } from "./Logo";

export function Shell({ children, current }: { children: ReactNode; current?: "home" | "new" }) {
  return (
    <div className="shell">
      <a href="#main" className="skip-link">İçeriğe geç</a>
      <header className="topbar">
        <div className="topbar__inner">
          <AppLink to="/">
            <Wordmark />
          </AppLink>
          <nav className="nav" aria-label="Ana menü">
            <AppLink to="/" ariaCurrent={current === "home" ? "page" : undefined}>
              <span>Dashboard</span>
            </AppLink>
            <AppLink to="/new" ariaCurrent={current === "new" ? "page" : undefined}>
              + <span className="hide-sm">Yeni 5SE Analizi</span>
            </AppLink>
          </nav>
          <ModeBadge />
        </div>
      </header>
      <main id="main" className="page">
        {children}
      </main>
      <footer className="footer">
        <span>5SE™ Packaging Intelligence · 5 Shelf Effect metodolojisi © Tasarist</span>
        <span>Bu MVP raf performansını ölçer; estetik değerlendirme yapmaz.</span>
      </footer>
    </div>
  );
}
