import Link from "next/link";
import type { ReactNode } from "react";
import { PROFILE } from "@/data/profile";
import { ConsoleBar } from "./Shell";
import { SessionMeter } from "./Widgets";

// Evaluated at build time: the footer shows when this copy was deployed.
const BUILT_AT = process.env.BUILD_TIME || new Date().toISOString();
const BUILD_SHA = process.env.BUILD_SHA || "";

/** Shared page chrome: header bar, landmark <main>, footer. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-x-clip">
      <div className="relative mx-auto max-w-[1160px] px-5 sm:px-8">
        <ConsoleBar />
        <main id="main" tabIndex={-1} className="outline-none">
          {children}
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}

function SiteFooter() {
  const built = new Date(BUILT_AT);
  return (
    <footer className="mt-32 mb-24 pt-6 border-t border-line grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] text-muted">
      <span>
        © {built.getFullYear()} {PROFILE.name} ·{" "}
        <span className="mono" title={BUILT_AT}>
          deployed {BUILT_AT.slice(0, 10)}
        </span>
        {BUILD_SHA && (
          <>
            {" · "}
            <a className="mono link" href={`${PROFILE.github}/Portfolio-VX/commit/${BUILD_SHA}`} target="_blank" rel="noopener noreferrer">
              {BUILD_SHA}
            </a>
          </>
        )}
      </span>
      <span className="md:text-center">
        <SessionMeter />
      </span>
      <span className="md:text-right flex md:justify-end items-center gap-4">
        <Link prefetch={false} href="/blueprint/" className="link">
          Blueprint
        </Link>
        <a href="#" className="link">
          Back to top ↑
        </a>
        <span className="uppercase tracking-[0.18em] text-faint">{PROFILE.motto}</span>
      </span>
    </footer>
  );
}

/** Breadcrumb used on sub-pages. */
export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="pt-8 sm:pt-12 flex items-center gap-1.5 mono text-[12px] text-muted flex-wrap">
      {items.map((c, i) => (
        <span key={c.label} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-faint">/</span>}
          {c.href ? (
            <Link prefetch={false} href={c.href} className="hover:text-fg hover:underline underline-offset-2">
              {c.label}
            </Link>
          ) : (
            <span className="text-fg-2" aria-current="page">
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
