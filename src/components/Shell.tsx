"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronLeft, ChevronRight, FileText, GitCommitHorizontal, MessageSquareText, Moon, Rocket, Search, Sun, X } from "lucide-react";
import { PROFILE, PROJECTS, RESUME } from "@/data/profile";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ToastProvider } from "./client";
import { Status } from "./ui";
import { audit } from "./audit";

const ProjectDetail = dynamic(() => import("./ModalBodies").then((m) => m.ProjectDetail), { ssr: false, loading: () => <ModalSkeleton /> });
const Tldr = dynamic(() => import("./ModalBodies").then((m) => m.Tldr), { ssr: false, loading: () => <ModalSkeleton /> });
const ResumePreview = dynamic(() => import("./ModalBodies").then((m) => m.ResumePreview), { ssr: false, loading: () => <ModalSkeleton /> });
const CommandPalette = dynamic(() => import("./Palette"), { ssr: false });
const loadChat = () => import("./ChatPanel");
const ChatPanel = dynamic(loadChat, { ssr: false });

function ModalSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6" aria-busy="true">
      <div className="aspect-[16/10] rounded-lg bg-hover animate-pulse" />
      <div className="flex flex-col gap-3">
        <div className="h-6 w-2/3 rounded bg-hover animate-pulse" />
        <div className="h-4 w-full rounded bg-hover animate-pulse" />
        <div className="h-4 w-5/6 rounded bg-hover animate-pulse" />
        <div className="h-40 rounded-lg bg-hover animate-pulse mt-2" />
      </div>
    </div>
  );
}

/* ---------------- Console context ---------------- */

type Drawer = { kind: "project"; id: string } | { kind: "resume" } | { kind: "tldr" } | null;

