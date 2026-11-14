// Interactive maps for /blueprint. Every section is drawn in the same visual
// language as the architecture map: components you can inspect, connections,
// and request flows you can play step by step. Coordinates are SVG user units
// for a wide (desktop) and a narrow (phone) layout of each map.

import { CONTROL, EDGES, FLOWS, NODES } from "./blueprint";

export type R = { x: number; y: number; w: number; h: number };
export type SceneNode = {
  id: string;
  title: string;
  short?: string;
  sub: string;
  tag: string;
  tone?: "warn" | "ok";
  part?: string;
  what: string;
  points: string[];
  tradeoff?: string;
};
export type SceneStep = { from?: string; to?: string; at?: string; text: string; ms?: number };
export type SceneFlow = { id: string; name: string; summary: string; steps: SceneStep[] };
export type Zone = R & { style: "dashed" | "filled" };
export type Stub = { node: string; y: number; label: string; into: boolean };
export type Layout = {
  W: number;
  H: number;
  nodes: Record<string, R>;
  zones?: Zone[];
  labels?: { x: number; y: number; text: string; anchor?: "start" | "middle" | "end" }[];
  stubs?: Stub[];
  edgeLabels?: boolean;
  legend?: boolean;
};
export type Scene = {
  id: string;
  label: string;
  tryThis: string;
  nodes: SceneNode[];
  edges: { a: string; b: string; label?: string }[];
  flows: SceneFlow[];
  wide: Layout;
  narrow: Layout;
};

// Wide grid: 160 × 64 boxes on a 228-unit column pitch.
const n = (x: number, y: number, w = 160, h = 64): R => ({ x, y, w, h });
const col = (c: number) => 16 + c * 228;
// Narrow grid: three 100-wide columns, or one 150-wide centred box.
const m = (x: number, y: number, w = 100, h = 56): R => ({ x, y, w, h });
const C0 = 12;
const C1 = 130;
const C2 = 248;
const MID = 105;
const row = (r: number) => 16 + r * 100;

/* ================= 01 Architecture ================= */

const ARCH: Scene = {
  id: "architecture",
  label: "Architecture diagram",
  tryThis: "Play Page load, then Search: watch which requests reach the database and which are answered earlier, by the CDN or the cache.",
  nodes: NODES,
  edges: EDGES,
  flows: FLOWS,
  wide: {
    W: 1104,
    H: 640,
    nodes: {
      client: n(16, 296),
      edge: n(244, 296),
      proxy: n(472, 296),
      web: n(700, 176),
      api: n(700, 296),
      ws: n(700, 416),
      worker: n(700, 536),
      replica: n(928, 176),
      redis: n(928, 296),
      db: n(928, 416),
      s3: n(928, 536),
      ci: n(472, 34),
      iam: n(700, 34),
      obs: n(928, 34),
    },
    zones: [
      { x: 452, y: 140, w: 648, h: 490, style: "dashed" },
      { x: 452, y: 14, w: 648, h: 104, style: "filled" },
    ],
    labels: [
      { x: 96, y: 282, text: "internet", anchor: "middle" },
      { x: 324, y: 282, text: "edge network", anchor: "middle" },
      { x: 468, y: 162, text: "VPC 10.0.0.0/16" },
      { x: 552, y: 282, text: "public subnet", anchor: "middle" },
      { x: 780, y: 162, text: "private · app", anchor: "middle" },
      { x: 1008, y: 162, text: "isolated · data", anchor: "middle" },
      { x: 436, y: 70, text: "control plane", anchor: "end" },
    ],
    stubs: CONTROL.map((c) => ({ node: c.id, y: 140, label: c.label, into: c.dir === "down" })),
    edgeLabels: true,
    legend: true,
  },
  narrow: {
    W: 360,
    H: 704,
    nodes: {
      client: m(MID, 16, 150),
      edge: m(MID, 104, 150),
      proxy: m(MID, 212, 150),
      web: m(C0, 300),
      api: m(C1, 300),
      ws: m(C2, 300),
      worker: m(C0, 410),
      redis: m(C1, 410),
      db: m(C0, 520),
      s3: m(C1, 520),
      replica: m(C2, 520),
      ci: m(C0, 632),
      iam: m(C1, 632),
      obs: m(C2, 632),
    },
    zones: [
      { x: 4, y: 196, w: 352, h: 396, style: "dashed" },
      { x: 4, y: 620, w: 352, h: 80, style: "filled" },
    ],
    labels: [{ x: 14, y: 586, text: "VPC" }],
    stubs: CONTROL.map((c) => ({ node: c.id, y: 592, label: c.label, into: c.dir === "down" })),
  },
};

/* ================= 02 Frontend: how each page is produced ================= */

