// Single source of truth for every page. Content carried over from the
// previous portfolio (portio); only the presentation is new.

export const PROFILE = {
  name: "Biprodeep Bose",
  handle: "biprodeep",
  accountId: "bb-0412-2026",
  role: "Full-Stack Developer & DevOps Engineer",
  summary:
    "I architect scalable digital platforms and automated workflows. Currently exploring the intersection of precise software engineering and robust cloud infrastructure.",
  location: "Remote",
  site: "https://biprodeep.me",
  email: "bipbose123@gmail.com",
  github: "https://github.com/Biprodeep12",
  linkedin: "https://www.linkedin.com/in/biprodeep-bose/",
  instagram: "https://www.instagram.com/bosebd/",
  motto: "Go For It",
} as const;

// Optional long-form write-up shown on /projects/<id>. Leave fields out until
// you have real facts; the page only renders sections that exist.
export type CaseStudy = {
  problem?: string;
  approach?: string;
  decisions?: { title: string; why: string }[];
  results?: string[];
  hindsight?: string;
};

export type Project = {
  id: string;
  name: string;
  title: string;
  description: string;
  image: string;
  url: string;
  stack: string[];
  type: string;
  status: "Running" | "Stopped";
  caseStudy?: CaseStudy;
};

export const PROJECTS: Project[] = [
  {
    id: "strux",
    name: "STRUX",
    title: "Cloud Infrastructure, Simplified",
    description:
      "STRUX is a unified control layer for AWS that lets you launch, deploy, monitor, and automate infrastructure from one clean interface.",
    image: "/projectX.webp",
    url: "https://strux.biprodeep.me",
    stack: ["Next.js", "WebSockets", "AWS"],
    type: "Cloud platform",
    status: "Running",
    caseStudy: {
      problem:
        "Getting a Node.js or Docker app onto AWS usually means hand-building a VPC, subnet, internet gateway, routes and security group in the console, then SSH-ing in to deploy, schedule jobs and watch metrics. STRUX turns that into one dashboard: connect an AWS account, pick a template or repo, and get a running, monitored instance on its own subdomain.",
      approach:
        "A Next.js app with 25 API routes drives AWS through the SDK. Launch builds the networking, starts the instance with user-data, creates a per-tenant DNS record and sets up Nginx with HTTPS. A small agent on each instance streams command output back to the browser over WebSockets; CloudWatch powers the metrics view, an AI assistant helps read them, and scheduled jobs are real crontab entries that report their exit codes back.",
      decisions: [
        {
          title: "Assume a role instead of storing AWS keys",
          why: "Users grant access once through a CloudFormation template; STRUX uses short-lived STS credentials with an external ID, and lifecycle actions are limited to resources it tagged itself. No long-lived customer keys to leak.",
        },
        {
          title: "Wake the agent on demand",
          why: "A tiny always-on wake service starts the agent only when the dashboard needs it, and the agent exits after five idle minutes, so an instance isn't paying for a control process it rarely uses.",
        },
        {
          title: "Stream output instead of polling",
          why: "Deploy and command output streams live over WebSockets, and cancelling kills the whole process group (graceful stop, forced after 3 s), so even never-ending commands like log tails stop cleanly.",
        },
        {
          title: "Put guard-rails on scheduled jobs",
          why: "Each cron job gets a 30-minute timeout, safe escaping and a per-instance limit, and reports its result through a hashed callback token, so automation can't silently pile up or hang.",
        },
      ],
      results: [
        "102 commits over 39 days of work (Jan–Apr 2026), live at strux.biprodeep.me",
        "20 AWS operations across EC2, VPC and CloudWatch, with 7 live metrics at 60-second resolution",
        "Per-tenant subdomains with automatic HTTPS, plus Node.js and Docker deploy templates",
      ],
      hindsight:
        "Hardening the on-instance agent came later than it should have. Next I'd tighten its authentication and network exposure, replace the hard-coded machine image with a lookup, and add tests around the provisioning flow, which is the part most likely to break as AWS changes.",
    },
  },
  {
    id: "mapgeox",
    name: "MapGeox",
    title: "Smart Transit",
    description:
      "A comprehensive bus tracking and route mapping platform allowing real-time navigation and intelligent booking.",
    image: "/project1.0x.webp",
    url: "https://mapgoex.vercel.app/Info",
    stack: ["Next.js", "WebSockets", "MongoDB"],
    type: "Web application",
    status: "Running",
    caseStudy: {
      problem:
        "City bus commuters rarely know where their bus is or when it will arrive, and buying a ticket still means cash or a queue. MapGeox puts routes, live bus positions, ETAs and QR tickets into one web app.",
      approach:
        "A Next.js app on Vercel with 9 API routes and MongoDB for routes, stops, bookings and reviews. MapLibre renders OpenStreetMap tiles and OpenRouteService handles routing. Live tracking runs on a separate Express + Socket.IO server: each route is a room, and buses move along real road geometry, emitting position, next-stop and stop-reached events every second. An AI assistant answers route questions by calling a tool that reads the actual route data.",
      decisions: [
        {
          title: "A separate long-running socket server",
          why: "Serverless functions can't hold WebSocket connections or timers open, so real-time lives in its own Express + Socket.IO service. The trade-off is a cold start on the free host, which the admin view surfaces instead of hiding.",
        },
        {
          title: "Simulate buses on real roads first",
          why: "Moving buses along routed road lines made the whole experience demoable without GPS hardware, and the server already exposes a location-update endpoint so real devices can replace the simulator later.",
        },
        {
          title: "An open map stack",
          why: "MapLibre, OpenStreetMap and OpenRouteService avoid per-map-load billing and vendor tokens. The cost is respecting OSM's tile usage limits before real production traffic.",
        },
        {
          title: "Ground the assistant in live data",
          why: "The assistant answers through a tool that fetches route and bus data from the database, rather than relying on what the model happens to know.",
        },
      ],
      results: [
        "86 commits on the web app (Aug 2025 – Jun 2026) plus an 11-commit real-time server",
        "First feature release three days after the project started: 11 files and ~3,700 lines in one launch commit",
        "Live at mapgoex.vercel.app with routing, live ETAs, QR tickets, reviews and the AI route assistant",
      ],
      hindsight:
        "I'd tighten authentication across the API before adding features, move every third-party API call behind the server, replace the stored-amount checkout with a real payment step, and test the ETA logic, which currently assumes a constant bus speed.",
    },
  },
];