type Ctx = {
  openProject: (id: string) => void;
  openResume: () => void;
  openPalette: () => void;
  openTldr: () => void;
  openChat: (question?: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ConsoleCtx = createContext<Ctx | null>(null);
export const useConsole = () => {
  const c = useContext(ConsoleCtx);
  if (!c) throw new Error("useConsole outside Shell");
  return c;
};

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      return next;
    });
  }, []);
  return { theme, toggle };
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ShellInner>{children}</ShellInner>
    </ToastProvider>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAsk, setChatAsk] = useState<{ q: string; n: number } | undefined>();
  const [drawer, setDrawer] = useState<Drawer>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer(null);
    const h = window.location.hash.slice(1);
    if (h === "resume" || PROJECTS.some((p) => p.id === h)) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const pathname = usePathname();
  useEffect(() => setDrawer(null), [pathname]);

  // Scroll reveal: anything marked [data-reveal] fades up once, then is left alone.
  // Re-run per route so client-side navigation back to a page still reveals it.
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  // Off-screen sections use content-visibility, so the browser jumps to an
  // anchor using estimated heights and the target can drift once real content
  // renders. Re-align a few times after any section jump; stop if the visitor
  // scrolls themselves.
  useEffect(() => {
    let timers: number[] = [];
    const cancel = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const settle = (id: string) => {
      const el = document.getElementById(id);
      if (!el || el.tagName !== "SECTION") return;
      cancel();
      [0, 180, 420, 800, 1200].forEach((ms) =>
        timers.push(window.setTimeout(() => el.scrollIntoView({ block: "start", behavior: "instant" }), ms)),
      );
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement)?.closest("a");
      const href = a?.getAttribute("href") ?? "";
      const m = href.match(/^\/?#([\w-]+)$/);
      if (m && (href.startsWith("#") || window.location.pathname === "/")) window.setTimeout(() => settle(m[1]), 0);
    };
    const hash = window.location.hash.slice(1);
    if (hash) settle(hash);
    const stop = () => cancel();
    const onHash = () => settle(window.location.hash.slice(1));
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      cancel();
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [pathname]);

  // Deep links: /#strux, /#mapgeox, /#resume open the details panel.
  useEffect(() => {
    const fromHash = () => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (h === "resume") setDrawer({ kind: "resume" });
      else if (PROJECTS.some((p) => p.id === h)) setDrawer({ kind: "project", id: h });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const ctx = useMemo<Ctx>(
    () => ({
      openProject: (id) => {
        setDrawer({ kind: "project", id });
        audit("DescribeResource", `prj-${id}`);
      },
      openResume: () => {
        setDrawer({ kind: "resume" });
        audit("GetObject", "Resume.pdf");
      },
      openPalette: () => setPalette(true),
      openTldr: () => {
        setDrawer({ kind: "tldr" });
        audit("GetSummary", "tl;dr");
      },
      openChat: (question) => {
        setChatOpen(true);
        if (question) setChatAsk({ q: question, n: Date.now() });
      },
      theme,
      toggleTheme: () => {
        toggle();
        audit("UpdateTheme", theme === "dark" ? "light" : "dark");
      },
    }),
    [theme, toggle],
  );

  const project = drawer?.kind === "project" ? PROJECTS.find((p) => p.id === drawer.id) : undefined;
  const pIdx = project ? PROJECTS.indexOf(project) : -1;
  const step = useCallback(
    (dir: 1 | -1) => {
      if (pIdx < 0) return;
      const next = PROJECTS[(pIdx + dir + PROJECTS.length) % PROJECTS.length];
      setDrawer({ kind: "project", id: next.id });
      audit("DescribeResource", `prj-${next.id}`);
    },
    [pIdx],
  );

  return (
    <ConsoleCtx.Provider value={ctx}>
      {children}
      {drawer && project && (
        <Modal
          onClose={closeDrawer}
          label={project.name}
          size="xl"
          onArrow={PROJECTS.length > 1 ? step : undefined}
          header={(close) => (
            <>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-[16px] tracking-tight text-fg truncate">{project.name}</span>
                  <Status>{project.status}</Status>
                </div>
                <div className="mono text-[11px] text-muted mt-0.5">
                  prj-{project.id} · {project.type}
                </div>
              </div>
              {PROJECTS.length > 1 && (
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  <button className="btn-icon size-8" onClick={() => step(-1)} aria-label="Previous project">
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="mono text-[11px] text-muted tabular-nums w-9 text-center">
                    {pIdx + 1}/{PROJECTS.length}
                  </span>
                  <button className="btn-icon size-8" onClick={() => step(1)} aria-label="Next project">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
              <button className="btn-icon size-8" onClick={close} aria-label="Close">
                <X className="size-4" />
              </button>
            </>
          )}
        >
          <div key={project.id} className="anim-in">
            <ProjectDetail p={project} />
          </div>
        </Modal>
      )}
      {drawer?.kind === "resume" && (
        <Modal
          onClose={closeDrawer}
          label={RESUME.name}
          size="lg"
          header={(close) => (
            <>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[16px] tracking-tight text-fg">{RESUME.name}</div>
                <div className="mono text-[11px] text-muted mt-0.5">docs://{PROFILE.handle} · PDF · {RESUME.sizeKb} KB</div>
              </div>
              <button className="btn-icon size-8" onClick={close} aria-label="Close">
                <X className="size-4" />
              </button>
            </>
          )}
        >
          <ResumePreview />
        </Modal>
      )}
      {drawer?.kind === "tldr" && (
        <Modal
          onClose={closeDrawer}
          label="TL;DR"
          size="lg"
          header={(close) => (
            <>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-[16px] tracking-tight text-fg">TL;DR</div>
                <div className="mono text-[11px] text-muted mt-0.5">the whole portfolio, one screen</div>
              </div>
              <button className="btn-icon size-8" onClick={close} aria-label="Close">
                <X className="size-4" />
              </button>
            </>
          )}
        >
          <Tldr />
        </Modal>
      )}
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} ask={chatAsk} />}
      <ChatLauncher open={chatOpen} onToggle={() => setChatOpen((o) => !o)} />
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
    </ConsoleCtx.Provider>
  );
}

/* ---------------- Modal ---------------- */

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, iframe, [tabindex]:not([tabindex="-1"])';

function Modal({
  label,
  size,
  onClose,
  onArrow,
  header,
  children,
}: {
  label: string;
  size: "lg" | "xl";
  onClose: () => void;
  onArrow?: (dir: 1 | -1) => void;
  header: (close: () => void) => ReactNode;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return onClose();
    setClosing(true);
    window.setTimeout(onClose, 170);
  }, [onClose]);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    cardRef.current?.focus({ preventScroll: true });
    // Lock scroll without the layout jumping when the scrollbar disappears.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = gap ? `${gap}px` : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      const typing = (e.target as HTMLElement)?.closest("input, textarea");
      if (onArrow && !typing && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        onArrow(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key === "Tab" && cardRef.current) {
        const items = Array.from(cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === cardRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, onArrow]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 ${closing ? "is-closing" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="modal-backdrop absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={close} />
      <div
        ref={cardRef}
        tabIndex={-1}
        className={`modal-card relative w-full ${size === "xl" ? "sm:max-w-[980px]" : "sm:max-w-[860px]"} max-h-[92dvh] sm:max-h-[88dvh] flex flex-col bg-panel border border-line rounded-t-xl sm:rounded-xl shadow-2xl shadow-black/30 outline-none overflow-hidden`}
      >
        <div className="sm:hidden mx-auto mt-2 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-line shrink-0">{header(close)}</div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Header ---------------- */

const NAV_LINKS: { id: string; label: string; href?: string }[] = [
  { id: "projects", label: "Work" },
  { id: "deployments", label: "Experience" },
  { id: "blueprint", label: "Blueprint", href: "/blueprint/" },
  { id: "contact", label: "Contact" },
];

const ICON_BTN =
  "grid place-items-center size-9 shrink-0 rounded-lg text-muted hover:text-fg hover:bg-hover transition-colors cursor-pointer";

export function ConsoleBar() {
  const { openPalette, openTldr, theme, toggleTheme } = useConsole();
  const pathname = usePathname();
  const dark = theme === "dark";
  const [condensed, setCondensed] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Condense into a floating bar once the page leaves the top (observer, no scroll handler).
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCondensed(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Highlight the nav link for the section currently in view.
  useEffect(() => {
    if (pathname !== "/") {
      setActive(pathname.startsWith("/projects") ? "projects" : pathname.startsWith("/blueprint") ? "blueprint" : null);
      return;
    }
    const ids = new Set(NAV_LINKS.map((l) => l.id));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(ids.has(e.target.id) ? e.target.id : null);
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    document.querySelectorAll("main section[id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 left-0 h-px w-px" aria-hidden />
      <header className="sticky top-0 sm:top-3 z-40 h-16 sm:h-[4.5rem] flex items-center">
        {/* Geometry is identical in both states (no width/padding animation), so
            nothing reflows on scroll; only the surface fades in. */}
        <div
          className={`flex-1 min-w-0 flex items-center gap-1 sm:gap-2 h-14 -mx-5 px-5 sm:-mx-3 sm:px-3 rounded-none sm:rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
            condensed
              ? "bg-panel/95 border-line shadow-[0_10px_30px_-14px_rgb(16_24_40/0.28)] max-sm:border-x-transparent max-sm:border-t-transparent"
              : "bg-transparent border-transparent"
          }`}
        >
          <Link prefetch={false} href="/" className="flex items-center gap-2.5 shrink-0 rounded-lg pr-2" title="Home">
            <Logo size={30} />
            <span className="max-[359px]:sr-only text-[14.5px] font-semibold tracking-[-0.01em] text-fg whitespace-nowrap">
              Biprodeep Bose<span className="hidden lg:inline mono text-[11.5px] font-normal text-faint ml-1.5">/console</span>
            </span>
          </Link>

          <nav aria-label="Sections" className="hidden md:flex items-center gap-0.5 mx-auto">
            {NAV_LINKS.map((l) => {
              const on = active === l.id;
              return (
                <Link
                  prefetch={false}
                  key={l.id}
                  href={l.href ?? `/#${l.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`relative h-9 px-3 grid place-items-center rounded-lg text-[13.5px] transition-colors ${
                    on ? "text-fg font-medium" : "text-muted hover:text-fg hover:bg-hover"
                  }`}
                >
                  {l.label}
                  <span
                    className={`absolute left-3 right-3 bottom-1 h-0.5 rounded-full bg-accent transition-opacity duration-300 ${on ? "opacity-100" : "opacity-0"}`}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto md:ml-0 flex items-center gap-0.5">
            <button onClick={openPalette} className={ICON_BTN} aria-label="Search" title="Search">
              <Search className="size-[18px]" />
            </button>
            <NotificationBell />
            <button
              onClick={openTldr}
              className="h-9 px-2.5 shrink-0 rounded-lg mono text-[12px] font-semibold text-muted hover:text-fg hover:bg-hover transition-colors cursor-pointer"
              title="One-screen summary"
            >
              TL;DR
            </button>
            <button
              onClick={toggleTheme}
              className={ICON_BTN}
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              title={dark ? "Light theme" : "Dark theme"}
            >
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

/**
 * Mark: a lowercase "b" (stem + bowl) with a status LED, i.e. "biprodeep is up".
 * Same geometry as src/app/icon.svg.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" className="fill-fg" />
      <rect x="8.5" y="6.5" width="3.8" height="19" rx="1.9" className="fill-panel" />
      <circle cx="17.6" cy="19.4" r="4.9" fill="none" strokeWidth="3.8" className="stroke-panel" />
      <circle cx="23.4" cy="8.6" r="2.3" className="fill-ok" />
    </svg>
  );
}

/* ---------------- Assistant launcher ---------------- */

function ChatLauncher({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  // Warm the panel's chunk on intent so opening feels instant.
  const prefetch = () => void loadChat();
  return (
    <button
      onClick={onToggle}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onTouchStart={prefetch}
      aria-label={open ? "Close assistant" : "Ask the console assistant"}
      aria-expanded={open}
      className={`launcher-in fixed z-40 bottom-5 right-5 h-12 rounded-full bg-fg text-panel shadow-[0_10px_30px_-10px_rgb(0_0_0/0.45)] flex items-center gap-2 cursor-pointer transition-[transform,padding] duration-300 hover:-translate-y-0.5 active:translate-y-0 ${
        open ? "px-3.5 max-sm:hidden" : "pl-3.5 pr-4"
      }`}
    >
      {open ? (
        <X className="size-5" />
      ) : (
        <>
          <span className="relative">
            <MessageSquareText className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-ok ring-2 ring-fg" aria-hidden />
          </span>
          <span className="text-[13px] font-medium hidden sm:inline">Ask the console</span>
        </>
      )}
    </button>
  );
}

/* ---------------- Notifications bell ---------------- */

type ActivityEvent = { id: string; kind: "note" | "push" | "deploy"; title: string; detail?: string; href: string; at: string };

const KIND_ICON = { note: FileText, push: GitCommitHorizontal, deploy: Rocket } as const;
const SEEN_KEY = "activity-seen";

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function NotificationBell() {
  const [events, setEvents] = useState<ActivityEvent[] | null>(null);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string>("");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Fetch only once the page is idle: the feed never competes with load.
  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY) ?? "");
    } catch {}
    const load = () =>
      fetch("/api/activity/")
        .then((r) => (r.ok ? r.json() : { events: [] }))
        .then((d: { events: ActivityEvent[] }) => setEvents(d.events ?? []))
        .catch(() => setEvents([]));
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(load, { timeout: 5000 }) : window.setTimeout(load, 3000);
    return () => {
      if (!w.requestIdleCallback) window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !wrapRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = (events ?? []).filter((e) => e.at > seen).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      audit("ListNotifications", `${unread} unread`);
      const now = new Date().toISOString();
      try {
        localStorage.setItem(SEEN_KEY, now);
      } catch {}
      // Keep this open session's dots visible; they clear next time.
      window.setTimeout(() => setSeen(now), 1500);
    }
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unread ? `Activity, ${unread} new` : "Activity"}
        className="relative grid place-items-center size-9 rounded-lg text-muted hover:text-fg hover:bg-hover transition-colors cursor-pointer"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-fg text-[10px] font-semibold leading-4 text-center tabular-nums">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Recent activity"
          className="anim-in absolute right-0 top-11 z-50 w-[360px] max-sm:fixed max-sm:inset-x-3 max-sm:top-16 max-sm:w-auto panel shadow-xl shadow-black/10 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 h-11 border-b border-line">
            <span className="font-semibold text-fg">Activity</span>
            <span className="mono text-[11px] text-muted">{events ? `${events.length} events` : "loading…"}</span>
          </div>
          <ul className="max-h-[360px] overflow-y-auto divide-y divide-line">
            {!events &&
              [0, 1, 2].map((i) => (
                <li key={i} className="px-4 py-3.5">
                  <div className="h-3.5 w-3/4 rounded bg-hover animate-pulse" />
                  <div className="h-3 w-1/3 rounded bg-hover animate-pulse mt-2" />
                </li>
              ))}
            {events?.length === 0 && <li className="px-4 py-6 text-center text-muted">Nothing new yet.</li>}
            {events?.map((e) => {
              const Icon = KIND_ICON[e.kind];
              const isNew = e.at > seen;
              const external = e.href.startsWith("http");
              const body = (
                <>
                  <span className={`mt-0.5 grid place-items-center size-7 shrink-0 rounded-md ${isNew ? "bg-accent-soft text-accent" : "bg-hover text-muted"}`}>
                    <Icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-fg leading-snug line-clamp-2">{e.title}</span>
                    {e.detail && <span className="block text-[12px] text-muted truncate mt-0.5">{e.detail}</span>}
                    <span className="block mono text-[10.5px] text-faint mt-1">
                      {e.kind === "note"
                        ? new Date(e.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
                        : timeAgo(e.at)}
                    </span>
                  </span>
                  {isNew && <span className="mt-1.5 size-2 rounded-full bg-accent shrink-0" aria-label="new" />}
                </>
              );
              const cls = "flex gap-3 px-4 py-3 hover:bg-hover transition-colors";
              return (
                <li key={e.id}>
                  {external ? (
                    <a href={e.href} target="_blank" rel="noopener noreferrer" className={cls}>
                      {body}
                    </a>
                  ) : (
                    <Link prefetch={false} href={e.href} className={cls} onClick={() => setOpen(false)}>
                      {body}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
