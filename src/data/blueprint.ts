// Blueprint: how I'd build and run a production full-stack app for about
// 1M monthly active users, as cheaply as it can be done without cutting
// corners on speed or safety. A vendor-neutral reference design, not a copy
// of any one product or employer. Load figures, budgets and SLOs are design
// targets, not measurements. The interactive maps live in scenes.ts.

export type NodeId =
  | "client"
  | "edge"
  | "proxy"
  | "web"
  | "api"
  | "ws"
  | "worker"
  | "redis"
  | "db"
  | "replica"
  | "s3"
  | "ci"
  | "iam"
  | "obs";

export type PartId =
  | "requirements"
  | "architecture"
  | "frontend"
  | "backend"
  | "data"
  | "cloud"
  | "devops"
  | "security"
  | "scaling"
  | "decisions"
  | "glossary";

export type BpNode = {
  id: NodeId;
  title: string;
  short?: string; // narrow layouts
  sub: string;
  tag: "client" | "edge" | "app" | "data" | "ops";
  part: PartId;
  what: string;
  points: string[];
  tradeoff?: string;
};

export const NODES: BpNode[] = [
  {
    id: "client",
    title: "Clients",
    sub: "Browser, RN app",
    tag: "client",
    part: "frontend",
    what: "Next.js in the browser and a React Native app share one typed API client, one auth flow and one error shape.",
    points: [
      "Web session in an httpOnly, Secure, SameSite=Lax cookie; mobile keeps a rotating refresh token in secure storage",
      "Optimistic UI for writes, rolled back on error",
      "The app checks a minimum supported version and prompts an update when the API contract moves",
    ],
    tradeoff: "One shared client means a breaking API change breaks both apps at once, so the API is versioned (/v1) and changes are additive.",
  },
  {
    id: "edge",
    title: "Edge / CDN",
    sub: "Cloudflare, WAF",
    tag: "edge",
    part: "cloud",
    what: "DNS, TLS, WAF and caching at the edge. Most page views and every static file are answered here, which is the single biggest saving in the design.",
    points: [
      "Static and ISR pages, scripts, styles and images served from cache: most requests never reach AWS",
      "Proxied DNS hides the origin; the load balancer only accepts Cloudflare's IP ranges",
      "WAF, bot and rate rules at the edge instead of a paid AWS WAF",
    ],
    tradeoff: "Another vendor in the request path. Worth it: it takes most of the traffic and the data-transfer bill off AWS.",
  },
  {
    id: "proxy",
    title: "ALB · Nginx",
    sub: "TLS, routing",
    tag: "edge",
    part: "cloud",
    what: "The load balancer terminates TLS and spreads traffic across both zones; Nginx runs as a small container in front of every app task.",
    points: [
      "The load balancer routes /, /api and /ws to their services",
      "Nginx in each task adds request ids, compression, per-IP rate limits and WebSocket upgrades",
      "Health checks pull a bad task out of rotation in seconds",
    ],
    tradeoff: "Nginx in every task costs a few MB of memory each; in return, limits and headers live next to the app and behave the same on a laptop and in production.",
  },
  {
    id: "web",
    title: "Next.js web",
    sub: "Pages Router",
    tag: "app",
    part: "frontend",
    what: "The Next.js Pages Router: each page picks its data function, so rendering is decided page by page and is visible at a glance.",
    points: [
      "getStaticProps for static and ISR pages, getServerSideProps for signed-in pages, client fetches for live views",
      "Because most pages are cached at the edge, a few small tasks serve it all",
      "Scales on requests per task",
    ],
    tradeoff: "A Node server to run instead of static files on a CDN. Static export would be cheaper still, but signed-in pages and ISR need a server.",
  },
  {
    id: "api",
    title: "API service",
    sub: "Go, sqlc, pgx",
    tag: "app",
    part: "backend",
    what: "A Go modular monolith on net/http: packages (auth, orgs, projects, billing) that own their routes, services and tables. SQL is hand-written and type-checked by sqlc.",
    points: [
      "Cheap-first middleware: request id → rate limit → auth → RBAC → validation → handler",
      "Small memory footprint, so a handful of tasks covers peak traffic",
      "Graceful shutdown on SIGTERM: stop accepting, finish in-flight requests, exit",
    ],
    tradeoff: "A monolith scales as one unit. That's fine until one module needs different scaling or a different team; real-time and jobs already run separately for that reason.",
  },
  {
    id: "ws",
    title: "Realtime gateway",
    short: "Realtime",
    sub: "Go, WebSockets",
    tag: "app",
    part: "backend",
    what: "A small Go service that holds WebSocket connections: checks the session on connect, joins rooms and pushes events.",
    points: [
      "Rooms per resource; permission checked before join",
      "Redis pub/sub, so an event published anywhere reaches every socket",
      "Go holds thousands of idle sockets per task, so two tasks cover peak",
    ],
    tradeoff: "Rooms and reconnect handling are written by hand instead of coming from Socket.IO; in exchange, one language across the backend and no extra runtime.",
  },
  {
    id: "worker",
    title: "Workers",
    sub: "Go, River jobs",
    tag: "app",
    part: "backend",
    what: "River workers: background jobs stored in Postgres, so a job is queued in the same transaction as the write that caused it.",
    points: [
      "Emails, push notifications, PDFs, imports, webhooks and scheduled work",
      "Runs on Spot capacity: if an instance is reclaimed, its jobs are simply retried",
      "Unique jobs, retries with backoff, and an alert when a job finally fails",
    ],
    tradeoff: "Job throughput is bounded by Postgres: thousands a second, far beyond a million a day. Past that, high-volume fan-out moves to SQS.",
  },
  {
    id: "redis",
    title: "Redis",
    sub: "cache, pub/sub",
    tag: "data",
    part: "data",
    what: "Valkey on ElastiCache: cache-aside reads, pub/sub for the realtime gateway, and shared rate-limit counters. One primary and one replica is plenty at this size.",
    points: [
      "Short TTLs with jitter, plus explicit invalidation on writes",
      "Nothing in Redis is the only copy of anything",
      "Valkey: same protocol as Redis, cheaper on ElastiCache",
    ],
    tradeoff: "One more stateful service, but losing it only costs speed, never data.",
  },
  {
    id: "db",
    title: "PostgreSQL",
    sub: "RDS, Multi-AZ",
    tag: "data",
    part: "data",
    what: "The source of truth: relational core, foreign keys and transactions, JSONB for flexible settings, and the job queue.",
    points: [
      "RDS Multi-AZ on Graviton with gp3 storage; point-in-time recovery",
      "RDS Proxy keeps connection counts flat as tasks scale",
      "Big append-only tables (audit, events) partitioned by month; old partitions archived to S3",
    ],
    tradeoff: "Failover takes a minute or two rather than Aurora's ~30 seconds, at a noticeably lower bill. Aurora is the next step if that matters.",
  },
  {
    id: "replica",
    title: "Read replica",
    short: "Replica",
    sub: "reads, search",
    tag: "data",
    part: "data",
    what: "Takes search, reports and exports, so the primary stays fast for writes, and search needs no cluster of its own.",
    points: ["Full-text and trigram search run here", "Replication lag is monitored; never used where a user must read their own write"],
    tradeoff: "Replicas trail the primary by milliseconds to seconds, so only paths that tolerate slightly stale data use them.",
  },
  {
    id: "s3",
    title: "Object storage",
    short: "S3",
    sub: "S3, signed uploads",
    tag: "data",
    part: "data",
    what: "Uploads and generated files. Browsers upload straight to S3 with a short-lived signed policy; public media is cached by Cloudflare.",
    points: [
      "Bytes never pass through the app servers",
      "Intelligent-Tiering moves cold files to cheaper storage automatically",
      "Block public access; tenant-prefixed random keys; versioning on",
    ],
    tradeoff: "Direct uploads mean validating after the fact: size and type are bound into the signature, and content is scanned by a job.",
  },
  {
    id: "ci",
    title: "CI/CD",
    sub: "GitHub Actions",
    tag: "ops",
    part: "devops",
    what: "Every change takes the same path: checks, one signed image, a canary release, a watch window, and an automatic way back.",
    points: [
      "Secret scanning, CodeQL, Dependabot and a Trivy image scan on every PR",
      "Canary releases: 10% of traffic first, everyone after 10 healthy minutes",
      "Terraform plan on every PR, apply on merge",
    ],
    tradeoff: "A slower pipeline in exchange for never deploying something that hasn't been checked.",
  },
  {
    id: "iam",
    title: "IAM & secrets",
    short: "IAM",
    sub: "roles, OIDC, secrets",
    tag: "ops",
    part: "security",
    what: "Separate AWS accounts per environment, roles instead of users, and secrets fetched at runtime from AWS Secrets Manager.",
    points: [
      "CI and Terraform assume roles through GitHub OIDC; no stored cloud keys",
      "People sign in through SSO; no IAM users",
      "No SSH: shell access through SSM Session Manager, logged",
    ],
    tradeoff: "Tight policies take longer to write and debug; the payoff is that one leaked credential can't touch everything.",
  },
  {
    id: "obs",
    title: "Observability",
    short: "Monitoring",
    sub: "OpenTelemetry, Grafana",
    tag: "ops",
    part: "security",
    what: "OpenTelemetry in every service sends logs, metrics and traces to managed Grafana, with sampling so the bill doesn't grow with traffic.",
    points: [
      "Every error and slow request is traced; a sample of the rest",
      "Dashboards: rate, errors, duration, queue depth, DB connections",
      "Alerts on SLO burn rate to Slack, each with a runbook",
    ],
    tradeoff: "Sampling means not every healthy request is kept. Errors and slow requests always are, which is what you debug with.",
  },
];