const FRONTEND: Scene = {
  id: "frontend",
  label: "Frontend rendering map",
  tryThis: "Compare Static page with Signed-in page: count how many components each one has to touch.",
  nodes: [
    {
      id: "browser",
      title: "Browser",
      sub: "React, hydration",
      tag: "client",
      what: "Gets finished HTML first, then hydrates. Heavy widgets arrive later through next/dynamic.",
      points: ["One typed API client shared with the mobile app", "Server data cached per resource; filters live in the URL", "Session in an httpOnly, SameSite=Lax cookie"],
    },
    {
      id: "cdn",
      title: "CDN cache",
      sub: "Cloudflare edge",
      tag: "edge",
      what: "Holds static and ISR pages close to visitors; private pages pass straight through.",
      points: ["Hashed JS and CSS cached for a year", "ISR HTML served stale while it revalidates", "Cache-Control: private, no-store on signed-in pages"],
    },
    {
      id: "next",
      title: "Next.js server",
      sub: "Pages Router",
      tag: "app",
      what: "File-based routes under pages/. Each page declares how it gets its data, so rendering is decided page by page.",
      points: ["_app for providers, per-page getLayout for each shell", "middleware.ts redirects signed-out users before a page runs", "Stateless containers behind Nginx"],
      tradeoff: "Whole-page hydration (no Server Components), so JavaScript budgets rely on next/dynamic and discipline.",
    },
    {
      id: "gsp",
      title: "getStaticProps",
      sub: "build + ISR",
      tag: "data fn",
      what: "Runs at build time, and again in the background when a page's revalidate window passes.",
      points: ["getStaticPaths prebuilds popular pages; fallback: 'blocking' renders the long tail on demand", "revalidate: 300 keeps pages at most 5 minutes old", "On-demand: the API calls res.revalidate() when content changes"],
    },
    {
      id: "gssp",
      title: "getServerSideProps",
      short: "getServerSide",
      sub: "every request",
      tag: "data fn",
      what: "Runs on every request for signed-in pages, with the visitor's cookie.",
      points: ["Checks the session first; redirects to /login before any HTML", "Forwards the cookie to the API on the private network", "Sends Cache-Control: private, no-store"],
    },
    {
      id: "api",
      title: "Go API",
      sub: "/v1, cookie auth",
      tag: "app",
      what: "The only source of data for both data functions and client fetches.",
      points: ["Same error shape everywhere", "Calls the revalidate webhook when content changes"],
    },
    {
      id: "ws",
      title: "Realtime",
      sub: "WebSockets",
      tag: "app",
      what: "Live pages render a shell, then subscribe for updates instead of polling.",
      points: ["Room per resource", "Session checked when the socket connects"],
    },
  ],
  edges: [
    { a: "browser", b: "cdn", label: "HTTPS" },
    { a: "cdn", b: "next", label: "miss" },
    { a: "next", b: "gsp" },
    { a: "next", b: "gssp" },
    { a: "gsp", b: "api", label: "build/ISR" },
    { a: "gssp", b: "api", label: "per request" },
    { a: "browser", b: "ws", label: "socket" },
  ],
  flows: [
    {
      id: "static",
      name: "Static page",
      summary: "/pricing: rendered once at build, then served from the edge with no server work at all.",
      steps: [
        { from: "gsp", to: "api", text: "At build time, getStaticProps fetches the content once." },
        { from: "next", to: "cdn", text: "After a deploy, the first request caches the HTML and hashed assets at the edge." },
        { from: "browser", to: "cdn", text: "A visitor hits the nearest edge: cache HIT.", ms: 30 },
        { at: "browser", text: "Paints from the first response, then hydrates. The server did nothing." },
      ],
    },
    {
      id: "isr",
      name: "ISR page",
      summary: "/listings/42: always served from cache, refreshed in the background.",
      steps: [
        { from: "browser", to: "cdn", text: "The cached page is 6 minutes old; revalidate is 5.", ms: 30 },
        { at: "cdn", text: "The stale page is served instantly; nobody waits." },
        { from: "cdn", to: "next", text: "In the background, the edge revalidates and Next.js regenerates the page." },
        { from: "next", to: "gsp", text: "getStaticProps runs again." },
        { from: "gsp", to: "api", text: "Fresh data from the API." },
        { at: "cdn", text: "The cache is updated; the next visitor gets the new page." },
      ],
    },
    {
      id: "ssr",
      name: "Signed-in page",
      summary: "/dashboard: rendered per request with the visitor's session.",
      steps: [
        { from: "browser", to: "cdn", text: "GET /dashboard with the session cookie.", ms: 30 },
        { from: "cdn", to: "next", text: "Private page: the edge passes it straight through.", ms: 35 },
        { from: "next", to: "gssp", text: "getServerSideProps runs for this request." },
        { from: "gssp", to: "api", text: "Session checked and data loaded, cookie forwarded.", ms: 18 },
        { at: "gssp", text: "If the session had been invalid, a redirect to /login would have gone back instead of HTML." },
        { at: "browser", text: "HTML and props arrive together; the page hydrates." },
      ],
    },
    {
      id: "lazy",
      name: "Heavy widget",
      summary: "The booking widget stays out of the first load.",
      steps: [
        { at: "browser", text: "The page is interactive without the widget's code." },
        { from: "browser", to: "cdn", text: "next/dynamic fetches the widget chunk only when it's needed." },
        { at: "browser", text: "The first load stays inside the JavaScript budget." },
      ],
    },
    {
      id: "live",
      name: "Live view",
      summary: "Availability updates are pushed, not polled.",
      steps: [
        { from: "browser", to: "ws", text: "After hydrating, the page opens a socket." },
        { at: "ws", text: "Joins the room for this listing after an access check." },
        { from: "ws", to: "browser", text: "Changes are pushed the moment they happen." },
      ],
    },
  ],
  wide: {
    W: 1104,
    H: 464,
    nodes: {
      browser: n(col(0), 144),
      cdn: n(col(1), 144),
      next: n(col(2), 144),
      gsp: n(col(3), 24),
      gssp: n(col(3), 264),
      api: n(col(4), 144),
      ws: n(col(1), 384),
    },
    zones: [{ x: 456, y: 8, w: 420, h: 340, style: "dashed" }],
    labels: [{ x: 468, y: 28, text: "Next.js server · Pages Router" }],
    edgeLabels: true,
  },
  narrow: {
    W: 360,
    H: 488,
    nodes: {
      browser: m(MID, row(0), 150),
      cdn: m(C0, row(1)),
      ws: m(C2, row(1)),
      next: m(MID, row(2), 150),
      gsp: m(C0, row(3)),
      gssp: m(C2, row(3)),
      api: m(MID, row(4), 150),
    },
    zones: [{ x: 4, y: 200, w: 352, h: 192, style: "dashed" }],
    labels: [{ x: 14, y: 388, text: "Next.js server" }],
  },
};

/* ================= 03 Backend: the middleware gates ================= */

const GATE = (x: number) => n(x, 30, 124, 64);
const OUT = (x: number) => n(x, 170, 124, 64);
const NL = (r: number) => m(12, 16 + r * 70, 176, 48);
const NR = (r: number) => m(224, 16 + r * 70, 124, 48);

