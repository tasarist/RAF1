"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { STATIC_PREVIEW, href } from "@/lib/client/env";

interface Props {
  to: string;
  query?: Record<string, string | undefined>;
  className?: string;
  children: ReactNode;
  ariaCurrent?: "page";
}

/** Client-side routing on Vercel; plain anchors in the static preview bundle. */
export function AppLink({ to, query, className, children, ariaCurrent }: Props) {
  const url = href(to, query);
  if (STATIC_PREVIEW) {
    return (
      <a href={url} className={className} aria-current={ariaCurrent}>
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}

export function navigate(to: string, query?: Record<string, string | undefined>) {
  window.location.assign(href(to, query));
}