export const nodeById = (id: NodeId) => NODES.find((n) => n.id === id)!;

/** Request-path connections (undirected for highlighting). */
export const EDGES: { a: NodeId; b: NodeId; label?: string }[] = [
  { a: "client", b: "edge", label: "HTTPS" },
  { a: "edge", b: "proxy", label: "origin" },
  { a: "proxy", b: "web", label: "/" },
  { a: "proxy", b: "api", label: "/api" },
  { a: "proxy", b: "ws", label: "/ws" },
  { a: "web", b: "api", label: "fetch" },
  { a: "api", b: "replica", label: "reads" },
  { a: "api", b: "redis", label: "cache" },
  { a: "api", b: "db", label: "SQL" },
  { a: "ws", b: "redis" },
  { a: "worker", b: "db", label: "jobs" },
  { a: "worker", b: "s3", label: "files" },
];

/** Control plane: acts on the whole VPC rather than one node. */
export const CONTROL: { id: NodeId; label: string; dir: "down" | "up" }[] = [
  { id: "ci", label: "deploy", dir: "down" },
  { id: "iam", label: "assume role", dir: "down" },
  { id: "obs", label: "telemetry", dir: "up" },
];

export type Step = { from?: NodeId; to?: NodeId; at?: NodeId; text: string; ms?: number };
export type Flow = { id: string; name: string; summary: string; steps: Step[] };