const BACKEND: Scene = {
  id: "backend",
  label: "Backend request pipeline",
  tryThis: "Play Too many requests, then Bad payload: each is rejected at a different gate, and neither ever reaches the database.",
  nodes: [
    { id: "req", title: "POST", sub: "/v1/projects", tag: "request", what: "A request to create a project, with a session cookie and a JSON body.", points: ["Nginx has already added X-Request-Id", "Every log line and trace for this request carries that id"] },
    { id: "rate", title: "Rate limit", sub: "per IP", tag: "gate 1", what: "The cheapest check runs first: is this IP over its budget? It runs before auth, so it can only key on the IP.", points: ["Token bucket per IP, shared across instances in Redis", "429 with Retry-After; nothing else runs"] },
    { id: "auth", title: "Auth", sub: "session cookie", tag: "gate 2", what: "Who is this? The session is looked up and attached to the request context.", points: ["Short-lived session plus rotating refresh token", "Expired or missing → 401"] },
    { id: "rbac", title: "RBAC", sub: "project:create", tag: "gate 3", what: "May they do this? The route declares the permission it needs.", points: ["Roles per org; ownership checked per resource", "Tenant comes from the session, never the body"] },
    { id: "valid", title: "Validate", sub: "typed request", tag: "gate 4", what: "Is the input well formed? The body decodes into a typed struct and is validated field by field.", points: ["422 with per-field errors the UI can show", "Unknown fields rejected"] },
    { id: "handler", title: "Handler", sub: "service + repo", tag: "app", what: "Business logic: a plain Go service over a repository interface, testable without HTTP.", points: ["No HTTP types below this layer", "Domain errors map to status codes in one place"] },
    { id: "pg", title: "Postgres tx", sub: "row + job", tag: "data", what: "The project row and its follow-up job are written in one transaction.", points: ["A crash can't leave one without the other", "sqlc sends every value as a bound parameter"] },
    { id: "r429", title: "429", sub: "Retry-After", tag: "rejected", tone: "warn", what: "Too many requests. The client is told when to retry.", points: ["Cost to the server: microseconds"] },
    { id: "r401", title: "401", sub: "no session", tag: "rejected", tone: "warn", what: "Not signed in, or the session expired.", points: ["The web client refreshes once and retries"] },
    { id: "r403", title: "403", sub: "missing role", tag: "rejected", tone: "warn", what: "Signed in, but not allowed to do this.", points: ["Response names the missing permission for the UI"] },
    { id: "r422", title: "422", sub: "field errors", tag: "rejected", tone: "warn", what: "Signed in and allowed, but the input is invalid.", points: ['{ "fields": { "name": "required" } }'] },
    { id: "ok", title: "201", sub: "Created", tag: "response", tone: "ok", what: "The new project comes back with its id.", points: ["The optimistic row in the UI is confirmed"] },
    { id: "job", title: "River job", short: "Job", sub: "after commit", tag: "worker", what: "A worker picks up the job only once the transaction has committed: the welcome email, webhooks, thumbnails.", points: ["Side effects only happen for committed data", "Unique by project id, so a retry is harmless"] },
  ],
  edges: [
    { a: "req", b: "rate" },
    { a: "rate", b: "auth" },
    { a: "auth", b: "rbac" },
    { a: "rbac", b: "valid" },
    { a: "valid", b: "handler" },
    { a: "handler", b: "pg" },
    { a: "rate", b: "r429" },
    { a: "auth", b: "r401" },
    { a: "rbac", b: "r403" },
    { a: "valid", b: "r422" },
    { a: "handler", b: "ok" },
    { a: "pg", b: "job" },
  ],
  flows: [
    {
      id: "ok",
      name: "Valid request",
      summary: "Every gate passes; the write and its follow-up job commit together.",
      steps: [
        { from: "req", to: "rate", text: "Under the limit.", ms: 0.6 },
        { from: "rate", to: "auth", text: "Session found and fresh.", ms: 1.2 },
        { from: "auth", to: "rbac", text: "Role grants project:create.", ms: 0.4 },
        { from: "rbac", to: "valid", text: "Body decodes; name is 1–80 characters.", ms: 0.3 },
        { from: "valid", to: "handler", text: "The service runs." },
        { from: "handler", to: "pg", text: "INSERT the project and enqueue its job, one transaction.", ms: 12 },
        { from: "handler", to: "ok", text: "201 Created in about 15 ms of server time." },
        { from: "pg", to: "job", text: "After commit, a worker sends the welcome email." },
      ],
    },
    {
      id: "rate",
      name: "Too many requests",
      summary: "Rejected at the first gate, before any real work.",
      steps: [
        { from: "req", to: "rate", text: "This IP is over its token budget.", ms: 0.6 },
        { from: "rate", to: "r429", text: "429 with Retry-After: 12. Auth, database and handler never ran." },
      ],
    },
    {
      id: "auth",
      name: "Expired session",
      summary: "Stopped at auth; the client refreshes and retries once.",
      steps: [
        { from: "req", to: "rate", text: "Under the limit.", ms: 0.6 },
        { from: "rate", to: "auth", text: "The session expired 3 minutes ago.", ms: 1.2 },
        { from: "auth", to: "r401", text: "401 session_expired. The web client makes one shared refresh call, then retries." },
      ],
    },
    {
      id: "rbac",
      name: "Viewer role",
      summary: "Signed in, but not allowed.",
      steps: [
        { from: "req", to: "rate", text: "Under the limit.", ms: 0.6 },
        { from: "rate", to: "auth", text: "Valid session.", ms: 1.2 },
        { from: "auth", to: "rbac", text: "The user is a viewer in this org.", ms: 0.4 },
        { from: "rbac", to: "r403", text: "403 forbidden, need: project:create. The UI hides the button next time." },
      ],
    },
    {
      id: "valid",
      name: "Bad payload",
      summary: "Allowed, but the input is wrong.",
      steps: [
        { from: "req", to: "rate", text: "Under the limit.", ms: 0.6 },
        { from: "rate", to: "auth", text: "Valid session.", ms: 1.2 },
        { from: "auth", to: "rbac", text: "Allowed.", ms: 0.4 },
        { from: "rbac", to: "valid", text: "name is empty.", ms: 0.3 },
        { from: "valid", to: "r422", text: "422 with { fields: { name: required } }, shown inline in the form." },
      ],
    },
  ],
  wide: {
    W: 1056,
    H: 250,
    nodes: {
      req: GATE(16),
      rate: GATE(166),
      auth: GATE(316),
      rbac: GATE(466),
      valid: GATE(616),
      handler: GATE(766),
      pg: GATE(916),
      r429: OUT(166),
      r401: OUT(316),
      r403: OUT(466),
      r422: OUT(616),
      ok: OUT(766),
      job: OUT(916),
    },
  },
  narrow: {
    W: 360,
    H: 500,
    nodes: {
      req: NL(0),
      rate: NL(1),
      auth: NL(2),
      rbac: NL(3),
      valid: NL(4),
      handler: NL(5),
      pg: NL(6),
      r429: NR(1),
      r401: NR(2),
      r403: NR(3),
      r422: NR(4),
      ok: NR(5),
      job: NR(6),
    },
  },
};

