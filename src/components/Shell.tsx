"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, MessageSquareText, Moon, Search, Sun, X } from "lucide-react";
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

/* ---------------- Console bar ---------------- */

const HINTS = ["strux", "deployments", "resume", "copy email", "mapgeox", "dark theme"];

/**
 * Rotating ghost text so the search field shows what it can do. Starts once
 * the page has settled, runs through the hints once, then rests, so it
 * never competes with load or keeps the main thread busy.
 */
function useGhost(words: string[]) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let w = 0;
    let i = words[0].length;
    let deleting = true;
    let shown = 0;
    let t = 0;
    const step = () => {
      if (document.hidden) {
        t = window.setTimeout(step, 1000);
        return;
      }
      const word = words[w];
      if (deleting) {
        i--;
        setText(word.slice(0, i));
        if (i <= 0) {
          deleting = false;
          w = (w + 1) % words.length;
        }
        t = window.setTimeout(step, 35);
      } else {
        const next = words[w];
        i++;
        setText(next.slice(0, i));
        if (i < next.length) t = window.setTimeout(step, 70);
        else if (++shown < words.length) {
          deleting = true;
          t = window.setTimeout(step, 2200);
        }
      }
    };
    t = window.setTimeout(step, 6000);
    return () => window.clearTimeout(t);
  }, [words]);
  return text;
}

export function ConsoleBar() {
  const { openPalette, openTldr, theme, toggleTheme } = useConsole();
  const ghost = useGhost(HINTS);
  const dark = theme === "dark";

  return (
    <div className="flex items-center gap-3 h-16">
      <Link prefetch={false} href="/" className="flex items-center gap-2.5 shrink-0 group" title="Home">
        <Logo />
        <span className="leading-none">
          <span className="block text-[13px] font-semibold tracking-tight text-fg">Biprodeep Bose</span>
          <span className="block mono text-[10.5px] text-muted mt-1">console · v26.11</span>
        </span>
      </Link>

      <button
        onClick={openPalette}
        className="ml-auto sm:mx-auto flex items-center gap-2.5 h-9 sm:w-[360px] rounded-lg border border-line bg-panel px-2.5 text-left cursor-pointer hover:border-line-strong transition-colors shadow-[0_1px_2px_rgb(16_24_40/0.04)]"
      >
        <Search className="size-4 text-muted shrink-0" aria-hidden />
        <span className="flex-1 min-w-0 flex items-center text-[13px]">
          <span className="sr-only sm:not-sr-only text-faint">Search</span>
          <span className="hidden sm:inline mono text-[12px] text-fg-2 ml-1.5 truncate" aria-hidden>
            {ghost}
          </span>
          <span className="hidden sm:inline w-px h-3.5 bg-accent ml-px caret-blink" aria-hidden />
        </span>
        <kbd className="kbd hidden sm:inline">Ctrl K</kbd>
      </button>

      <button
        onClick={openTldr}
        className="shrink-0 h-9 px-3 rounded-lg border border-line bg-panel/80 text-[12.5px] font-semibold text-fg-2 hover:text-fg hover:border-line-strong transition-colors cursor-pointer mono"
        title="One-screen summary"
      >
        TL;DR
      </button>

      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={dark}
        aria-label="Dark theme"
        className="relative shrink-0 flex items-center h-9 w-[68px] rounded-lg border border-line bg-subtle p-[3px] cursor-pointer"
      >
        <span
          className={`absolute top-[3px] bottom-[3px] w-[30px] rounded-md bg-panel border border-line shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            dark ? "translate-x-[30px]" : "translate-x-0"
          }`}
        />
        <span className={`relative z-10 grid place-items-center w-[30px] h-full ${dark ? "text-faint" : "text-fg"}`}>
          <Sun className="size-3.5" />
        </span>
        <span className={`relative z-10 grid place-items-center w-[30px] h-full ${dark ? "text-fg" : "text-faint"}`}>
          <Moon className="size-3.5" />
        </span>
      </button>
    </div>
  );
}

/** Mark: a "B" assembled from rack units, with a status LED. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden className="shrink-0">
      <rect x="0.5" y="0.5" width="27" height="27" rx="7" className="fill-fg" />
      <rect x="7" y="6" width="3" height="16" rx="1" className="fill-panel" />
      <rect x="11.5" y="6" width="8" height="7" rx="2" className="fill-panel" />
      <rect x="11.5" y="15" width="10" height="7" rx="2" className="fill-panel" />
      <circle cx="18.5" cy="18.5" r="1.4" className="fill-ok" />
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