export const FLOWS: Flow[] = [
  {
    id: "page",
    name: "Page load",
    summary: "A signed-in page on a cold cache: edge, load balancer, server render, one indexed query.",
    steps: [
      { from: "client", to: "edge", text: "DNS answers with Cloudflare; TLS 1.3 handshake at the nearest edge.", ms: 30 },
      { at: "edge", text: "Scripts, styles and images come from the edge cache. This HTML is per-user, so it misses." },
      { from: "edge", to: "proxy", text: "Forwarded to the load balancer over HTTPS (Full strict).", ms: 35 },
      { from: "proxy", to: "web", text: "Routed to a Next.js task; its Nginx container passes it on.", ms: 2 },
      { from: "web", to: "api", text: "getServerSideProps calls the API on the private network, forwarding the session cookie.", ms: 6 },
      { from: "api", to: "db", text: "Session checked, then one indexed query.", ms: 12 },
      { at: "web", text: "The page renders to HTML on the server and goes back in one response.", ms: 40 },
      { at: "client", text: "The page hydrates; heavy widgets load later through next/dynamic. Budget: about 125 ms to first byte." },
    ],
  },
  {
    id: "write",
    name: "API write",
    summary: "POST /v1/projects: rejected early if it will fail, committed together with its follow-up job if not.",
    steps: [
      { from: "client", to: "edge", text: "fetch() with the httpOnly session cookie; the UI updates optimistically.", ms: 30 },
      { from: "edge", to: "proxy", text: "WAF and rate rules at the edge, then to the load balancer.", ms: 35 },
      { from: "proxy", to: "api", text: "Nginx adds X-Request-Id and applies the per-IP limit.", ms: 2 },
      { at: "api", text: "Middleware: auth → RBAC (project:create) → validation.", ms: 3 },
      { from: "api", to: "db", text: "INSERT the project and enqueue its welcome job in one transaction.", ms: 15 },
      { from: "api", to: "redis", text: "Invalidate the org's cached project list.", ms: 2 },
      { at: "client", text: "201 Created; the optimistic row is confirmed." },
    ],
  },
  {
    id: "live",
    name: "Live event",
    summary: "A background job finishes and every open tab watching that project updates.",
    steps: [
      { from: "client", to: "edge", text: "WebSocket upgrade to wss:// (Cloudflare proxies WebSockets)." },
      { from: "edge", to: "proxy", text: "Through the edge to the load balancer." },
      { from: "proxy", to: "ws", text: "Routed to a gateway task; Nginx upgrades the connection." },
      { at: "ws", text: "Session checked on connect; the socket joins room project:42 after an access check." },
      { from: "worker", to: "redis", text: "Elsewhere, a worker finishes and publishes deploy:status to a Redis channel." },
      { from: "redis", to: "ws", text: "Every gateway task is subscribed, so each one receives it." },
      { from: "ws", to: "proxy", text: "Each task pushes it down the open sockets in that room." },
      { from: "proxy", to: "edge", text: "Down the open connection, no polling." },
      { from: "edge", to: "client", text: "The UI updates under 100 ms after the job finished." },
    ],
  },
  {
    id: "search",
    name: "Search",
    summary: "Type-ahead search on the read replica: no search cluster to pay for.",
    steps: [
      { from: "client", to: "edge", text: "Debounced keystroke: GET /v1/search?q=goa.", ms: 30 },
      { from: "edge", to: "proxy", text: "To the load balancer; search has its own rate-limit zone.", ms: 35 },
      { from: "proxy", to: "api", text: "Routed to an API task.", ms: 2 },
      { from: "api", to: "replica", text: "Full-text plus trigram query on GIN indexes, on the replica; typos still match.", ms: 15 },
      { at: "api", text: "Hot prefixes are cached in Redis for a minute." },
      { at: "client", text: "Suggestions render as you type." },
    ],
  },
  {
    id: "upload",
    name: "File upload",
    summary: "Large files go straight to S3; the API only signs the request.",
    steps: [
      { from: "client", to: "edge", text: "Ask for an upload slot: name, type and size." },
      { from: "edge", to: "proxy", text: "To the load balancer." },
      { from: "proxy", to: "api", text: "Routed to an API task." },
      { at: "api", text: "Checks quota and type, then signs a POST policy locally: 5-minute expiry, exact type, size ≤ 10 MB. No call to S3 needed." },
      { at: "s3", text: "The browser uploads directly to S3. The bytes never touch an app server." },
      { from: "api", to: "db", text: "The browser confirms; the API records the file and enqueues a scan job in one transaction." },
      { from: "db", to: "worker", text: "A worker claims the job and scans the file." },
      { from: "worker", to: "s3", text: "Thumbnails written back to S3." },
      { at: "db", text: "The file is marked ready; the UI is told over the socket." },
    ],
  },
  {
    id: "job",
    name: "Background job",
    summary: "Slow work leaves the request path and retries safely, on cheap Spot capacity.",
    steps: [
      { from: "api", to: "db", text: "Enqueue report:generate in the same transaction as the request that needs it, unique by report id." },
      { from: "db", to: "worker", text: "A worker on a Spot instance claims the job." },
      { at: "worker", text: "Already done? Return. Otherwise render the PDF." },
      { from: "worker", to: "s3", text: "Upload the PDF to S3." },
      { at: "db", text: "The job completes in the same transaction that marks the report done." },
      { at: "obs", text: "If the Spot instance had been reclaimed mid-job, the job would simply have been retried elsewhere." },
    ],
  },
  {
    id: "spike",
    name: "Traffic spike",
    summary: "A launch or a viral post triples traffic; capacity follows, then shrinks back.",
    steps: [
      { at: "edge", text: "Anonymous and static traffic is absorbed by the edge cache: most of the spike never reaches AWS." },
      { at: "proxy", text: "Requests per task climb past the target." },
      { at: "api", text: "ECS adds API and web tasks within about a minute; the capacity provider adds instances, Spot first." },
      { at: "db", text: "RDS Proxy keeps database connections flat while tasks multiply; reads lean on Redis and the replica." },
      { at: "obs", text: "Latency stays inside the SLO. When traffic falls, tasks and instances scale back in." },
    ],
  },
  {
    id: "deploy",
    name: "Deploy",
    summary: "From merge to production, 10% of traffic first, with an automatic way back.",
    steps: [
      { at: "ci", text: "Merge to main: Go tests with -race, migration check, Playwright, CodeQL, secret scanning." },
      { at: "ci", text: "One image built, scanned by Trivy, signed with cosign and pushed to ECR with an SBOM." },
      { at: "iam", text: "The pipeline assumes a deploy role through GitHub OIDC. No stored keys, no SSH." },
      { at: "api", text: "ECS starts new tasks beside the old ones; they must pass health checks." },
      { at: "proxy", text: "Canary: 10% of traffic goes to the new tasks for 10 minutes, then everyone." },
      { at: "obs", text: "If errors or p95 breach the alarm during the canary, traffic goes straight back to the old tasks." },
    ],
  },
  {
    id: "region",
    name: "Region outage",
    summary: "The whole region goes down. A cheap standby plan brings it back elsewhere.",
    steps: [
      { at: "obs", text: "External uptime checks see the region fail; the incident runbook starts." },
      { at: "iam", text: "Terraform applies the same modules in the standby region; nothing there costs much until now." },
      { at: "db", text: "The database is restored from the latest cross-region backup copy: at most a few minutes of data lost." },
      { at: "s3", text: "Critical files were already replicated to the standby region." },
      { at: "edge", text: "Cloudflare DNS points at the new load balancer. Back within about two hours." },
    ],
  },
];

/* ---------------- Section content ---------------- */

// Every card teaches one idea: the concept in general, how this design
// applies it, and the mistake people usually make.
export type Item = { title: string; concept: string; here: string; watch: string; tags?: string[] };
export type Part = {
  id: PartId;
  index: string;
  title: string;
  kicker: string;
  intro: string;
  items: Item[];
};

