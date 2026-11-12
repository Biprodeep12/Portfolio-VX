// Notes: short engineering write-ups. Each gets its own URL at /notes/<slug>.
// Body is a tiny block format so no markdown library ships to the client.

export type Block =
  | { t: "p"; text: string }
  | { t: "h2"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "quote"; text: string };

export type Note = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: "Write-up" | "ADR";
  summary: string;
  tags: string[];
  body: Block[];
};

export const NOTES: Note[] = [
  {
    slug: "cutting-mobile-lcp",
    title: "Cutting this portfolio's mobile LCP from 7.2 s to 1.4 s",
    date: "2026-11-12",
    kind: "Write-up",
    summary:
      "Lighthouse said 73 on mobile. Half of the fix was real (1.2 MB of oversized images), half was learning that the simulated LCP was blaming the wrong thing.",
    tags: ["Performance", "Next.js", "Lighthouse"],
    body: [
      {
        t: "p",
        text: "The first Lighthouse run on the new console-style portfolio came back at 73 on mobile with a 7.2 s Largest Contentful Paint. Desktop was a comfortable 96, so this was a mobile-specific problem worth digging into.",
      },
      { t: "h2", text: "What was actually slow" },
      {
        t: "ul",
        items: [
          "Images: the static export turns Next's image optimizer off, so a 525 KB portrait and 560 KB project screenshots were served at full size into slots a few hundred pixels wide.",
          "The LCP element was the terminal's `whoami` output, which only appeared after hydration and a typing animation.",
          "No code-splitting for things you only need on click: the project modal and the command palette shipped in the main bundle.",
        ],
      },
      { t: "h2", text: "Fixes" },
      {
        t: "ul",
        items: [
          "A build script that pre-sizes every image into 320/640/1080 px WebP variants, plus a custom next/image loader that picks the nearest one. The portrait went from 525 KB to 25 KB.",
          "Server-render the terminal's first command and output, so the hero is complete before any JavaScript runs.",
          "Stop animating opacity on the biggest hero text. Fading the LCP element in tells Lighthouse it wasn't painted yet.",
          "Lazy-load the modal bodies and the palette, inline the CSS (it's one page and ~30 KB), and skip preloading the monospace font.",
        ],
      },
      { t: "h2", text: "The part that wasn't a real problem" },
      {
        t: "p",
        text: "Even after the fixes, Lighthouse's default simulated mode still reported ~7 s on mobile. Tracing real LCP entries with 4x CPU throttling and slow-4G emulation showed LCP at 1.0 s, the same moment as first paint. On localhost every script finishes before first paint, so the simulator attributes all of them to LCP. Lighthouse with applied (devtools) throttling agreed with the trace.",
      },
      {
        t: "table",
        head: ["", "Before", "After"],
        rows: [
          ["Mobile performance", "73", "95 (applied throttling)"],
          ["Mobile LCP", "7.2 s", "1.4 s"],
          ["Desktop performance", "96", "100"],
          ["Accessibility", "97", "100"],
          ["Portrait image", "525 KB", "25 KB"],
        ],
      },
      { t: "h2", text: "What I'd do differently" },
      {
        t: "p",
        text: "Measure real LCP entries before trusting a single score. I spent a round optimizing against a number that was partly an artifact of testing on localhost.",
      },
    ],
  },
  {
    slug: "adr-001-assistant-fallback",
    title: "ADR-001: An assistant that still works when the AI doesn't",
    date: "2026-11-12",
    kind: "ADR",
    summary:
      "Why the portfolio assistant calls a free OpenRouter model through a server route, and falls back to an offline answer engine built from the site's own data.",
    tags: ["Architecture", "AI", "Reliability"],
    body: [
      { t: "h2", text: "Context" },
      {
        t: "p",
        text: "I wanted an assistant that answers questions about my work. Constraints: no cost, no API key in the browser, no slower page loads, and free models are often rate-limited or briefly unavailable.",
      },
      { t: "h2", text: "Decision" },
      {
        t: "ul",
        items: [
          "A server route proxies chat to OpenRouter's free router, streaming plain text back. The key lives only in server env vars.",
          "The model only answers from a fact sheet generated from the same data file the page renders, so the site and the assistant can't drift apart.",
          "If the key is missing or the model fails, the client answers from an offline intent engine over the same data, and labels the answer as offline.",
          "The chat panel is lazy-loaded; only a small launcher button ships with the page.",
        ],
      },
      { t: "h2", text: "Alternatives considered" },
      {
        t: "ul",
        items: [
          "Calling the model straight from the browser: simplest, but exposes the key.",
          "Running a small model in the browser: no key, but hundreds of MB to download, which defeats the performance work.",
          "Offline answers only: robust and free, but rigid with phrasing it doesn't recognise.",
        ],
      },
      { t: "h2", text: "Consequences" },
      {
        t: "ul",
        items: [
          "The site is no longer a pure static export: pages are still prerendered, but `/api/chat` runs on the server.",
          "Rate limiting is per server instance, so it's best-effort; enough for a portfolio, not for a product.",
          "Every answer has a path that works, which matters more to a visitor than which path produced it.",
        ],
      },
    ],
  },
];

export const noteBySlug = (slug: string) => NOTES.find((n) => n.slug === slug);