/* ================= 04 Data ================= */

const DATA: Scene = {
  id: "data",
  label: "Data and storage map",
  tryThis: "Play Cache miss, then Cached read, and compare the time budgets at the top of the step list.",
  nodes: [
    { id: "api", title: "Go API", sub: "sqlc, pgx", tag: "app", what: "Reads through the cache, writes to the primary, sends search and heavy reads to the replica.", points: ["Connections pooled through RDS Proxy", "Every query has a timeout, so slow ones can't pile up"] },
    { id: "redis", title: "Redis", sub: "cache-aside", tag: "cache", what: "Hot, read-heavy data with short TTLs plus jitter, invalidated on write.", points: ["A cache error falls back to Postgres, never fails the request", "Hit ratio on a dashboard"] },
    { id: "pg", title: "PostgreSQL", sub: "RDS Multi-AZ", tag: "data", what: "The source of truth, and the job queue: a job is enqueued in the same transaction as the write.", points: ["Composite and partial indexes that match real queries", "Big append-only tables partitioned by month", "Versioned migrations, expand → migrate → contract"] },
    { id: "replica", title: "Read replica", short: "Replica", sub: "search, reports", tag: "data", what: "Takes search, reports and exports, so the primary stays fast for writes and search needs no cluster of its own.", points: ["Full-text and trigram GIN indexes", "Replication lag is monitored; never used for read-your-own-write paths"] },
    { id: "worker", title: "Workers", sub: "River jobs", tag: "worker", what: "Claim jobs from Postgres and turn committed changes into side effects: files, emails, webhooks.", points: ["Unique jobs keyed by business id", "Retries with backoff; alert on final failure"] },
    { id: "backup", title: "Backups", sub: "PITR, snapshots", tag: "backup", what: "Point-in-time recovery from transaction logs plus daily snapshots, copied to the standby region.", points: ["Lose at most ~5 minutes of data", "Restores rehearsed monthly into staging"] },
    { id: "s3", title: "S3", sub: "files, archives", tag: "storage", what: "User uploads, generated files and archived table partitions.", points: ["Intelligent-Tiering for cold files", "Critical buckets replicated to the standby region"] },
  ],
  edges: [
    { a: "api", b: "redis", label: "cache" },
    { a: "api", b: "pg", label: "SQL" },
    { a: "api", b: "replica", label: "search" },
    { a: "pg", b: "replica", label: "replication" },
    { a: "pg", b: "worker", label: "jobs" },
    { a: "worker", b: "s3", label: "files" },
    { a: "pg", b: "backup", label: "logs" },
  ],
  flows: [
    {
      id: "hit",
      name: "Cached read",
      summary: "The common case: answered from memory.",
      steps: [
        { from: "api", to: "redis", text: "GET project:42:v1 → HIT.", ms: 1 },
        { at: "api", text: "Returned without touching Postgres." },
      ],
    },
    {
      id: "miss",
      name: "Cache miss",
      summary: "Load once, cache with jitter, serve the next thousand from memory.",
      steps: [
        { from: "api", to: "redis", text: "MISS.", ms: 1 },
        { from: "api", to: "pg", text: "One index range scan on (org_id, created_at desc).", ms: 4 },
        { from: "api", to: "redis", text: "SET with a 300 s TTL plus up to 30 s jitter.", ms: 1 },
        { at: "api", text: "Next reads are hits until a write invalidates the key." },
      ],
    },
    {
      id: "write",
      name: "Write",
      summary: "Commit the change and its job together, then invalidate.",
      steps: [
        { from: "api", to: "pg", text: "UPDATE the project and enqueue a webhook job, one transaction.", ms: 8 },
        { from: "api", to: "redis", text: "DEL project:42:v1.", ms: 1 },
        { from: "pg", to: "worker", text: "Only after commit, a worker claims the job." },
        { at: "worker", text: "The webhook is sent; a duplicate attempt would be a no-op." },
      ],
    },
    {
      id: "search",
      name: "Search",
      summary: "Search runs on the replica: no search cluster to pay for.",
      steps: [
        { from: "api", to: "redis", text: "Hot prefix? Answered from cache.", ms: 1 },
        { from: "api", to: "replica", text: "Otherwise a full-text plus trigram query on the replica's GIN indexes.", ms: 15 },
        { at: "api", text: "Results ranked; typos still match. The primary never saw the query." },
      ],
    },
    {
      id: "report",
      name: "Heavy report",
      summary: "Expensive reads stay off the primary.",
      steps: [
        { from: "api", to: "replica", text: "The monthly export query runs on the replica." },
        { at: "pg", text: "The primary keeps serving writes at normal latency." },
      ],
    },
    {
      id: "backup",
      name: "Backup & restore",
      summary: "Continuous, copied off-region, and actually tested.",
      steps: [
        { from: "pg", to: "backup", text: "Transaction logs every 5 minutes; a snapshot every day." },
        { at: "backup", text: "Snapshots are copied to a vault in a second region." },
        { at: "s3", text: "Critical files are replicated to the standby region; old table partitions are archived here." },
        { at: "backup", text: "Monthly drill: restore into staging, time it, write it up." },
      ],
    },
  ],
  wide: {
    W: 1104,
    H: 344,
    nodes: {
      api: n(col(0), 144),
      redis: n(col(1), 24),
      replica: n(col(1), 264),
      pg: n(col(2), 144),
      backup: n(col(2), 264),
      worker: n(col(3), 144),
      s3: n(col(4), 144),
    },
    edgeLabels: true,
  },
  narrow: {
    W: 360,
    H: 488,
    nodes: {
      api: m(MID, row(0), 150),
      redis: m(C0, row(1)),
      replica: m(C2, row(1)),
      pg: m(MID, row(2), 150),
      worker: m(C0, row(3)),
      s3: m(C2, row(3)),
      backup: m(C0, row(4)),
    },
  },
};