export const PARTS: Part[] = [
  {
    id: "frontend",
    index: "03",
    title: "Frontend",
    kicker: "Next.js Pages Router · React · TypeScript",
    intro: "The frontend is everything the user's device runs. The design questions here: where each page gets built, how much code ships to the browser, and how the client talks to the backend.",
    items: [
      {
        title: "Rendering strategies",
        concept: "A page can be built ahead of time (static), rebuilt in the background (ISR), built on every request (SSR) or built in the browser (CSR). Earlier is cheaper and faster; later is fresher and more personal.",
        here: "Marketing pages are static, listings use ISR (rebuilt every 5 minutes or when they change), dashboards render per request, and live views render a shell and then subscribe for updates.",
        watch: "Rendering everything per request: you pay server time for pages that look the same to every visitor.",
        tags: ["SSG", "ISR", "SSR", "CSR"],
      },
      {
        title: "Code splitting",
        concept: "Each page should download only the code it needs, and heavy widgets should load only when they're used.",
        here: "The Next.js Pages Router splits code per page automatically; maps, editors and charts load through next/dynamic; each area (marketing, app, admin) has its own layout.",
        watch: "One giant bundle: every visitor downloads the admin panel just to read the pricing page.",
        tags: ["next/dynamic", "per-page bundles"],
      },
      {
        title: "State management",
        concept: "Separate three kinds of state: server data (from the API), URL state (filters, page number) and UI state (an open menu). Each has a natural home.",
        here: "Server data lives in a query cache keyed by resource, filters live in the URL so views can be shared, and UI state stays inside components.",
        watch: "Copying server data into a global store, then fighting to keep the copy fresh.",
        tags: ["query cache", "URL state"],
      },
      {
        title: "Talking to the API",
        concept: "Treat the network as unreliable: typed requests, one error shape, and retries only where repeating is safe.",
        here: "One client generated from the API's OpenAPI spec, automatic retries only for safe (idempotent) requests, and a single shared refresh when the session expires.",
        watch: "Blindly retrying a POST can create the same order twice.",
        tags: ["OpenAPI", "retries"],
      },
      {
        title: "Authentication",
        concept: "A session proves who the user is on every request. Where you store it decides how it can be stolen.",
        here: "An httpOnly, Secure, SameSite cookie that JavaScript can't read; middleware redirects signed-out users before a page runs; the mobile app keeps a rotating refresh token in secure storage.",
        watch: "Tokens in localStorage: any injected script can read and steal them.",
        tags: ["cookies", "sessions"],
      },
      {
        title: "Performance budgets",
        concept: "Set hard limits on what a page may cost (JavaScript size, load time) and measure on a slow phone, because that's where users feel it.",
        here: "Under 170 KB of JavaScript per page, pre-sized images, self-hosted fonts and deferred third-party scripts, tracked with Core Web Vitals (LCP, INP, CLS).",
        watch: "Testing only on a fast laptop on office Wi-Fi.",
        tags: ["LCP", "INP", "CLS"],
      },
    ],
  },
  {
    id: "backend",
    index: "04",
    title: "Backend",
    kicker: "Go · net/http · sqlc · River",
    intro: "The backend turns requests into reads and writes. The design questions: how the code is split up, what happens during a request versus later, and how a request is checked before it costs anything.",
    items: [
      {
        title: "Monolith or microservices",
        concept: "A monolith deploys as one unit; microservices split it into separately deployed services that talk over the network. Splitting buys independence and costs complexity.",
        here: "A modular monolith in Go: one deployable with strict package boundaries. Only the realtime gateway and the workers run separately, because they scale on different things.",
        watch: "Microservices on day one: network calls, versioning and distributed debugging before you have the problems they solve.",
        tags: ["modular monolith"],
      },
      {
        title: "Stateless services",
        concept: "If a server keeps nothing between requests, any copy can handle any request, so copies can be added or removed freely.",
        here: "Sessions, cache and jobs live in Postgres and Redis. API tasks hold nothing of their own, so ECS can add or remove them every few minutes.",
        watch: "Keeping uploads or sessions on a server's own disk: the next request lands on a different server.",
        tags: ["stateless", "horizontal scaling"],
      },
      {
        title: "Middleware pipeline",
        concept: "Checks run in order before your code. Put the cheapest first, so bad requests are rejected before they cost anything.",
        here: "Request id → rate limit → sign-in check → permission check → input validation → handler. The map above shows exactly where each bad request stops.",
        watch: "Validating input after you've already queried the database.",
        tags: ["rate limiting", "RBAC", "validation"],
      },
      {
        title: "Sync vs async work",
        concept: "Do inside the request only what the user must wait for. Everything else goes to a background job.",
        here: "Emails, PDFs, thumbnails and webhooks run as River jobs. The job is saved in the same database transaction as the data, so neither can exist without the other.",
        watch: "Sending an email inside the request: slow responses, and an email for an order that then rolled back.",
        tags: ["background jobs", "transactions"],
      },
      {
        title: "Idempotency & retries",
        concept: "An idempotent operation gives the same result if it runs twice. That's what makes retries safe.",
        here: "Jobs are unique by their business id and check whether their work is already done; clients only auto-retry idempotent requests.",
        watch: "Retries without idempotency: duplicate charges and duplicate emails.",
        tags: ["idempotency"],
      },
      {
        title: "Real-time updates",
        concept: "Instead of the browser asking “anything new?” every few seconds (polling), the server pushes updates over an open WebSocket.",
        here: "A Go gateway holds the sockets, and Redis pub/sub lets an event raised on any server reach every connected user.",
        watch: "Pushing only to sockets on the same server: users connected elsewhere never see the update.",
        tags: ["WebSockets", "pub/sub"],
      },
    ],
  },
  {
    id: "data",
    index: "05",
    title: "Database & storage",
    kicker: "PostgreSQL · Valkey · S3",
    intro: "Data is the hardest part to change later. The design questions: where the truth lives, how reads stay fast as traffic grows, and how you get everything back when something breaks.",
    items: [
      {
        title: "Choosing a database",
        concept: "Relational databases (Postgres, MySQL) give transactions and constraints; document stores give flexible shapes. Most products are relational at heart.",
        here: "PostgreSQL holds everything important, with JSONB for the genuinely flexible parts. It also runs search and the job queue, so there are fewer systems to pay for.",
        watch: "Picking a database for its scaling story instead of the shape of your data.",
        tags: ["PostgreSQL", "JSONB"],
      },
      {
        title: "Schema & integrity",
        concept: "Let the database enforce the rules (foreign keys, unique constraints, NOT NULL). Code has bugs; constraints don't forget.",
        here: "Time-ordered UUIDv7 keys, foreign keys everywhere, and an org_id on every tenant table, backed by row-level security so one customer can never read another's rows.",
        watch: "Checking uniqueness only in code: two requests at the same moment both pass the check.",
        tags: ["constraints", "row-level security"],
      },
      {
        title: "Indexes",
        concept: "An index is a sorted copy of some columns that turns a full table scan into a quick lookup. Each one speeds up reads and slows down writes a little.",
        here: "Composite indexes that match each query's WHERE and ORDER BY, partial indexes for hot subsets, and EXPLAIN ANALYZE on anything slower than ~50 ms.",
        watch: "Indexing every column “just in case”: writes slow down and the indexes eat memory.",
        tags: ["composite index", "EXPLAIN"],
      },
      {
        title: "Caching",
        concept: "Cache-aside: read from the cache first; on a miss, load from the database and store the result with an expiry (TTL). Delete the key when the data changes.",
        here: "Redis (Valkey) with short TTLs plus a little random jitter, so keys don't all expire at once. If the cache fails, requests fall back to the database instead of failing.",
        watch: "Caching without invalidation: users see stale data and nothing clears it.",
        tags: ["cache-aside", "TTL"],
      },
      {
        title: "Replicas & partitions",
        concept: "A replica is a read-only copy that takes read load. Partitioning splits one huge table into smaller pieces, by time or by customer.",
        here: "One read replica serves search, reports and exports. Audit and event tables are partitioned by month, and old months are archived to S3.",
        watch: "Reading your own write from a replica: it may not have arrived there yet (replication lag).",
        tags: ["read replica", "partitioning"],
      },
      {
        title: "Backups & recovery",
        concept: "RPO is how much data you can afford to lose; RTO is how long you can afford to be down. A backup only counts once you've restored it.",
        here: "Point-in-time recovery (lose at most ~5 minutes), daily snapshots copied to a second region, and a restore drill every month.",
        watch: "Backups nobody has ever restored are a hope, not a plan.",
        tags: ["RPO", "RTO", "PITR"],
      },
    ],
  },
  {
    id: "cloud",
    index: "06",
    title: "Cloud infrastructure",
    kicker: "AWS · ECS on EC2 · Docker · Nginx · Terraform",
    intro: "Infrastructure is where the code runs and how traffic reaches it. The design questions: how traffic is spread out, what is exposed to the internet, and whether the whole thing can be rebuilt from scratch.",
    items: [
      {
        title: "CDN & edge",
        concept: "A CDN keeps copies of content in data centres near users, so most requests are answered nearby without touching your servers.",
        here: "Cloudflare serves static and ISR pages, scripts and images, and filters attacks (WAF, DDoS) before anything reaches AWS. It's the biggest cost saver in the design.",
        watch: "Sending cacheable pages with no-cache headers: you pay for origin traffic for nothing.",
        tags: ["CDN", "WAF"],
      },
      {
        title: "Load balancing",
        concept: "A load balancer spreads requests across healthy servers and takes broken ones out of rotation.",
        here: "An ALB handles HTTPS and routes /, /api and /ws to their services. Nginx inside each task adds rate limits, compression and request ids.",
        watch: "Health checks that only test “the process is up” while its database connection is dead.",
        tags: ["ALB", "Nginx", "health checks"],
      },
      {
        title: "Availability zones",
        concept: "An availability zone is a separate data centre. Running in two means one can fail without taking you down.",
        here: "App tasks are spread across two zones, and Postgres keeps a standby copy in the second zone that takes over automatically.",
        watch: "Running everything in one zone “for now”.",
        tags: ["Multi-AZ", "failover"],
      },
      {
        title: "Networks & isolation",
        concept: "Only the front door should be reachable from the internet. Everything else lives in private networks.",
        here: "Public subnets hold only the load balancer and NAT; app tasks are private; databases are isolated with no internet route; security groups allow only the next hop.",
        watch: "A database with a public IP “just for debugging”.",
        tags: ["VPC", "subnets", "security groups"],
      },
      {
        title: "Containers & compute",
        concept: "Containers package an app with everything it needs so it runs the same anywhere. An orchestrator decides where they run and keeps them alive.",
        here: "Docker images scheduled by ECS onto Graviton EC2 instances. The steady baseline runs on discounted Savings Plan capacity; bursts and workers run on cheap Spot capacity.",
        watch: "Hand-configured servers that nobody can rebuild.",
        tags: ["Docker", "ECS", "Spot"],
      },
      {
        title: "Infrastructure as code",
        concept: "Describe infrastructure in files, review changes like code, and apply them automatically.",
        here: "Terraform modules for each tier, a plan posted on every pull request and applied on merge. The same modules can rebuild everything in another region if this one fails.",
        watch: "Console clicks: nobody knows why a setting exists or how to recreate it.",
        tags: ["Terraform", "IaC"],
      },
    ],
  },
  {
    id: "devops",
    index: "07",
    title: "DevOps & CI/CD",
    kicker: "GitHub Actions · ECR · ECS · Terraform",
    intro: "Delivery is how a change reaches users safely. The design questions: what checks every change must pass, how a release is rolled out, and how fast it can be undone.",
    items: [
      {
        title: "Continuous integration",
        concept: "Every change is built and tested automatically before it can merge.",
        here: "Go tests with the race detector against a real Postgres, a check that every migration applies, Playwright end-to-end tests, and load tests before big launches.",
        watch: "Tests that only ever run on someone's laptop.",
        tags: ["CI", "Playwright", "k6"],
      },
      {
        title: "Supply-chain security",
        concept: "Check not just your own code but everything it's built from: dependencies, base images and any secrets that slip in.",
        here: "Secret scanning, CodeQL, Dependabot and a Trivy image scan on every pull request. Images are signed, and only signed images can deploy.",
        watch: "Pulling a floating “latest” image or action that can change under you.",
        tags: ["CodeQL", "Trivy", "cosign"],
      },
      {
        title: "Environments",
        concept: "A change moves through environments (preview → staging → production), and the same built artifact is promoted at each step.",
        here: "A temporary preview environment for each pull request, a staging environment that sleeps at night, then production, all with one image promoted unchanged.",
        watch: "Rebuilding for each environment: what you tested isn't exactly what you ship.",
        tags: ["preview envs", "promotion"],
      },
      {
        title: "Release strategies",
        concept: "Blue/green switches all traffic from the old version to the new one at once. A canary sends a small share first and widens it if all is well.",
        here: "ECS canary releases: 10% of traffic for 10 minutes, then everyone. If errors or latency rise, traffic goes back to the old version automatically.",
        watch: "Big-bang releases on a Friday evening.",
        tags: ["canary", "blue/green", "rollback"],
      },
      {
        title: "Feature flags",
        concept: "Ship code switched off, then switch it on for some users. Deploying and releasing become separate decisions.",
        here: "Unfinished work hides behind flags; new features roll out gradually and can be turned off without a deploy.",
        watch: "Flags that are never cleaned up and pile into combinations nobody has tested.",
        tags: ["feature flags"],
      },
      {
        title: "Database migrations",
        concept: "During a deploy, old and new code run side by side, so every schema change must work with both.",
        here: "Expand → migrate → contract: add the new column, backfill it, switch the code over, and only remove the old column in a later release.",
        watch: "Renaming a column in one step: the old code still running breaks instantly.",
        tags: ["migrations", "zero downtime"],
      },
    ],
  },
  {
    id: "security",
    index: "08",
    title: "Security & monitoring",
    kicker: "IAM · Secrets Manager · GuardDuty · OpenTelemetry",
    intro: "Security and monitoring decide how bad a bad day gets. The design questions: who can do what, where secrets live, and how quickly you notice when something is wrong.",
    items: [
      {
        title: "Defence in depth",
        concept: "Stack several independent layers (edge, network, identity, application, data), so one failure isn't a breach.",
        here: "Cloudflare's WAF, private subnets, IAM roles, sign-in and permission checks, then row-level security in Postgres. The map above shows which layer stops each attack.",
        watch: "One strong wall with nothing behind it.",
        tags: ["layers", "WAF"],
      },
      {
        title: "Least privilege",
        concept: "Every person and service gets only the permissions it needs, and nothing more.",
        here: "Separate AWS accounts per environment, single sign-on for people, short-lived OIDC credentials for CI, no stored keys and no SSH.",
        watch: "One admin key shared across the team and pasted into CI.",
        tags: ["IAM", "OIDC", "SSO"],
      },
      {
        title: "Secrets",
        concept: "Passwords and API keys live in a secrets manager, are fetched when the app starts, and are rotated regularly.",
        here: "AWS Secrets Manager with KMS encryption; database credentials rotate automatically; push protection stops secrets from reaching git at all.",
        watch: "Secrets in a committed .env file or baked into a container image.",
        tags: ["Secrets Manager", "rotation"],
      },
      {
        title: "Application security",
        concept: "Never trust input or the client. Check permissions on the server for every single request.",
        here: "The customer (tenant) comes from the session, never from the request; SQL always uses bound parameters; strict CSP and HSTS headers; an append-only audit log.",
        watch: "Hiding a button in the UI and calling it access control.",
        tags: ["authorization", "CSP"],
      },
      {
        title: "Observability",
        concept: "Logs tell you what happened, metrics tell you how much, traces tell you where the time went. You need all three.",
        here: "OpenTelemetry in every service sends data to managed Grafana. Every error and slow request is traced, plus a sample of the rest; logs are kept for 14 days.",
        watch: "Logging everything forever: a huge bill and no time to read any of it.",
        tags: ["logs", "metrics", "traces"],
      },
      {
        title: "SLOs & alerting",
        concept: "An SLO is a target, such as 99.9% of requests succeeding. The error budget is the 0.1% you're allowed to fail. Alert when it's being used up too fast.",
        here: "Alerts on how fast the error budget burns, not on CPU. Each alert links a runbook, and external uptime checks catch what internal ones can't see.",
        watch: "Paging on every CPU spike until everyone learns to ignore alerts.",
        tags: ["SLO", "error budget", "runbooks"],
      },
    ],
  },
];