export type Role = {
  id: string;
  company: string;
  title: string;
  period: string;
  start: string;
  location: string;
  description: string;
  skills: string[];
  status: "Active" | "Completed";
  // Measured numbers only (git history / merged PRs). Edit these here; every
  // label, total, FAQ answer and assistant fact is derived from them.
  mergedPRs?: number;
  commits?: number;
  repos?: number;
  scope?: string;
};

/** Display labels for a role's measured numbers, e.g. "297 merged PRs". */
export function metricsFor(r: Role): string[] {
  const out: string[] = [];
  if (r.mergedPRs) out.push(`${r.mergedPRs.toLocaleString("en-US")} merged PRs`);
  if (r.commits) out.push(`${r.commits.toLocaleString("en-US")}+ commits`);
  if (r.repos) out.push(`${r.repos} repositor${r.repos === 1 ? "y" : "ies"}`);
  if (r.scope) out.push(r.scope);
  return out;
}

export const EXPERIENCE: Role[] = [
  {
    id: "dep-saffronstays",
    company: "SaffronStays",
    title: "Software Development Engineer Intern",
    period: "Apr 2025 – Present",
    start: "2025-04",
    location: "Remote",
    description:
      "Designed end-to-end testing frameworks and engineered scalable search architectures. Integrated analytics to track user behavior, significantly improving both release reliability and SEO discoverability.",
    skills: ["Next.js", "TypeScript", "Go", "Node.js", "Python", "Testing"],
    status: "Active",
    mergedPRs: 297,
    commits: 1100,
    repos: 9,
    scope: "Web, Go, Node.js & Python services",
  },
  {
    id: "dep-cotr",
    company: "Coding On The Rocks",
    title: "Full-Stack Developer",
    period: "Dec 2025 – Present",
    start: "2025-12",
    location: "Remote",
    description:
      "Developed scalable applications with secure authentication and optimized REST APIs. Translated complex business requirements into maintainable, production-ready solutions using modern CI/CD pipelines.",
    skills: ["Next.js", "React Native", "NestJS", "MongoDB", "Socket.IO", "LiveKit"],
    status: "Active",
    mergedPRs: 106,
    commits: 1300,
    repos: 5,
    scope: "Web, mobile, CRM & real-time chat",
  },
];