/* ================= 05 Cloud: the network ================= */

const CLOUD: Scene = {
  id: "cloud",
  label: "AWS network map",
  tryThis: "Play Zone failure: the app survives because nothing important lives in only one zone.",
  nodes: [
    { id: "user", title: "Visitor", sub: "any network", tag: "internet", what: "Reaches the app only through Cloudflare.", points: ["Never sees the origin's address"] },
    { id: "cf", title: "Cloudflare", sub: "DNS, WAF, CDN", tag: "edge", what: "Proxied DNS, WAF, DDoS protection and caching in front of the origin.", points: ["Full (strict) TLS to the load balancer", "For per-tenant subdomains: the Cloudflare API + Certbot, the way STRUX does it"] },
    { id: "alb", title: "ALB", sub: "public, :443", tag: "public", what: "Terminates TLS with a free ACM certificate, routes /, /api and /ws to their ECS services across both zones, and health-checks every task.", points: ["Accepts :443 from Cloudflare's ranges only", "Unhealthy tasks leave rotation in seconds"] },
    { id: "nat", title: "NAT gateway", short: "NAT", sub: "egress only", tag: "public", what: "The only way out to the internet for private instances.", points: ["Fixed egress IP for partners' allow-lists", "S3 traffic skips it through a free endpoint, which keeps the NAT bill small"] },
    { id: "ec2a", title: "ECS · AZ a", sub: "Graviton, Docker", tag: "private", what: "ECS tasks on Graviton EC2 instances: web, API, gateway and workers, each app with a small Nginx container in front.", points: ["Baseline on Savings Plan instances; bursts and workers on Spot", "No public IP; port 22 closed"] },
    { id: "ec2b", title: "ECS · AZ b", sub: "Graviton, Docker", tag: "private", what: "The same services spread across a second availability zone.", points: ["Either zone can carry all traffic alone for a while", "Capacity is re-added in the healthy zone automatically"] },
    { id: "data", title: "Data tier", sub: "Postgres, Valkey", tag: "isolated", what: "Isolated subnets with no route to the internet at all.", points: ["Postgres :5432 and Valkey :6379 accept app tasks only", "Multi-AZ Postgres with automatic failover"] },
    { id: "ext", title: "3rd-party APIs", short: "3rd party", sub: "payments, email", tag: "internet", what: "Payment, email and messaging providers, called from private instances.", points: ["Timeouts and jittered retries on every call"] },
    { id: "s3", title: "S3", sub: "gateway endpoint", tag: "aws", what: "Reached through a VPC gateway endpoint: never over the internet, no NAT charges.", points: ["Bucket policy allows only this VPC's endpoint"] },
  ],
  edges: [
    { a: "user", b: "cf", label: "HTTPS" },
    { a: "cf", b: "alb", label: ":443" },
    { a: "alb", b: "ec2a" },
    { a: "alb", b: "ec2b" },
    { a: "ec2a", b: "data" },
    { a: "ec2b", b: "data" },
    { a: "ec2b", b: "nat", label: "egress" },
    { a: "nat", b: "ext" },
    { a: "ec2b", b: "s3", label: "endpoint" },
  ],
  flows: [
    {
      id: "in",
      name: "Inbound request",
      summary: "From the internet to the data tier, one allowed hop at a time.",
      steps: [
        { from: "user", to: "cf", text: "DNS resolves to Cloudflare; WAF and cache run first.", ms: 30 },
        { from: "cf", to: "alb", text: "Only Cloudflare's IP ranges may reach :443.", ms: 35 },
        { from: "alb", to: "ec2a", text: "/api is routed to a healthy API task in AZ a.", ms: 1 },
        { at: "ec2a", text: "The task's Nginx container adds a request id and passes it to the Go app." },
        { from: "ec2a", to: "data", text: "Postgres only accepts connections from the app's security group.", ms: 5 },
      ],
    },
    {
      id: "az",
      name: "Zone failure",
      summary: "A whole availability zone goes dark; users barely notice.",
      steps: [
        { at: "ec2a", text: "AZ a fails; its health checks start failing." },
        { from: "alb", to: "ec2b", text: "Within seconds, all traffic goes to AZ b, and ECS adds tasks and instances there." },
        { at: "data", text: "Multi-AZ Postgres promotes its standby automatically." },
        { from: "ec2b", to: "data", text: "The app reconnects; writes may fail for a minute or two during failover." },
      ],
    },
    {
      id: "out",
      name: "Outbound call",
      summary: "Private instances reach providers without being reachable themselves.",
      steps: [
        { from: "ec2b", to: "nat", text: "The only route out is through NAT." },
        { from: "nat", to: "ext", text: "Payment or email API, from a fixed IP the provider can allow-list." },
      ],
    },
    {
      id: "s3",
      name: "S3 upload",
      summary: "AWS traffic stays inside AWS.",
      steps: [{ from: "ec2b", to: "s3", text: "Through the free gateway endpoint: no internet, no NAT bill." }],
    },
    {
      id: "spike",
      name: "Traffic spike",
      summary: "Traffic triples; capacity follows, cheapest first.",
      steps: [
        { at: "cf", text: "Cached pages and files are served at the edge; most of the spike stops here." },
        { from: "alb", to: "ec2a", text: "Requests per task climb past the target." },
        { at: "ec2a", text: "ECS adds tasks within about a minute; new instances come from Spot first." },
        { from: "alb", to: "ec2b", text: "New tasks in both zones join the load balancer." },
        { at: "data", text: "RDS Proxy keeps database connections flat; when traffic falls, everything scales back in." },
      ],
    },
  ],
  wide: {
    W: 1104,
    H: 500,
    nodes: {
      user: n(16, 170),
      cf: n(244, 170),
      ext: n(244, 330),
      alb: n(472, 170),
      nat: n(472, 330),
      ec2a: n(700, 90),
      ec2b: n(700, 250),
      data: n(928, 170),
      s3: n(928, 420),
    },
    zones: [{ x: 452, y: 60, w: 648, h: 344, style: "dashed" }],
    labels: [
      { x: 468, y: 80, text: "VPC 10.0.0.0/16" },
      { x: 552, y: 160, text: "public", anchor: "middle" },
      { x: 780, y: 80, text: "private · 2 AZs", anchor: "middle" },
      { x: 1008, y: 160, text: "isolated", anchor: "middle" },
      { x: 96, y: 160, text: "internet", anchor: "middle" },
    ],
    edgeLabels: true,
  },
  narrow: {
    W: 360,
    H: 588,
    nodes: {
      user: m(MID, row(0), 150),
      cf: m(C0, row(1)),
      ext: m(C2, row(1)),
      alb: m(C0, row(2)),
      nat: m(C2, row(2)),
      ec2a: m(C0, row(3)),
      ec2b: m(C2, row(3)),
      data: m(C1, row(4)),
      s3: m(C2, row(5)),
    },
    zones: [{ x: 4, y: 204, w: 352, h: 280, style: "dashed" }],
    labels: [{ x: 14, y: 478, text: "VPC" }],
  },
};