/* ---------------- Visual data ---------------- */

export type Table = { name: string; cols: { n: string; t: string; k?: "pk" | "fk" | "uq"; ref?: string }[]; idx?: string };
export const TABLES: Table[] = [
  { name: "users", cols: [{ n: "id", t: "uuid", k: "pk" }, { n: "email", t: "citext", k: "uq" }, { n: "password_hash", t: "text" }, { n: "created_at", t: "timestamptz" }] },
  { name: "orgs", cols: [{ n: "id", t: "uuid", k: "pk" }, { n: "name", t: "text" }, { n: "plan", t: "plan_tier" }, { n: "created_at", t: "timestamptz" }] },
  {
    name: "memberships",
    cols: [{ n: "org_id", t: "uuid", k: "fk", ref: "orgs" }, { n: "user_id", t: "uuid", k: "fk", ref: "users" }, { n: "role", t: "org_role" }],
    idx: "pk (org_id, user_id)",
  },
  {
    name: "projects",
    cols: [{ n: "id", t: "uuid", k: "pk" }, { n: "org_id", t: "uuid", k: "fk", ref: "orgs" }, { n: "name", t: "text" }, { n: "settings", t: "jsonb" }],
    idx: "(org_id, created_at desc)",
  },
  {
    name: "deployments",
    cols: [{ n: "id", t: "uuid", k: "pk" }, { n: "project_id", t: "uuid", k: "fk", ref: "projects" }, { n: "sha", t: "char(40)" }, { n: "status", t: "deploy_status" }],
    idx: "(project_id) where status = 'running'",
  },
  {
    name: "audit_log",
    cols: [{ n: "id", t: "bigint", k: "pk" }, { n: "org_id", t: "uuid", k: "fk", ref: "orgs" }, { n: "actor_id", t: "uuid", k: "fk", ref: "users" }, { n: "action", t: "text" }, { n: "at", t: "timestamptz" }],
    idx: "(org_id, at desc), partitioned by month",
  },
];