// When building started (first public project), separate from paid roles.
// Drives the "Independent projects" lane on the timeline and the experience stat.
export const BUILDING_SINCE = {
  start: "2024-08",
  label: "Aug 2024",
  detail: "Personal and open-source projects on GitHub since the first public one in Aug 2024.",
};

/** Earliest paid role start as "YYYY-MM". */
export const FIRST_ROLE_START = [...EXPERIENCE].sort((a, b) => a.start.localeCompare(b.start))[0].start;

/** Time elapsed since a "YYYY-MM" month, computed at render so it never goes stale. */
export function durationSince(ym: string, now = new Date()) {
  const [y, m] = ym.split("-").map(Number);
  const total = Math.max(0, (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m));
  const years = Math.floor(total / 12);
  const months = total % 12;
  const label = [years ? `${years} yr${years > 1 ? "s" : ""}` : "", months ? `${months} mo` : ""].filter(Boolean).join(" ") || "under a month";
  return { total, years, months, label };
}

/** Start of the earliest paid role, e.g. "Apr 2025". */
export const FIRST_ROLE = [...EXPERIENCE].sort((a, b) => a.start.localeCompare(b.start))[0].period.split(" – ")[0];

export const SERVICES = [
  {
    id: "svc-frontend",
    name: "Frontend Architecture",
    description:
      "React & Next.js interfaces crafted with TypeScript. Reusable components, clean structure, and thoughtful UX built for growth. I value readability, scalability, and smooth engineering workflows across the stack.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "svc-devops",
    name: "DevOps & Infrastructure",
    description:
      "Designing highly available backend architecture and automated cloud workflows. Experience setting up containerized services, automated CI/CD pipelines, and secure deployment infrastructure.",
    tags: ["Docker", "CI/CD Pipelines", "AWS/GCP", "Linux"],
  },
  {
    id: "svc-perf",
    name: "Performance Optimization",
    description:
      "Optimizing load times and interactivity. Smaller bundles, faster first paint, fewer re-renders. Aiming for responsive 60fps experiences that feel effortless.",
    tags: ["Bundles", "First paint", "60fps"],
  },
];

export const SKILLS: { group: string; prefix: string; items: string[] }[] = [
  { group: "Languages", prefix: "lang", items: ["TypeScript", "JavaScript", "Python", "C", "Go", "SQL"] },
  {
    group: "Technologies",
    prefix: "tech",
    items: ["React", "Next.js", "Node.js", "Express.js", "NestJS", "React Native", "Tailwind CSS", "Socket.IO", "LiveKit", "AWS", "GraphQL", "Redis", "Nginx", "Linux"],
  },
  { group: "Databases", prefix: "db", items: ["MySQL", "PostgreSQL", "MongoDB", "Elasticsearch", "Firebase"] },
  { group: "Tools & Platforms", prefix: "tool", items: ["Git", "Github", "Docker", "Vercel", "Playwright", "Jest", "Figma"] },
];

export const ABOUT = {
  philosophy: "Coding is a journey of learning and improving daily.",
  background:
    "Coding is never finished—it's a journey of constant discovery. I build products with clear logic, solid architecture, and thoughtful design, driven by curiosity and a desire to learn every day.",
  outside:
    "When I'm away from code, I enjoy learning new tech, gaming with friends, exploring music, or reading about engineering ideas.",
  approach:
    "I believe great products balance usability, performance, and clarity. Code should be scalable and readable — built with purpose. Smooth experiences matter, and details shape how software feels.",
};

// Size is read from public/Resume.pdf at build time (next.config.ts), so swapping the PDF updates it.
export const RESUME = { file: "/Resume.pdf", name: "Resume.pdf", sizeKb: Number(process.env.RESUME_KB) || 0 };

export const SECTIONS = [
  { id: "services", label: "Services", api: "ListServices" },
  { id: "projects", label: "Projects", api: "ListResources" },
  { id: "deployments", label: "Deployments", api: "DescribeDeployments" },
  { id: "stack", label: "Stack", api: "GetStack" },
  { id: "about", label: "Account", api: "GetAccount" },
  { id: "notes", label: "Notes", api: "ListNotes" },
  { id: "faq", label: "FAQ", api: "DescribeFaq" },
  { id: "contact", label: "Support", api: "OpenSupportCenter" },
] as const;