/* ================= 06 DevOps: from merge to production ================= */

const DEVOPS: Scene = {
  id: "devops",
  label: "Release pipeline map",
  tryThis: "Play Auto rollback: only the 10% of users on the canary ever see the bad version.",
  nodes: [
    { id: "dev", title: "Merge", sub: "PR to main", tag: "git", what: "A reviewed pull request merges to main.", points: ["Required checks and one review", "Feature flags hide unfinished work"] },
    { id: "sec", title: "Security", sub: "secrets, CodeQL", tag: "ci", what: "Security checks run on every pull request, before anything is built.", points: ["Secret scanning with push protection", "CodeQL and Dependabot", "Terraform changes get a plan and a policy scan"] },
    { id: "tests", title: "Tests", sub: "race, e2e", tag: "ci", what: "Go tests with the race detector against a real Postgres container, a migration check, then Playwright end to end.", points: ["k6 load tests against staging before big releases"] },
    { id: "build", title: "Build & sign", short: "Build", sub: "Trivy, cosign", tag: "ci", what: "One image per commit: scanned by Trivy, signed with cosign, shipped with an SBOM.", points: ["Built once, promoted unchanged through every environment"] },
    { id: "ecr", title: "ECR", sub: "image :sha", tag: "registry", what: "Every image is tagged with its git SHA and kept for rollback.", points: ["Scan on push; only signed images may deploy"] },
    { id: "oidc", title: "OIDC → IAM", short: "OIDC", sub: "deploy role", tag: "auth", what: "The deploy job swaps a GitHub OIDC token for short-lived AWS credentials.", points: ["Only this repo's protected environment can assume the role", "No stored keys anywhere"] },
    { id: "deploy", title: "ECS deploy", sub: "canary 10%", tag: "deploy", what: "Starts new tasks beside the old ones, waits for health checks, sends 10% of traffic for 10 minutes, then everyone.", points: ["Automatic rollback on CloudWatch alarms", "No SSH, ever"] },
    { id: "green", title: "New tasks", short: "New", sub: "new :sha", tag: "tasks", what: "The new version, started beside the old one on the same cluster: no extra fleet to pay for.", points: ["Secrets fetched at start, never baked into the image", "Must pass health checks before any traffic"] },
    { id: "blue", title: "Old tasks", short: "Old", sub: "current", tag: "tasks", what: "The current version keeps serving 90% of traffic during the canary, ready to take it all back.", points: ["Stopped once the canary has been healthy for 10 minutes"] },
    { id: "alb", title: "ALB", sub: "weighted shift", tag: "traffic", what: "Splits traffic by weight between old and new tasks without dropping connections.", points: ["10% → 100%, with connection draining"] },
    { id: "watch", title: "Alarms · Grafana", short: "Monitoring", sub: "10-min watch", tag: "observe", what: "Error rate and p95 for the new version, watched through the canary.", points: ["A breach triggers the automatic rollback"] },
    { id: "slack", title: "Slack", sub: "deploy channel", tag: "notify", what: "Start, success, failure and rollback all land in one channel.", points: ["With the SHA and a link to the run"] },
  ],
  edges: [
    { a: "dev", b: "sec" },
    { a: "sec", b: "tests" },
    { a: "tests", b: "build" },
    { a: "build", b: "ecr" },
    { a: "ecr", b: "oidc" },
    { a: "oidc", b: "deploy" },
    { a: "deploy", b: "green" },
    { a: "alb", b: "green" },
    { a: "alb", b: "blue" },
    { a: "alb", b: "watch" },
    { a: "watch", b: "slack" },
  ],
  flows: [
    {
      id: "release",
      name: "Release",
      summary: "Merge to live in one path: 10% of users first, no SSH, no stored keys.",
      steps: [
        { from: "dev", to: "sec", text: "Merged to main." },
        { from: "sec", to: "tests", text: "No leaked secrets, no CodeQL alerts, dependencies clean." },
        { from: "tests", to: "build", text: "go test -race, the migration check and Playwright pass." },
        { from: "build", to: "ecr", text: "Image :a1b2c3d scanned, signed and pushed with its SBOM." },
        { from: "ecr", to: "oidc", text: "The deploy job gets a GitHub OIDC token." },
        { from: "oidc", to: "deploy", text: "Assumes the deploy role; starts a canary deployment." },
        { from: "deploy", to: "green", text: "New tasks start beside the old ones on the same cluster." },
        { at: "green", text: "They pass the load balancer's health checks." },
        { from: "alb", to: "green", text: "10% of traffic goes to the new tasks." },
        { from: "alb", to: "watch", text: "Error rate and p95 watched for 10 minutes." },
        { at: "blue", text: "All clear: everyone moves to the new version and the old tasks stop." },
        { from: "watch", to: "slack", text: "a1b2c3d is live." },
      ],
    },
    {
      id: "blocked",
      name: "Blocked PR",
      summary: "A secret in a diff never gets built.",
      steps: [
        { from: "dev", to: "sec", text: "A PR adds a config file." },
        { at: "sec", text: "Secret scanning flags an access key in the diff." },
        { at: "dev", text: "The merge is blocked; nothing builds, nothing deploys. The key is rotated anyway." },
      ],
    },
    {
      id: "unhealthy",
      name: "Failed health check",
      summary: "A broken build never takes traffic.",
      steps: [
        { from: "deploy", to: "green", text: "New tasks start with the new image." },
        { at: "green", text: "Health checks keep failing (bad config)." },
        { at: "deploy", text: "The deployment stops; no traffic ever reached the new tasks." },
        { at: "blue", text: "The old tasks kept serving the whole time. Users saw nothing." },
        { at: "slack", text: "Deploy failed, with a link to the logs." },
      ],
    },
    {
      id: "rollback",
      name: "Auto rollback",
      summary: "Healthy at start, bad under real traffic: undone automatically.",
      steps: [
        { from: "alb", to: "green", text: "10% of traffic goes to c4d91e2." },
        { from: "alb", to: "watch", text: "5xx on the canary climbs to 4.2%, over the 1% SLO." },
        { at: "deploy", text: "The alarm triggers the automatic rollback." },
        { from: "alb", to: "blue", text: "All traffic back on the old tasks within a minute. Only 10% of users ever saw it." },
        { from: "watch", to: "slack", text: "Rollback done; incident opened." },
      ],
    },
    {
      id: "infra",
      name: "Infra change",
      summary: "Infrastructure changes are reviewed like code.",
      steps: [
        { from: "dev", to: "sec", text: "A PR changes Terraform." },
        { at: "sec", text: "terraform plan and a policy scan are posted on the PR for review." },
        { at: "oidc", text: "On merge, apply runs with its own OIDC role; state lives in S3 with locking." },
        { at: "slack", text: "Applied, with the plan linked." },
      ],
    },
  ],
  wide: {
    W: 1104,
    H: 356,
    nodes: {
      dev: n(col(0), 24),
      sec: n(col(1), 24),
      tests: n(col(2), 24),
      build: n(col(3), 24),
      ecr: n(col(4), 24),
      slack: n(col(0), 150),
      watch: n(col(1), 150),
      alb: n(col(2), 150),
      deploy: n(col(3), 150),
      oidc: n(col(4), 150),
      blue: n(col(1), 276),
      green: n(col(3), 276),
    },
  },
  narrow: {
    W: 360,
    H: 388,
    nodes: {
      dev: m(C0, row(0)),
      sec: m(C1, row(0)),
      tests: m(C2, row(0)),
      oidc: m(C0, row(1)),
      ecr: m(C1, row(1)),
      build: m(C2, row(1)),
      deploy: m(C0, row(2)),
      alb: m(C1, row(2)),
      watch: m(C2, row(2)),
      green: m(C0, row(3)),
      blue: m(C1, row(3)),
      slack: m(C2, row(3)),
    },
  },
};