/* ---------------- Learning scaffolding ---------------- */

// The order to think through any system design question.
export const LEARNING_PATH: { n: string; title: string; question: string; to: PartId }[] = [
  { n: "1", title: "Requirements", question: "What must it do, and how well?", to: "requirements" },
  { n: "2", title: "Estimates", question: "How big will it get?", to: "requirements" },
  { n: "3", title: "High-level design", question: "Which boxes, joined how?", to: "architecture" },
  { n: "4", title: "Deep dives", question: "How does each layer work?", to: "frontend" },
  { n: "5", title: "Infrastructure", question: "Where does it run, how does it ship?", to: "cloud" },
  { n: "6", title: "Safety", question: "How is it protected and watched?", to: "security" },
  { n: "7", title: "Scaling", question: "What breaks first, and then what?", to: "scaling" },
  { n: "8", title: "Trade-offs", question: "What did each choice cost?", to: "decisions" },
];

export const FUNCTIONAL = [
  "Sign up, sign in, and belong to organisations with roles",
  "Create and edit projects; see changes from teammates live",
  "Upload files and generate reports",
  "Search across everything you can access",
  "Get email and push notifications",
];

export const NON_FUNCTIONAL = [
  { k: "Scale", v: "1M monthly active users" },
  { k: "Availability", v: "99.9% (≈ 43 min of downtime a month)" },
  { k: "Speed", v: "p95 API response under 300 ms" },
  { k: "Durability", v: "lose at most ~5 minutes of data" },
  { k: "Security", v: "customers can never see each other's data" },
  { k: "Cost", v: "as lean as possible without risking the above" },
];

export const SCALING_IDEAS: Item[] = [
  {
    title: "Scale up vs scale out",
    concept: "Scaling up means a bigger machine; scaling out means more machines. Up is simple but hits a ceiling; out needs services that keep no state of their own.",
    here: "The app tiers scale out (more ECS tasks); the database scales up (a bigger instance) and adds a read replica.",
    watch: "Scaling out a service that keeps state in memory: each copy disagrees with the others.",
    tags: ["vertical", "horizontal"],
  },
  {
    title: "Cache before you scale",
    concept: "The cheapest request is the one you never serve. Cache at the edge first, then in memory, and only then make the database bigger.",
    here: "About 70% of requests stop at Cloudflare and most reads hit Redis, so only ~600 req/s reach the servers at peak and the database sees ~400 queries a second.",
    watch: "Buying a bigger database for reads a cache could have absorbed.",
    tags: ["edge cache", "Redis"],
  },
  {
    title: "Find the bottleneck",
    concept: "A system is only as fast as its slowest part. Measure, fix the biggest limit, then measure again.",
    here: "At this size the likely order is database connections (handled by RDS Proxy), then read load (cache and replica), then search (moves to OpenSearch at around 5M users).",
    watch: "Adding servers when the database is the real limit.",
    tags: ["bottleneck", "load testing"],
  },
];

export const GLOSSARY: { term: string; def: string; to: PartId }[] = [
  { term: "Latency", def: "How long one request takes. Usually reported as p95: 95% of requests are faster than this.", to: "requirements" },
  { term: "Throughput", def: "How many requests a system handles per second.", to: "requirements" },
  { term: "CDN", def: "A network of servers near users that keeps copies of content, so requests don't travel to your origin.", to: "cloud" },
  { term: "Load balancer", def: "Spreads incoming requests across healthy servers and removes broken ones.", to: "cloud" },
  { term: "Stateless", def: "A service that keeps nothing between requests, so any copy can serve any request.", to: "backend" },
  { term: "Horizontal scaling", def: "Adding more machines, instead of making one machine bigger (vertical scaling).", to: "scaling" },
  { term: "Cache-aside", def: "Check the cache first; on a miss, read the database and store the result with an expiry.", to: "data" },
  { term: "TTL", def: "Time to live: how long a cached value is kept before it expires.", to: "data" },
  { term: "Read replica", def: "A read-only copy of a database that takes read traffic off the primary.", to: "data" },
  { term: "Replication lag", def: "The delay before a write on the primary shows up on a replica.", to: "data" },
  { term: "Partitioning", def: "Splitting one large table into smaller pieces, usually by time or by customer.", to: "data" },
  { term: "Idempotent", def: "Safe to run more than once with the same result, which is what makes retries safe.", to: "backend" },
  { term: "Background job", def: "Work done outside the request, so the user doesn't wait for it.", to: "backend" },
  { term: "WebSocket", def: "A connection that stays open so the server can push updates to the browser.", to: "backend" },
  { term: "Rate limiting", def: "Capping how many requests a client may make in a time window.", to: "backend" },
  { term: "Availability zone", def: "A physically separate data centre within a cloud region.", to: "cloud" },
  { term: "Canary release", def: "Sending a small share of traffic to a new version before everyone gets it.", to: "devops" },
  { term: "Blue/green", def: "Running old and new versions side by side and switching all traffic at once.", to: "devops" },
  { term: "Least privilege", def: "Giving each person or service only the permissions it needs.", to: "security" },
  { term: "SLO & error budget", def: "A reliability target (say 99.9%) and the small share of failures it allows.", to: "security" },
  { term: "RPO / RTO", def: "How much data you can lose, and how long you can be down, after a failure.", to: "data" },
  { term: "Infrastructure as code", def: "Defining servers, networks and databases in reviewed files instead of by hand.", to: "cloud" },
];

/* ---------------- Capacity (design targets) ---------------- */

export const SIZING: { svc: string; runs: string; normal: string; peak: string; scales: string }[] = [
  { svc: "Web (Next.js + Nginx)", runs: "On-Demand + Spot", normal: "2 tasks", peak: "6 tasks", scales: "requests per task" },
  { svc: "API (Go + Nginx)", runs: "On-Demand + Spot", normal: "2 tasks", peak: "8 tasks", scales: "requests per task" },
  { svc: "Realtime gateway", runs: "On-Demand", normal: "2 tasks", peak: "4 tasks", scales: "open connections" },
  { svc: "Workers (River)", runs: "Spot", normal: "1 task", peak: "6 tasks", scales: "queue depth" },
  { svc: "PostgreSQL", runs: "RDS Multi-AZ", normal: "primary + standby + 1 replica", peak: "same, bigger replica if needed", scales: "instance size" },
  { svc: "Valkey", runs: "ElastiCache", normal: "primary + replica", peak: "same", scales: "memory" },
];

export const LEVERS = [
  { title: "Cache at the edge first", body: "Static pages, ISR pages, scripts and images are served by Cloudflare. Most traffic never reaches AWS, so the fleet stays small and data-transfer costs stay low." },
  { title: "Graviton, Savings Plans, Spot", body: "ARM instances run the same containers for less. The steady baseline is covered by a Savings Plan; peaks and all background workers run on Spot." },
  { title: "No cluster you don't need", body: "Search runs on the read replica, jobs live in Postgres, and Redis is a single primary. Each of those is a whole cluster not being paid for." },
  { title: "Pack containers, scale both ways", body: "ECS bin-packs tasks onto fewer instances, scales out on real demand and back in when it passes. Nothing sits idle at 3 a.m." },
  { title: "Environments that sleep", body: "Preview environments are deleted on merge; staging scales to zero at night and on weekends." },
  { title: "Keep only what you use", body: "Traces are sampled, logs expire after 14 days hot, old partitions and cold files move to cheaper S3 tiers." },
];

export const SLOS = [
  { name: "Availability", target: "99.9%", note: "≈ 43 min of error budget a month" },
  { name: "p95 latency", target: "< 300 ms", note: "API, per route" },
  { name: "Error rate", target: "< 0.5%", note: "5xx over all requests" },
  { name: "Queue lag", target: "< 30 s", note: "oldest waiting job" },
];

export const ALERTS = [
  { sev: "page", rule: "Error budget burning 14.4× faster than allowed, over both 1 h and 5 min" },
  { sev: "page", rule: "p95 latency above 300 ms for 10 min on a top-5 route" },
  { sev: "ticket", rule: "A job failed its final retry" },
  { sev: "ticket", rule: "Spend forecast 20% over this month's budget" },
];

/* ---------------- Decisions ---------------- */

export type Decision = { area: string; chose: string; over: string; why: string; cost: string; switchWhen: string };

export const DECISIONS: Decision[] = [
  {
    area: "Architecture",
    chose: "Modular monolith + separate real-time and workers",
    over: "microservices from day one",
    why: "One deploy, one repo, transactions across modules, and refactors that don't need a version handshake. Real-time and jobs are split because they scale on different things.",
    cost: "Modules must keep their boundaries by discipline and lint rules, not network walls.",
    switchWhen: "A module needs its own scaling, its own release cadence, or its own team.",
  },
  {
    area: "Language",
    chose: "Go with net/http and sqlc",
    over: "Node.js / NestJS, or Go with an ORM",
    why: "Small static binaries with low, predictable memory and cheap concurrency, so fewer and smaller instances serve the same traffic. sqlc keeps SQL explicit and type-checked.",
    cost: "More boilerplate than NestJS, and types reach the TypeScript frontend only through generated OpenAPI clients.",
    switchWhen: "A small all-TypeScript team where sharing types end to end matters more than runtime cost: NestJS.",
  },
  {
    area: "Compute",
    chose: "ECS on Graviton EC2, Nginx in each task",
    over: "plain EC2 Auto Scaling, Fargate, or Kubernetes (EKS)",
    why: "ECS costs nothing on top of the instances, packs containers tightly, scales each service on its own signal and does canary releases built in. EC2 underneath allows Savings Plans and Spot, which Fargate prices can't match at steady load.",
    cost: "Instances to patch (a monthly image refresh through the launch template).",
    switchWhen: "Many teams and services needing a common platform: EKS. Very spiky, small workloads: Fargate.",
  },
  {
    area: "Database",
    chose: "RDS PostgreSQL Multi-AZ + one read replica",
    over: "Aurora, MySQL, or MongoDB as the main store",
    why: "Relational data with transactions and constraints, JSONB for flexible parts, search and the job queue built in. Plain RDS on Graviton with gp3 storage costs noticeably less than Aurora at this size.",
    cost: "Failover takes a minute or two instead of Aurora's ~30 seconds.",
    switchWhen: "Faster failover, many replicas or a cross-region copy become worth paying for: Aurora, Global Database later.",
  },
  {
    area: "Search",
    chose: "Postgres full-text + trigram, on the replica",
    over: "OpenSearch from day one",
    why: "No cluster to run, pay for or keep in sync. Full-text search and trigram matching cover search and typo-tolerant autocomplete for most products.",
    cost: "Weaker relevance tuning, facets and language analysis than a dedicated engine.",
    switchWhen: "Search becomes a product in itself, or its load affects the replica: OpenSearch, fed by jobs.",
  },
  {
    area: "Jobs",
    chose: "River (jobs in Postgres)",
    over: "Redis-based queues, SQS, RabbitMQ",
    why: "Jobs live with the data, so enqueueing is part of the transaction: no outbox table, no lost or phantom jobs, and no separate queue to pay for.",
    cost: "Throughput is bounded by Postgres.",
    switchWhen: "Tens of thousands of jobs a second, or fan-out to many consumers: SQS and SNS.",
  },
  {
    area: "Rendering",
    chose: "Next.js Pages Router",
    over: "the App Router, or an SPA + separate SSR service",
    why: "Static, ISR, SSR and client rendering in one framework, chosen per page with one explicit data function each. Simple to reason about and review; STRUX and MapGeox run on it.",
    cost: "Whole-page hydration and no streaming or Server Components, so JavaScript budgets rely on next/dynamic and discipline.",
    switchWhen: "Pages need streaming or Server Components to cut client JavaScript: move them route by route, since app/ and pages/ can run side by side.",
  },
  {
    area: "Real-time",
    chose: "A Go WebSocket gateway",
    over: "Socket.IO, or a managed service (Pusher, Ably)",
    why: "One language across the backend, Redis pub/sub for fan-out, and no per-message bill: at 20k concurrent users a managed service would cost more than the two tasks it replaces.",
    cost: "Reconnects and fallbacks are mine to handle; Socket.IO gives them for free.",
    switchWhen: "Global fan-out at scale, or when running sockets costs more than a managed service.",
  },
  {
    area: "Delivery",
    chose: "Signed images in ECR, ECS canary over OIDC",
    over: "SSH deploys, stored cloud keys, all-at-once releases",
    why: "What was tested and signed is exactly what runs, a bad release reaches 10% of users for minutes before it's rolled back, and the pipeline holds no long-lived credentials.",
    cost: "Old and new tasks run side by side for about 10 minutes per deploy.",
    switchWhen: "Never back to SSH or all-at-once releases.",
  },
  {
    area: "Cost",
    chose: "Graviton + Savings Plans for the baseline, Spot for the rest",
    over: "on-demand x86 for everything",
    why: "The same containers run on ARM for less; the predictable baseline is pre-paid at a discount, and bursts and background workers use spare capacity at a fraction of the price.",
    cost: "Spot instances can be reclaimed, so only work that can be retried or spread out runs there.",
    switchWhen: "Never fully back; revisit the Savings Plan size every quarter.",
  },
  {
    area: "Disaster recovery",
    chose: "Standby region rebuilt from Terraform and backup copies",
    over: "a warm copy of everything, or active-active regions",
    why: "Backups and critical files are already copied to a second region; Terraform can rebuild the rest there in about two hours. Almost nothing runs in the standby region until it's needed.",
    cost: "A region outage means about two hours down and up to a few minutes of data lost.",
    switchWhen: "The business can't accept two hours: Aurora Global Database and a warm standby fleet.",
  },
  {
    area: "Observability",
    chose: "OpenTelemetry into managed Grafana, sampled",
    over: "one vendor's APM, CloudWatch alone, or self-hosting the stack",
    why: "Instrument once and change backends later; logs, metrics and traces linked in one place. Sampling and short retention keep the bill flat as traffic grows.",
    cost: "Not every healthy request's trace is kept.",
    switchWhen: "Monitoring spend grows past what running Loki, Prometheus and Tempo yourself would cost.",
  },
];