/* ================= 07 Security: what stops each attack ================= */

const sx = (c: number) => 16 + c * 181;
const SN = (c: number, y: number) => n(sx(c), y, 152, 64);
const SL = (r: number) => m(12, 16 + r * 84, 150, 52);
const SR = (r: number) => m(210, 16 + r * 84, 138, 52);

const SECURITY: Scene = {
  id: "security",
  label: "Security map",
  tryThis: "Play SQL injection: two separate layers stop it, so one mistake on its own is not enough.",
  nodes: [
    { id: "attacker", title: "Attacker", sub: "bots, people", tag: "threat", tone: "warn", what: "Floods, guesses passwords, injects input, probes other tenants' data, tries stolen keys.", points: ["Each flow shows which layer stops it"] },
    { id: "cf", title: "Cloudflare", sub: "WAF, DDoS, bots", tag: "layer 1", what: "Absorbs volume and obvious abuse before it reaches the origin.", points: ["Managed WAF rules and bot scores", "The load balancer accepts Cloudflare's ranges only"] },
    { id: "nginx", title: "Nginx", sub: "rate limits", tag: "layer 2", what: "Per-IP rate-limit zones, stricter on auth endpoints, plus request size and slow-client timeouts.", points: ["/api/auth: 5 requests a minute per IP", "Real client IP taken from Cloudflare's header only"] },
    { id: "auth", title: "Auth · RBAC", sub: "session, roles", tag: "layer 3", what: "Who is this, and may they touch this exact resource?", points: ["Slow password hashing, lockout after repeated failures", "Tenant from the session; ownership checked per resource"] },
    { id: "valid", title: "Validation", sub: "typed, bound", tag: "layer 4", what: "Input decodes into typed structs; every SQL value is sent as a bound parameter by sqlc.", points: ["No string-built SQL anywhere"] },
    { id: "db", title: "Postgres", sub: "least privilege", tag: "layer 5", what: "The app's database role can read and write rows, nothing more; row-level security scopes it to one tenant.", points: ["No DROP, ALTER or GRANT", "Encrypted at rest and in transit"] },
    { id: "iam", title: "IAM · OIDC", sub: "no static keys", tag: "identity", what: "Separate AWS accounts per environment; roles everywhere; CI gets minutes-long credentials through GitHub OIDC; people sign in through SSO.", points: ["The deploy role trusts one repo's protected environment only", "GuardDuty and CloudTrail watch every account"] },
    { id: "ci", title: "CI security", sub: "secret scanning", tag: "supply chain", what: "Secrets, vulnerable code and vulnerable dependencies are caught before merge; only signed images deploy.", points: ["Actions pinned to commit SHAs", "cosign signatures checked at deploy"] },
    { id: "secrets", title: "Secrets Manager", short: "Secrets", sub: "runtime only", tag: "secrets", what: "Secrets per environment, encrypted with KMS, fetched at runtime and rotated automatically where possible.", points: ["Never in git, never in an image"] },
    { id: "obs", title: "OTel · Grafana", sub: "logs, traces", tag: "detect", what: "Every request logged and traced with its id, user and route; failed sign-ins and odd patterns are searchable.", points: ["OpenTelemetry collector into Loki, Prometheus and Tempo"] },
    { id: "slack", title: "Slack alerts", short: "Alerts", sub: "with runbooks", tag: "respond", what: "Alerts on spikes and SLO burn, each with a runbook link.", points: ["Paging only for what users feel"] },
  ],
  edges: [
    { a: "attacker", b: "cf" },
    { a: "cf", b: "nginx" },
    { a: "nginx", b: "auth" },
    { a: "auth", b: "valid" },
    { a: "valid", b: "db" },
    { a: "attacker", b: "iam" },
    { a: "auth", b: "obs", label: "logs" },
    { a: "obs", b: "slack", label: "alerts" },
    { a: "secrets", b: "db", label: "creds" },
  ],
  flows: [
    {
      id: "ddos",
      name: "DDoS",
      summary: "Volume is absorbed at the edge.",
      steps: [
        { from: "attacker", to: "cf", text: "A million requests a minute from a botnet." },
        { at: "cf", text: "Absorbed by Cloudflare's network and rate rules. The origin never sees it." },
      ],
    },
    {
      id: "stuffing",
      name: "Credential stuffing",
      summary: "Slow and distributed, so it takes several layers.",
      steps: [
        { from: "attacker", to: "cf", text: "Leaked passwords tried slowly from many IPs." },
        { from: "cf", to: "nginx", text: "Bot scores catch some; the rest look human." },
        { at: "nginx", text: "/api/auth allows 5 attempts a minute per IP; the rest get 429." },
        { from: "nginx", to: "auth", text: "What gets through meets slow password hashing and per-account lockout." },
        { from: "auth", to: "obs", text: "Failed sign-ins are logged with request ids and IPs." },
        { from: "obs", to: "slack", text: "Alert: sign-in failures 10× above baseline." },
      ],
    },
    {
      id: "sqli",
      name: "SQL injection",
      summary: "Input is data, never code.",
      steps: [
        { from: "attacker", to: "cf", text: "name = \"x'); DROP TABLE projects; --\"" },
        { from: "cf", to: "nginx", text: "Signed in as a real user, so it passes the edge." },
        { from: "nginx", to: "auth", text: "Valid session and role." },
        { from: "auth", to: "valid", text: "It's a valid string under 80 characters." },
        { from: "valid", to: "db", text: "Sent as a bound parameter: stored as text, never executed." },
        { at: "db", text: "And the app's role has no DROP permission anyway." },
      ],
    },
    {
      id: "idor",
      name: "Other tenant's data",
      summary: "Guessing ids gets you nothing.",
      steps: [
        { from: "attacker", to: "cf", text: "GET /v1/projects/<another org's id>." },
        { from: "cf", to: "nginx", text: "Looks like normal traffic." },
        { from: "nginx", to: "auth", text: "Valid session, wrong tenant." },
        { at: "auth", text: "Ownership check fails → 404, so the id isn't even confirmed to exist." },
        { at: "db", text: "Row-level security would have hidden the row anyway." },
      ],
    },
    {
      id: "keys",
      name: "Stolen keys",
      summary: "There are no long-lived keys to steal.",
      steps: [
        { from: "attacker", to: "iam", text: "Tries cloud keys from an old laptop or a leaked CI log." },
        { at: "iam", text: "There are none: CI gets minutes-long OIDC credentials bound to one repo and environment, and people sign in through SSO." },
        { at: "ci", text: "And secret scanning blocks keys from reaching git at all." },
        { at: "secrets", text: "Runtime secrets rotate; every access is audited." },
      ],
    },
  ],
  wide: {
    W: 1090,
    H: 356,
    nodes: {
      iam: SN(1, 24),
      ci: SN(3, 24),
      secrets: SN(5, 24),
      attacker: SN(0, 150),
      cf: SN(1, 150),
      nginx: SN(2, 150),
      auth: SN(3, 150),
      valid: SN(4, 150),
      db: SN(5, 150),
      obs: SN(3, 276),
      slack: SN(4, 276),
    },
  },
  narrow: {
    W: 360,
    H: 504,
    nodes: {
      attacker: SL(0),
      cf: SL(1),
      nginx: SL(2),
      auth: SL(3),
      valid: SL(4),
      db: SL(5),
      iam: SR(0),
      ci: SR(1),
      obs: SR(3),
      slack: SR(4),
      secrets: SR(5),
    },
  },
};

export const SCENES: Record<string, Scene> = {
  architecture: ARCH,
  frontend: FRONTEND,
  backend: BACKEND,
  data: DATA,
  cloud: CLOUD,
  devops: DEVOPS,
  security: SECURITY,
};

export const FLOW_COUNT = Object.values(SCENES).reduce((t, s) => t + s.flows.length, 0);