/* Beyond the 1M design: what changes next, and the signal for each step. */
export const LADDER = [
  {
    stage: "1M",
    name: "This design",
    users: "monthly active",
    infra: ["ECS on Graviton across 2 zones, Spot for bursts", "RDS Postgres Multi-AZ + read replica", "Search and jobs inside Postgres"],
    next: "you're here",
  },
  {
    stage: "5M",
    name: "Dedicated engines",
    users: "≈ 5M monthly",
    infra: ["Aurora with more readers", "OpenSearch for search", "SQS for high-volume notifications"],
    next: "the replica or queue depth becomes the bottleneck",
  },
  {
    stage: "20M",
    name: "Split by boundary",
    users: "≈ 20M monthly",
    infra: ["Extract the modules whose load differs", "Third zone, warm standby region", "Partition the biggest tables by tenant"],
    next: "one module's load or team clearly differs from the rest",
  },
  {
    stage: "50M+",
    name: "Cells & regions",
    users: "50M+ monthly",
    infra: ["Independent cells of the whole stack", "Users served from the nearest region", "Global database or per-region data"],
    next: "the numbers say so, not before",
  },
];

export const BP_STATS = {
  components: NODES.length,
  decisions: DECISIONS.length,
  terms: GLOSSARY.length,
};

export const BP_TOC: { id: PartId; index: string; label: string }[] = [
  { id: "requirements", index: "01", label: "Requirements" },
  { id: "architecture", index: "02", label: "High-level design" },
  ...PARTS.map((p) => ({ id: p.id, index: p.index, label: p.title })),
  { id: "scaling", index: "09", label: "Scaling" },
  { id: "decisions", index: "10", label: "Trade-offs" },
  { id: "glossary", index: "11", label: "Glossary" },
];

/* ---------------- Check yourself ---------------- */

export type Quiz = { q: string; options: string[]; answer: number; explain: string };

export const QUIZ: Partial<Record<PartId, Quiz>> = {
  requirements: {
    q: "1M monthly users, ~15% active on a given day, ~130 requests each. Roughly what is the average load?",
    options: ["~23 requests a second", "~230 requests a second", "~2,300 requests a second"],
    answer: 1,
    explain: "150k daily users × 130 = ~20M requests a day; ÷ 86,400 seconds ≈ 230 a second. Peaks run several times higher, and peaks are what you size for.",
  },
  architecture: {
    q: "Why do the realtime gateway and the workers run separately from the API?",
    options: ["They scale on different things: open connections and queue depth, not requests", "They're written in a different language", "Microservices are always the better choice"],
    answer: 0,
    explain: "Split a service out when it scales or fails differently. The gateway grows with connected users and the workers with queued jobs, while the API grows with requests.",
  },
  frontend: {
    q: "A pricing page is identical for every visitor and changes about once a month. How should it be rendered?",
    options: ["Server-rendered on every request", "Rendered in the browser", "Built ahead of time and cached at the edge"],
    answer: 2,
    explain: "Static generation plus a CDN means no server work per visit and the fastest possible load. Rebuild it when the content changes.",
  },
  backend: {
    q: "Placing an order should also send a confirmation email. Where should the email be sent?",
    options: ["Inside the request, before responding", "From a background job saved in the same transaction as the order", "From the browser, after the response arrives"],
    answer: 1,
    explain: "The user shouldn't wait for an email provider, and saving the job with the order means you never email about an order that rolled back, or lose the email for one that didn't.",
  },
  data: {
    q: "A user saves a new display name, but the next page still shows the old one. What's the most likely cause?",
    options: ["A missing index", "The read hit a replica that hadn't caught up, or a cache key wasn't invalidated", "The CDN is down"],
    answer: 1,
    explain: "Classic read-your-own-write problem. Read the user's own fresh data from the primary, and delete the cache key when the data changes.",
  },
  cloud: {
    q: "Which of these belongs in a public subnet?",
    options: ["The database", "The background workers", "The load balancer"],
    answer: 2,
    explain: "Only the front door should be reachable from the internet. The app and data tiers sit in private and isolated subnets behind it.",
  },
  devops: {
    q: "You rename a database column in a single migration and deploy. What breaks?",
    options: ["Nothing; migrations run first", "The old version of the app, still serving traffic during the deploy", "Only the tests"],
    answer: 1,
    explain: "Old and new code overlap during every deploy. Expand → migrate → contract: add the new column, switch the code, and remove the old column in a later release.",
  },
  security: {
    q: "How should the API decide which customer's data a request may read?",
    options: ["From a customerId sent in the request", "From the signed-in session, checked on the server", "By hiding other customers in the UI"],
    answer: 1,
    explain: "Anything in the request can be forged. The tenant comes from the server-side session, and row-level security backs it up in the database.",
  },
  scaling: {
    q: "The API is slow and the database sits at 95% CPU. What will adding more API servers do?",
    options: ["Fix it", "Halve the latency", "Nothing useful, or make it worse: the database is the bottleneck"],
    answer: 2,
    explain: "More API servers send even more queries to the same overloaded database. Cache reads, add a replica, fix slow queries, or scale the database up.",
  },
};
